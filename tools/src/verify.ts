/**
 * verify.ts — 专家包审计护栏（取代人工 grep/diff 四轮审计）
 *
 * Checks:
 *   1. 禁词检查   全库（源仓库 + 已安装副本）无古典军事词汇残留（复合词 + 派生单字），行级白名单过滤已知误报
 *   2. 副本同步   seo-traffic-growth / seo-traffic-pipeline / 已安装 ×2 逐字节一致
 *   3. 版本单轨   references/*.md 的「> 版本：」行必须为 v3.2（修订史交给 git）
 *   4. --build   重建两个 zip（ditto keepParent）+ zip 内容禁词检查
 *
 * Usage:
 *   node dist/verify.js            # 只审计
 *   node dist/verify.js --build    # 审计 + 重建 zip
 */
import { execFileSync, execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(DIST, "../.."); // tools/dist -> tools -> repo root
const INST = join(homedir(), ".workbuddy/plugins/marketplaces/my-experts/plugins");
const ZIPS = [resolve(REPO, "../seo-traffic-growth.zip"), resolve(REPO, "../seo-traffic-pipeline.zip")];

const SKIP_DIRS = new Set([".git", "node_modules", "dist"]);
const SKIP_DIRS_FORBIDDEN = new Set([...SKIP_DIRS, "tools"]); // tools 是开发工具，非包内容
const GROWTH = join(REPO, "seo-traffic-growth");
const PIPELINE = join(REPO, "seo-traffic-pipeline");
const INST_GROWTH = join(INST, "seo-traffic-growth");
const INST_PIPELINE = join(INST, "seo-traffic-pipeline");
const SKILL_REL = "skills/seo-framework"; // 4 副本唯一需要逐字节一致的子目录

/** 禁词：复合词 + 派生单字（与 2026-08-10 清零审计同源） */
const FORBIDDEN =
  /孙膑|兵法|sunbin|孙子|兵家|奇正|正奇|虚实|攻虚|避实|击虚|知己知彼|百战不殆|田忌|围魏救赵|三十六计|韬略|诡道|用兵|阵法|不战而屈|军师|奇谋|将帅|声东击西|暗渡陈仓|欲擒故纵|瞒天过海|借刀杀人|以逸待劳|趁火打劫|釜底抽薪|调虎离山|空城计|反间计|威王|庞涓|陈忌|雄牝|篡卒|积疏|将义|客主人分|兵失|兵情|势备|月战|八阵|地葆|行篡|杀士|延气|官一|略甲|五名五恭|将德|将败|将失|五度九夺|擒庞涓|十阵|十问|五教法|因势利导|战胜而强立|必攻不守|以义立威|我专敌分|义立|以义|正:奇|定正|奇实验|为正/i;

/** 行级白名单：已知误报（正常中文词汇中的子串命中） */
const WHITELIST = /每月战略复盘|下月战略|上月战略|新奇实验|正餐|设定正确/;

let failures = 0;

function fail(msg: string): void {
  failures++;
  console.error(`  ✗ ${msg}`);
}
function pass(msg: string): void {
  console.log(`  ✓ ${msg}`);
}

function listFiles(root: string, out: string[] = [], base = root, skipDirs = SKIP_DIRS): string[] {
  for (const name of readdirSync(root)) {
    if (skipDirs.has(name)) continue;
    const p = join(root, name);
    const st = statSync(p);
    if (st.isDirectory()) listFiles(p, out, base, skipDirs);
    else if (st.isFile()) out.push(p);
  }
  return out;
}

/* ---------- 1. 禁词检查 ---------- */
function checkForbidden(): void {
  console.log("[1/6] 禁词检查（源仓库 + 已安装副本）");
  const roots = [REPO, INST_GROWTH, INST_PIPELINE];
  let hits = 0;
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const file of listFiles(root, [], root, SKIP_DIRS_FORBIDDEN)) {
      const content = readFileSync(file, "utf8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (WHITELIST.test(line)) continue;
        if (FORBIDDEN.test(line)) {
          hits++;
          console.error(`    ${relative(REPO, file)}:${i + 1}: ${line.trim().slice(0, 80)}`);
        }
      }
    }
  }
  hits === 0 ? pass("0 禁词残留") : fail(`${hits} 处命中（见上）`);
}

/* ---------- 2. 副本同步（只比 skills/seo-framework 子目录） ---------- */
function compareDir(a: string, b: string, label: string): void {
  const sub = join(a, SKILL_REL);
  if (!existsSync(sub) || !existsSync(join(b, SKILL_REL))) {
    fail(`${label}: skills 目录缺失 (${relative(REPO, a)} / ${relative(REPO, b)})`);
    return;
  }
  const fa = listFiles(sub).map((f) => relative(sub, f));
  const fb = new Set(listFiles(join(b, SKILL_REL)).map((f) => relative(join(b, SKILL_REL), f)));
  let bad = 0;
  for (const rel of fa) {
    if (!fb.has(rel)) {
      fail(`${label}: ${rel} 缺失于 ${relative(REPO, b)}`);
      bad++;
      continue;
    }
    const ca = readFileSync(join(sub, rel));
    const cb = readFileSync(join(b, SKILL_REL, rel));
    if (!ca.equals(cb)) {
      fail(`${label}: ${rel} 内容不一致`);
      bad++;
    }
  }
  for (const rel of fb) if (!fa.includes(rel)) {
    fail(`${label}: ${rel} 为 ${relative(REPO, b)} 独有`);
    bad++;
  }
  if (bad === 0) pass(label);
}

function checkSync(): void {
  console.log("[2/6] 副本同步（growth == pipeline == 已安装 ×2）");
  compareDir(GROWTH, PIPELINE, "growth vs pipeline");
  compareDir(GROWTH, INST_GROWTH, "growth vs 已安装 growth");
  compareDir(GROWTH, INST_PIPELINE, "growth vs 已安装 pipeline");
}

/* ---------- 3. 版本单轨 ---------- */
function checkVersion(): void {
  console.log("[3/6] 版本单轨（references 版本行必须 v5.2）");
  const refs = join(GROWTH, "skills/seo-framework/references");
  let bad = 0;
  for (const f of readdirSync(refs).filter((n) => n.endsWith(".md"))) {
    for (const line of readFileSync(join(refs, f), "utf8").split("\n")) {
      const m = /^>\s*版本[：:]\s*(.+)$/.exec(line);
      if (m && !m[1].includes("v5.2")) {
        fail(`${f}: ${m[1].trim()}`);
        bad++;
      }
    }
  }
  bad === 0 ? pass("全部引用文件版本行 = v5.2（修订史在 git）") : fail(`${bad} 个文件版本行非 v5.2`);
}

/* ---------- 3.5 CHANGELOG 契约（G2，v5.1） ---------- */
function checkChangelog(): void {
  console.log("[3.5/6] CHANGELOG 契约（Keep a Changelog：最新条目版本 = 体系版本）");
  const changelogPath = join(REPO, "CHANGELOG.md");
  if (!existsSync(changelogPath)) {
    fail("CHANGELOG.md 不存在——按 G2 规范必须维护（Keep a Changelog 六类）");
    return;
  }
  const content = readFileSync(changelogPath, "utf8");
  const m = /^## \[(v[\d.]+)\]/m.exec(content); // m 标志：匹配任意行首
  if (!m) {
    fail("CHANGELOG.md 无版本条目（应为 `## [vX.Y] - 日期` 开头）");
    return;
  }
  m[1].startsWith("v5.") ? pass(`CHANGELOG 最新条目 ${m[1]} 覆盖当前体系`) : fail(`CHANGELOG 最新条目 ${m[1]} 未覆盖 v5.2`);
  const categories = ["Added", "Changed", "Deprecated", "Removed", "Fixed", "Security"];
  const missing = categories.filter((c) => !content.includes(`### ${c}`));
  missing.length === 0 ? pass("六类分区齐全") : fail(`CHANGELOG 缺分区: ${missing.join("、")}`);
}

/* ---------- 3.6 正文版本一致性（v5.1 收尾修复：防"references 升版但 SKILL/agent/plugin.json 漏改"） ---------- */
function checkBodyVersion(): void {
  console.log("[3.6/6] 正文版本一致性（SKILL/agent/plugin.json 必须 v5.2）");
  let bad = 0;
  const files = [
    join(GROWTH, "skills/seo-framework/SKILL.md"),
    join(GROWTH, "agents/seo-traffic-growth.md"),
    join(PIPELINE, "skills/seo-framework/SKILL.md"),
    join(INST_GROWTH, "skills/seo-framework/SKILL.md"),
    join(INST_PIPELINE, "skills/seo-framework/SKILL.md"),
    join(INST_GROWTH, "agents/seo-traffic-growth.md"),
  ];
  for (const p of files) {
    if (!existsSync(p)) continue;
    const content = readFileSync(p, "utf8");
    // 正文不得出现旧体系版本号 v5.0/v5.1（排除历史叙述词：沿用/引入/起/自/基线/协议/收口/把/调研）
    const m = content.match(/v5\.[01](?![^）\n]*(沿用|引入|起|自|基线|协议|收口|把|调研|，v5))/);
    if (m) {
      const line = content.split("\n").find((l) => l.includes(m[0])) ?? "";
      fail(`${relative(REPO, p)}: 正文残留 ${m[0]} → ${line.trim().slice(0, 60)}`);
      bad++;
    }
  }
  // plugin.json version 必须为 5.2.0（源 + 已安装 ×2）
  for (const [label, base] of [["源仓库", REPO], ["已安装", INST]] as const) {
    for (const pkg of ["seo-traffic-growth", "seo-traffic-pipeline"]) {
      const p = join(base, pkg, ".codebuddy-plugin/plugin.json");
      if (!existsSync(p)) continue;
      const d = JSON.parse(readFileSync(p, "utf8"));
      if (d.version !== "5.2.0") {
        fail(`${label} ${pkg} plugin.json version=${d.version}（应为 5.2.0）`);
        bad++;
      }
    }
  }
  bad === 0 ? pass("SKILL/agent 正文无旧版本残留；plugin.json 全 5.2.0") : fail(`${bad} 处正文/版本不一致`);
}

/* ---------- 4. 契约测试（索引 ↔ 文件双向一致，替代人工 T1） ---------- */
function checkContract(): void {
  console.log("[4/6] 契约测试（索引 ↔ 文件双向一致）");
  const skillDir = join(GROWTH, "skills/seo-framework");
  const refsDir = join(skillDir, "references");
  const disk = new Set(readdirSync(refsDir).filter((n) => n.endsWith(".md")));
  const indexed = new Set<string>();
  for (const f of ["SKILL.md", "references/EXECUTION-CORE.md"]) {
    const content = readFileSync(join(skillDir, f), "utf8");
    // 索引表每行只有首个引用带 references/ 前缀，故提取全部 X.md 文件名
    for (const m of content.matchAll(/([\w-]+)\.md/g)) {
      const name = m[1];
      if (name === "SKILL" || name === "EXECUTION-CORE") continue; // 顶层入口
      indexed.add(`${name}.md`);
    }
  }
  let bad = 0;
  for (const f of indexed) {
    if (!disk.has(f)) {
      fail(`断链：索引引用 references/${f} 但磁盘不存在`);
      bad++;
    }
  }
  for (const f of disk) {
    if (f === "EXECUTION-CORE.md") continue; // 顶层入口，SKILL 头部引用
    if (!indexed.has(f)) {
      fail(`孤儿：磁盘 references/${f} 未被 SKILL/EXECUTION-CORE 索引`);
      bad++;
    }
  }
  bad === 0
    ? pass(`索引 ↔ 磁盘一致（${indexed.size} 引用 / ${disk.size} 文件）`)
    : fail(`${bad} 处契约不一致`);
}

/* ---------- 5. 字典生命周期（使用率检查，选择压力落地） ---------- */
function checkLifecycle(): void {
  console.log("[5/6] 字典生命周期（非索引引用 <2 次 → LOW-USE 提示）");
  const refsDir = join(GROWTH, "skills/seo-framework/references");
  const files = readdirSync(refsDir).filter((n) => n.endsWith(".md") && n !== "EXECUTION-CORE.md");
  const low: string[] = [];
  for (const f of files) {
    const name = f.replace(/\.md$/, "");
    let count = 0;
    const walk = (dir: string): void => {
      for (const n of readdirSync(dir)) {
        if (SKIP_DIRS.has(n)) continue;
        const p = join(dir, n);
        const st = statSync(p);
        if (st.isDirectory()) walk(p);
        else if (st.isFile() && p.endsWith(".md") && !p.includes("/SKILL.md")) {
          const c = readFileSync(p, "utf8");
          count += (c.match(new RegExp(`\\b${name}\\b`, "g")) ?? []).length;
        }
      }
    };
    walk(GROWTH);
    if (count < 2) low.push(`${f}（引用 ${count} 次）`);
  }
  low.length === 0
    ? pass(`全部 ${files.length} 个字典均有真实引用（无 LOW-USE）`)
    : console.warn(`  ⚠️ LOW-USE 提示（不阻断；季度走 ACTIVE→DEPRECATED 流程评估）: ${low.join("、")}`);
}

/* ---------- 6. release 门禁（--release，发布前强制检查） ---------- */
function checkReleaseGate(): void {
  console.log("[--release] 发布门禁（evals 记录必须覆盖当前体系版本）");
  const evalsPath = join(GROWTH, "skills/seo-framework/references/evals.md");
  const evals = readFileSync(evalsPath, "utf8");
  // 实测记录表第一列是版本号（| v5.0 | ... |）；记录按时间追加，最新在表尾
  const records = [...evals.matchAll(/^\|\s*(v[\d.]+)\s*\|/gm)].map((m) => m[1]);
  if (records.length === 0) {
    fail("evals 实测记录表为空——按 v5.0 协议 RELEASE 前必须完成评估（历史断档按用户决策不补跑）");
    return;
  }
  const latest = records[records.length - 1]; // 最新记录在表尾（追加式）
  if (!latest.startsWith("v5.")) {
    fail(
      `evals 最新记录为 ${latest}，未覆盖当前体系 v5.1——` +
        `按 v5.1 协议需完成 judge 评估后 RELEASE（历史断档按用户决策不补跑，需人工确认放行）`,
    );
  } else {
    pass(`evals 记录已覆盖 v5.1（最新：${latest}）`);
  }
}

/* ---------- 4. 重建 zip（--build） ---------- */
function buildZips(): void {
  console.log("[--build] 重建 zip + 内容禁词检查");
  for (const [pkg, zip] of [
    ["seo-traffic-growth", ZIPS[0]],
    ["seo-traffic-pipeline", ZIPS[1]],
  ] as const) {
    execFileSync("ditto", ["-c", "-k", "--keepParent", join(REPO, pkg), zip], { stdio: "pipe" });
    // grep -c 在 0 命中时退出码为 1，需 || true 兜底；先剔除白名单行再数禁词
    const wl = WHITELIST.source;
    const out = execSync(
      `unzip -p "${zip}" | grep -vE '${wl}' | grep -ciE '${FORBIDDEN.source}' || true`,
      { encoding: "utf8", shell: "/bin/zsh" },
    ).trim();
    const size = statSync(zip).size;
    out === "0" || out === ""
      ? pass(`${pkg}.zip 重建完成（${(size / 1024).toFixed(0)} KB），禁词 0`)
      : fail(`${pkg}.zip 禁词命中 ${out} 处`);
  }
}

const build = process.argv.includes("--build");
const release = process.argv.includes("--release");
checkForbidden();
checkSync();
checkVersion();
checkChangelog();
checkBodyVersion();
checkContract();
checkLifecycle();
if (release) checkReleaseGate();
if (build) buildZips();

console.log(failures === 0 ? "\n✅ VERIFY PASS" : `\n❌ VERIFY FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
