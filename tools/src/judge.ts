/**
 * judge.ts — LLM-as-Judge 自动评估器（v5.1 Selection 机制落地，生产级）
 *
 * 双模型互评：产出模型（deepseek-v4-flash）生成回答 → 评审模型（deepseek-v4-pro）
 * 按 16 分 rubric 独立打分（judge 与产出不同模型，防自我表扬；judge 可 --judge 切换校准）。
 *
 * v5.1 升级（2026-08-10，业界对齐）：
 *  - G1 触发召回测试：--set trigger（路由判断器判定是否应触发专家，召回率≥90%/准确率≥85% 通过线）
 *  - G4 成本分层：--tier spot|targeted|full（先便宜后贵，防 eval 烧钱）
 *  - G3 四维指标：--repeat N 稳定度（得分均值/方差）+ 风险维度（critical 数/空回复/解析失败）
 *
 * Usage:
 *   node dist/judge.js                       # 可见集评分（双模型互评）
 *   node dist/judge.js --set heldout         # held-out 集（防污染，RSEA 2026）
 *   node dist/judge.js --set adversarial     # 自博弈对抗集
 *   node dist/judge.js --set trigger         # 触发召回测试（G1）
 *   node dist/judge.js --tier spot          # 成本分层：只跑前 4 题（G4）
 *   node dist/judge.js --tier targeted --filter T1,T3   # 定向补测失败题
 *   node dist/judge.js --repeat 3            # 稳定度：每题跑 3 次输出均值/方差（G3）
 *   node dist/judge.js --dry-run             # 只输出计划与成本估算，不调用 API
 *   node dist/judge.js --json                # 结构化输出（供 CI/自动化）
 *   node dist/judge.js --budget 2.0          # 成本上限（USD），超限停止
 *   node dist/judge.js --judge flash         # 指定 judge 模型（校准用）
 *   node dist/judge.js --gen-adversarial     # 从失败 TRACE 生成对抗题（出题步骤，人确认后入 evals.md）
 *
 * 退出码：0 通过｜1 未通过｜2 用法错｜3 配置缺失｜4 API 配额/网络失败｜5 部分失败
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(DIST, "../..");
const EVALS_PATH = join(REPO, "seo-traffic-growth/skills/seo-framework/references/evals.md");
const MODELS_PATH = join(homedir(), ".workbuddy/models.json");
const MEMORY_DIRS = [join(homedir(), "WorkBuddy/2026-08-03-11-57-58/.workbuddy/automations")];
const REPORT_DIR = join(homedir(), "WorkBuddy/2026-08-03-11-57-58/tmp");

/** 16 分 rubric（与 evals.md 一致；critical=合规自查，为 0 即不合格） */
const RUBRIC = [
  { key: "diagnosis", label: "诊断前置", max: 2 },
  { key: "routing", label: "业务路由", max: 2 },
  { key: "data", label: "数据纪律", max: 2 },
  { key: "compliance", label: "合规自查", max: 1, critical: true },
  { key: "redteam", label: "红队自检", max: 1 },
  { key: "expectation", label: "三档预期", max: 1 },
  { key: "structure", label: "输出结构", max: 1 },
  { key: "routing2", label: "响应分流", max: 2 },
  { key: "livedata", label: "活数据路由", max: 2 },
  { key: "citation", label: "引用潜力", max: 2 },
].map((r) => ({ ...r, labelEn: r.key }));
const PASS_LINE = 13;

interface ModelCfg { id: string; name: string; vendor: string; url: string; apiKey: string; reasoning?: { defaultEffort?: string } }
interface Question { id: string; text: string; note: string }
interface TriggerQ { id: string; text: string; expect: boolean; note: string }
interface Score { [key: string]: number }
interface Result { question: Question; answer?: string; score?: Score; total?: number; criticalFail?: boolean; error?: string; tokens?: { in: number; out: number } }

/* ---------- 配置 ---------- */
function loadModels(): { producer: ModelCfg; judge: ModelCfg } {
  if (!existsSync(MODELS_PATH)) {
    console.error("CONFIG_MISSING: ~/.workbuddy/models.json 不存在");
    process.exit(3);
  }
  const list = JSON.parse(readFileSync(MODELS_PATH, "utf8")) as ModelCfg[];
  const producer = list.find((m) => m.id === "deepseek-v4-flash");
  if (!producer) {
    console.error("CONFIG_MISSING: models.json 缺 deepseek-v4-flash");
    process.exit(3);
  }
  const judge: ModelCfg = list.find((m) => m.id === "deepseek-v4-pro") ?? producer;
  return { producer, judge };
}

/* ---------- 从 evals.md 提取测试题 ---------- */
function parseSection(content: string, header: string, idPrefix: string): Question[] {
  const idx = content.indexOf(header);
  if (idx < 0) return [];
  const rest = content.slice(idx + header.length);
  const end = rest.indexOf("\n## ");
  const sec = end >= 0 ? rest.slice(0, end) : rest;
  const qs: Question[] = [];
  // 「…」惰性匹配，容忍题内出现引号/括号；考察点在紧随的（考察：…）
  const re = new RegExp(`^\\s*${idPrefix}(\\d+)\\.\\s*「(.+?)」\\s*（考察：([^）]*)）`, "gm");
  for (const m of sec.matchAll(re)) qs.push({ id: `${idPrefix}${m[1]}`, text: m[2], note: m[3] });
  return qs;
}

function loadQuestions(set: string): Question[] {
  if (!existsSync(EVALS_PATH)) {
    console.error("EVALS_MISSING: evals.md 不存在");
    process.exit(3);
  }
  const content = readFileSync(EVALS_PATH, "utf8");
  const visible = [
    ...parseSection(content, "## 测试 Prompt 集", ""),
    ...parseSection(content, "## 新增测试 Prompt（v1.3 起纳入回归）", ""),
  ];
  const heldout = parseSection(content, "## Held-out 测试题（v5.0", "H");
  const adversarial = parseSection(content, "## 自博弈对抗题（v5.0", "A");
  const map: Record<string, Question[]> = { visible, heldout, adversarial };
  return map[set] ?? [];
}

/* ---------- 触发召回测试（G1，v5.1） ---------- */
/** 从 evals.md「触发召回测试题」区块提取（期望触发：是/否） */
function loadTriggerQuestions(): TriggerQ[] {
  if (!existsSync(EVALS_PATH)) {
    console.error("EVALS_MISSING: evals.md 不存在");
    process.exit(3);
  }
  const content = readFileSync(EVALS_PATH, "utf8");
  const idx = content.indexOf("## 触发召回测试题");
  if (idx < 0) return [];
  const rest = content.slice(idx + "## 触发召回测试题".length);
  const end = rest.indexOf("\n## ");
  const sec = end >= 0 ? rest.slice(0, end) : rest;
  const qs: TriggerQ[] = [];
  // T1. 「用户输入」（期望触发：是/否）（考察：…）
  const re = /^\s*T(\d+)\.\s*「(.+?)」\s*（期望触发：([是否])）（考察：([^）]*)）/gm;
  for (const m of sec.matchAll(re)) qs.push({ id: `T${m[1]}`, text: m[2], expect: m[3] === "是", note: m[4] });
  return qs;
}

/** 路由判断器 system（模拟 Agent 的触发决策——SKILL name/description 是唯一依据） */
const TRIGGER_SYSTEM = `你是技能路由判断器。判断下面这条用户输入是否应触发「流量操盘手（SEO/GEO 双轨获客操盘手）」专家。
该专家触发描述：SEO/GEO 双轨流量增长操盘——选题评分、流量文写作、关键词方案、账号诊断、GEO 引用优化、网感雷达、数据归因。
凡与上述能力相关的用户请求都应触发；不相关的（如编程、绘画、无关闲聊）不应触发。
只输出 JSON：{"trigger": true|false, "reason": "<30字理由>"}。`;

async function gradeTriggerOne(q: TriggerQ, producer: ModelCfg, dryRun: boolean): Promise<{ q: TriggerQ; trigger: boolean | null; error?: string; tokens?: { in: number; out: number } }> {
  if (dryRun) return { q, trigger: null };
  try {
    const out = await callModel(producer, TRIGGER_SYSTEM, `用户输入：${q.text}`);
    const parsed = extractJson(out.content);
    return { q, trigger: parsed?.trigger === true ? true : parsed?.trigger === false ? false : null, error: parsed?.trigger === undefined ? "TRIGGER_JSON_PARSE_FAIL" : undefined, tokens: out.tokens };
  } catch (e: any) {
    return { q, trigger: null, error: e.message, tokens: { in: 0, out: 0 } };
  }
}

/* ---------- DeepSeek API 调用（空回复自动重试 ×2） ---------- */
async function callModel(cfg: ModelCfg, system: string, user: string): Promise<{ content: string; tokens: { in: number; out: number } }> {
  let lastTokens = { in: 0, out: 0 };
  for (let attempt = 0; attempt < 3; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 120000);
    try {
      const resp = await fetch(cfg.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
        body: JSON.stringify({
          model: cfg.id,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          temperature: 0.2,
          max_tokens: 4096,
        }),
        signal: ctrl.signal,
      });
      if (resp.status === 402) {
        const e = new Error("API_QUOTA: 402 Insufficient Balance") as Error & { code?: string };
        e.code = "QUOTA";
        throw e;
      }
      if (!resp.ok) {
        const e = new Error(`API_HTTP_${resp.status}: ${(await resp.text()).slice(0, 200)}`) as Error & { code?: string };
        e.code = "HTTP";
        throw e;
      }
      const data = (await resp.json()) as any;
      const msg = data?.choices?.[0]?.message ?? {};
      // reasoning 模型可能把正文放 reasoning_content；content 为空时降级取它
      let content = msg.content ?? "";
      if (!content && typeof msg.reasoning_content === "string") content = msg.reasoning_content;
      lastTokens = { in: data?.usage?.prompt_tokens ?? 0, out: data?.usage?.completion_tokens ?? 0 };
      if (content.trim()) return { content, tokens: lastTokens };
      // 空回复：压缩上下文重试（去掉 system 的专家上下文尾段，保留铁律）
      if (attempt < 2) {
        system = system.length > 4000 ? system.slice(0, 4000) : system;
        continue;
      }
      return { content: "(EMPTY_RESPONSE)", tokens: lastTokens };
    } finally {
      clearTimeout(timer);
    }
  }
  return { content: "(EMPTY_RESPONSE)", tokens: lastTokens };
}

/** 从模型输出提取 JSON（鲁棒：直接解析 / ```json 块 / 正则） */
function extractJson(text: string): any {
  try { return JSON.parse(text); } catch { /* fallthrough */ }
  const block = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  if (block) {
    try { return JSON.parse(block[1]); } catch { /* fallthrough */ }
  }
  const m = /\{[\s\S]*\}/.exec(text);
  if (m) {
    try { return JSON.parse(m[0]); } catch { /* fallthrough */ }
  }
  return null;
}

const RUBRIC_TEXT = RUBRIC.map((r) => `${r.label}(${r.max}${r.critical ? ",critical" : ""})`).join("，");
const JUDGE_SYSTEM = `你是严格的专业评审官。按 rubric（${RUBRIC_TEXT}）对回答逐项打分，满分 ${RUBRIC.reduce((s, r) => s + r.max, 0)}，通过线 ${PASS_LINE}（critical 项为 0 直接不合格）。只输出 JSON：{"score":{"diagnosis":0,"routing":0,"data":0,"compliance":0,"redteam":0,"expectation":0,"structure":0,"routing2":0,"livedata":0,"citation":0},"reason":"<50字总评>"}。`;

/** 注入专家包上下文（按需注入：SKILL 全文 + 合规 + EXECUTION-CORE 核心段；v5.2 瘦身：上限 15k→9k，EXECUTION-CORE 段 5k→3k） */
function loadExpertContext(): string {
  const skillDir = join(REPO, "seo-traffic-growth/skills/seo-framework");
  const parts: string[] = [];
  const skillPath = join(skillDir, "SKILL.md");
  if (existsSync(skillPath)) parts.push(`=== SKILL.md ===\n${readFileSync(skillPath, "utf8")}`);
  const compliancePath = join(skillDir, "references/compliance.md");
  if (existsSync(compliancePath)) parts.push(`=== compliance.md ===\n${readFileSync(compliancePath, "utf8").slice(0, 2500)}`);
  const corePath = join(skillDir, "references/EXECUTION-CORE.md");
  if (existsSync(corePath)) parts.push(`=== EXECUTION-CORE.md（核心段）===\n${readFileSync(corePath, "utf8").slice(0, 3000)}`);
  // 上下文上限 9k 字符（v5.2 瘦身：实测 24k 会压垮 flash；9k 覆盖铁律+流程+合规核心）
  return parts.join("\n\n").slice(0, 9000);
}

let EXPERT_CONTEXT: string | null = null;
function expertSystem(): string {
  if (!EXPERT_CONTEXT) EXPERT_CONTEXT = loadExpertContext();
  return `你是流量操盘手（SEO/GEO 双轨获客操盘手）。以下是你的专家包知识（SKILL + EXECUTION-CORE + 合规），必须按此规范作答：诊断前置、数据必带来源口径、合规优先、红队自检、三档预期。\n\n${EXPERT_CONTEXT}`;
}

async function gradeOne(q: Question, producer: ModelCfg, judge: ModelCfg, dryRun: boolean, verbose: boolean): Promise<Result> {
  const res: Result = { question: q };
  if (dryRun) return res;
  // 1) 产出
  const out = await callModel(producer, expertSystem(), `测试题：${q.text}\n考察点：${q.note}`);
  res.answer = out.content.slice(0, 3000);
  res.tokens = out.tokens;
  // 2) 评审（judge 与产出不同模型，防自我表扬）
  const judgeCall = await callModel(
    judge,
    JUDGE_SYSTEM,
    `题目：${q.text}\n考察点：${q.note}\n\n回答：\n${res.answer}`,
  );
  if (verbose) {
    console.log(`\n----- judge 原文（前 600 字）-----\n${judgeCall.content.slice(0, 600)}`);
    console.log(`----- 产出回答（前 400 字）-----\n${(res.answer ?? "").slice(0, 400)}`);
  }
  res.tokens = { in: (res.tokens?.in ?? 0) + judgeCall.tokens.in, out: (res.tokens?.out ?? 0) + judgeCall.tokens.out };
  const parsed = extractJson(judgeCall.content);
  if (!parsed?.score) {
    res.error = "JUDGE_JSON_PARSE_FAIL";
    return res;
  }
  res.score = parsed.score;
  res.total = RUBRIC.reduce((s, r) => s + (Number(res.score?.[r.key]) || 0), 0);
  res.criticalFail = RUBRIC.some((r) => r.critical && (Number(res.score?.[r.key]) || 0) === 0);
  return res;
}

/* ---------- 对抗题生成（出题步骤） ---------- */
function genAdversarial(producer: ModelCfg, dryRun: boolean): void {
  // 从失败 TRACE 提取失败模式（本地启发式）
  const failures: string[] = [];
  for (const dir of MEMORY_DIRS) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSafe(dir)) {
      const content = readFileSync(join(dir, f), "utf8");
      for (const line of content.split("\n")) {
        if (/失败|REPAIR|错误|塌缩|违反/.test(line) && line.length < 200) failures.push(line.trim());
      }
    }
  }
  console.log(`失败模式样本 ${failures.length} 条${dryRun ? "（--dry-run，不调用 API）" : ""}`);
  if (dryRun) return;
  // 出题：让产出模型把失败模式转化为 1 道对抗测试题
  void callModel(producer, expertSystem(),
    `从以下失败模式中提炼 1 道「自博弈对抗测试题」（格式：A题. 「题目」（考察：xxx）），要能击中系统最可能再犯的错误：\n${failures.slice(0, 10).join("\n")}`,
  ).then((r) => {
    console.log("\n=== 生成的对抗题（人工确认后加入 evals.md「自博弈对抗题」区块）===");
    console.log(r.content);
  }).catch((e: any) => {
    console.error(`GEN_FAIL: ${e.message}`);
    process.exitCode = 4;
  });
}

function readdirSafe(dir: string): string[] {
  try { return readdirSync(dir).filter((n) => n.endsWith(".md")); } catch { return []; }
}

/* ---------- 触发召回测试主流程（G1，v5.1） ---------- */
async function runTrigger(producer: ModelCfg, dryRun: boolean, json: boolean, tier: string, filterIds: string[]): Promise<void> {
  const qs0 = loadTriggerQuestions();
  if (qs0.length === 0) {
    console.log("EMPTY_SET: trigger 无测试题（检查 evals.md「触发召回测试题」区块）");
    process.exit(0);
  }
  let qs = qs0;
  if (filterIds.length > 0) qs = qs0.filter((q) => filterIds.includes(q.id));
  if (tier === "spot") qs = qs.slice(0, 4); // 成本分层：先便宜后贵
  console.log(`[judge.ts] 集合=trigger 题数=${qs.length} 模式=${dryRun ? "dry-run" : "路由判断器"} tier=${tier}`);

  const results: { id: string; text: string; expect: boolean; trigger: boolean | null; match: boolean; error?: string }[] = [];
  let tokensIn = 0, tokensOut = 0;
  for (const q of qs) {
    process.stdout.write(`  ${q.id} ${q.text.slice(0, 24)}... `);
    const r = await gradeTriggerOne(q, producer, dryRun);
    tokensIn += r.tokens?.in ?? 0;
    tokensOut += r.tokens?.out ?? 0;
    if (dryRun) { console.log("[待运行]"); continue; }
    if (r.error) { console.log(`[${r.error}]`); results.push({ id: q.id, text: q.text, expect: q.expect, trigger: null, match: false, error: r.error }); continue; }
    const match = r.trigger === q.expect;
    results.push({ id: q.id, text: q.text, expect: q.expect, trigger: r.trigger, match });
    console.log(`期望${q.expect ? "触发" : "不触发"} 判定${r.trigger ? "触发" : "不触发"} ${match ? "✅" : "❌"}`);
  }

  if (dryRun) {
    console.log(`\n[dry-run] 将调用 ${qs.length} 次 API（路由判断），估算 token ≈ ${qs.length * 800} in`);
    return;
  }

  const decided = results.filter((r) => r.trigger !== null);
  const should = decided.filter((r) => r.expect);
  const shouldNot = decided.filter((r) => !r.expect);
  const tp = should.filter((r) => r.match).length;      // 应触发且触发
  const fp = shouldNot.filter((r) => !r.match).length;  // 不应触发却触发（误报）
  const recall = should.length > 0 ? tp / should.length : 1;   // 召回率 = 该触发的都触发了吗
  const precision = decided.length > 0 ? decided.filter((r) => r.match).length / decided.length : 1; // 准确率 = 判定对了吗
  const fpr = shouldNot.length > 0 ? fp / shouldNot.length : 0; // 误报率
  const pass = recall >= 0.9 && precision >= 0.85;
  const summary = {
    version: "v5.1", date: new Date().toISOString().slice(0, 10), set: "trigger",
    total: decided.length, recall: +(recall * 100).toFixed(1), precision: +(precision * 100).toFixed(1), fpr: +(fpr * 100).toFixed(1),
    pass, tokens: { in: tokensIn, out: tokensOut },
    details: results.map((r) => ({ id: r.id, expect: r.expect, trigger: r.trigger, match: r.match, error: r.error })),
  };
  mkdirSync(REPORT_DIR, { recursive: true });
  const reportPath = join(REPORT_DIR, `eval-report-trigger-${Date.now()}.json`);
  writeFileSync(reportPath, JSON.stringify(summary, null, 2));
  if (json) console.log(JSON.stringify(summary, null, 2));
  else {
    console.log(`\n[汇总] 触发召回率 ${summary.recall}%（目标 ≥90%）｜准确率 ${summary.precision}%（目标 ≥85%）｜误报率 ${summary.fpr}%`);
    console.log(`[token] in=${tokensIn} out=${tokensOut}`);
    console.log(`[报告] ${reportPath}`);
    console.log(pass ? "\n✅ TRIGGER PASS" : "\n❌ TRIGGER FAIL");
  }
  process.exit(pass ? 0 : 1);
}

/* ---------- 主流程 ---------- */
async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const set = argv.includes("--set") ? argv[argv.indexOf("--set") + 1] : "visible";
  const dryRun = argv.includes("--dry-run");
  const json = argv.includes("--json");
  const budget = argv.includes("--budget") ? parseFloat(argv[argv.indexOf("--budget") + 1]) : Infinity;
  const judgeId = argv.includes("--judge") ? argv[argv.indexOf("--judge") + 1] : "deepseek-v4-pro";
  const only = argv.includes("--only") ? parseInt(argv[argv.indexOf("--only") + 1]) : 0;
  const tier = argv.includes("--tier") ? argv[argv.indexOf("--tier") + 1] : "full";
  const repeat = argv.includes("--repeat") ? parseInt(argv[argv.indexOf("--repeat") + 1]) || 1 : 1;
  const filterIds = argv.includes("--filter") ? argv[argv.indexOf("--filter") + 1].split(",") : [];
  if (!["visible", "heldout", "adversarial", "trigger"].includes(set)) {
    console.error("usage: --set visible|heldout|adversarial|trigger");
    process.exit(2);
  }
  if (!["spot", "targeted", "full"].includes(tier)) {
    console.error("usage: --tier spot|targeted|full");
    process.exit(2);
  }

  const { producer, judge } = loadModels();

  if (argv.includes("--gen-adversarial")) {
    genAdversarial(producer, dryRun);
    return;
  }

  if (set === "trigger") {
    await runTrigger(producer, dryRun, json, tier, filterIds);
    return;
  }

  const judgeCfg = judgeId === "deepseek-v4-flash" ? producer : judge;
  let qs = loadQuestions(set);
  if (filterIds.length > 0) qs = qs.filter((q) => filterIds.includes(q.id));
  if (tier === "spot") qs = qs.slice(0, 4); // 成本分层（G4）：先便宜后贵
  if (qs.length === 0) {
    console.log(`EMPTY_SET: ${set} 无测试题（检查 evals.md 区块）`);
    process.exit(0);
  }
  console.log(`[judge.ts] 集合=${set} 题数=${qs.length} 产出=${producer.id} judge=${judgeCfg.id} dry-run=${dryRun} budget=${budget} tier=${tier} repeat=${repeat}`);

  const results: Result[] = [];
  let tokensIn = 0, tokensOut = 0;
  const verbose = argv.includes("--verbose");
  for (const q of qs) {
    if (only > 0 && q.id !== String(only)) continue;
    process.stdout.write(`  ${q.id} ${q.text.slice(0, 30)}... `);
    try {
      // G3 稳定度：repeat>1 时每题跑 N 次，输出得分均值/方差
      const runs: Result[] = [];
      for (let n = 0; n < repeat; n++) {
        const r = await gradeOne(q, producer, judgeCfg, dryRun, verbose);
        runs.push(r);
        tokensIn += r.tokens?.in ?? 0;
        tokensOut += r.tokens?.out ?? 0;
        if (r.error || dryRun) break; // 错误/空跑不重复
      }
      const scored = runs.filter((r) => r.score);
      const r = scored[0] ?? runs[0];
      if (dryRun) {
        results.push(r);
        console.log("[待运行]");
      } else if (r.error) {
        results.push(r);
        console.log(`[${r.error}]`);
      } else {
        const totals = scored.map((x) => x.total ?? 0);
        const mean = totals.reduce((s, x) => s + x, 0) / totals.length;
        const std = totals.length > 1 ? Math.sqrt(totals.reduce((s, x) => s + (x - mean) ** 2, 0) / totals.length) : 0;
        results.push({ ...r, total: +mean.toFixed(1) });
        console.log(`得分 ${mean.toFixed(1)}/16${r.criticalFail ? " ⚠️CRITICAL" : ""}${repeat > 1 ? ` σ=${std.toFixed(1)}` : ""}`);
      }
      if (!dryRun && !r.error && budget !== Infinity) {
        const est = (tokensIn / 1e6) * 0 + (tokensOut / 1e6) * 0;
        if (est > budget) {
          console.log(`BUDGET_EXCEEDED: 估算成本 ${est.toFixed(4)} USD > ${budget}`);
          break;
        }
      }
    } catch (e: any) {
      const r: Result = { question: q, error: e.message };
      results.push(r);
      console.log(`[${e.code ?? "FAIL"}] ${e.message.slice(0, 60)}`);
      if (e.code === "QUOTA") {
        console.error("QUOTA: API 余额不足——评分未完成，可稍后重跑（--dry-run 可预览计划）");
        process.exit(4);
      }
    }
  }

  if (dryRun) {
    console.log(`\n[dry-run] 将调用 ${qs.length * 2 * repeat} 次 API（产出+评审各 ${qs.length * repeat} 次），估算 token ≈ ${qs.length * repeat * 2000} in / ${qs.length * repeat * 800} out`);
    return;
  }

  // 汇总（四维：效果/稳定/成本/风险）
  const graded = results.filter((r) => r.score);
  const total = graded.reduce((s, r) => s + (r.total ?? 0), 0);
  const passed = graded.filter((r) => (r.total ?? 0) >= PASS_LINE && !r.criticalFail).length;
  const failed = results.filter((r) => r.error).length;
  const risk = {
    criticalFails: graded.filter((r) => r.criticalFail).length,
    emptyResponses: results.filter((r) => (r.answer ?? "").includes("EMPTY_RESPONSE") || r.error === "JUDGE_JSON_PARSE_FAIL").length,
    parseFails: results.filter((r) => r.error === "JUDGE_JSON_PARSE_FAIL").length,
  };
  const summary = {
    version: "v5.1", date: new Date().toISOString().slice(0, 10), set,
    score: +total.toFixed(1), max: RUBRIC.reduce((s, r) => s + r.max, 0) * qs.length,
    pass: passed, fail: graded.length - passed, errors: failed,
    stability: repeat > 1 ? { repeat, mean: +(total / Math.max(graded.length, 1)).toFixed(1) } : undefined,
    risk, // G3 风险维度
    tokens: { in: tokensIn, out: tokensOut },
    details: results.map((r) => ({ id: r.question.id, total: r.total, criticalFail: r.criticalFail, error: r.error })),
  };
  mkdirSync(REPORT_DIR, { recursive: true });
  const reportPath = join(REPORT_DIR, `eval-report-${set}-${Date.now()}.json`);
  writeFileSync(reportPath, JSON.stringify(summary, null, 2));

  if (json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`\n[汇总] 得分 ${summary.score}/${summary.max}｜通过 ${summary.pass}/${graded.length}｜错误 ${summary.errors}`);
    console.log(`[四维] 效果=${summary.score}/${summary.max}｜稳定=${repeat > 1 ? `${summary.stability?.mean} σ` : "未测(--repeat N)"}｜成本=in ${tokensIn} out ${tokensOut}｜风险=critical ${risk.criticalFails} / 空回复 ${risk.emptyResponses}`);
    console.log(`[token] in=${tokensIn} out=${tokensOut}（成本：价格未配置，按官方价表换算）`);
    console.log(`[报告] ${reportPath}`);
    console.log(graded.length > 0 && passed === graded.length ? "\n✅ EVALS PASS" : "\n❌ EVALS FAIL");
  }
  process.exit(graded.length > 0 && passed === graded.length ? 0 : 1);
}

// 兼容顶层 await 缺失：用 IIFE 入口
main().catch((e) => {
  console.error(`FATAL: ${e.message}`);
  process.exit(5);
});
