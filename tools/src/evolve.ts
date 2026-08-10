/**
 * evolve.ts — 进化提议自动生成器（v4.0 自适应自进化产品层）
 *
 * 扫描工作区的 TRACE/经验沉淀（自动化记忆 + 每日日志），自动提取「进化提议」，
 * 去重排序后输出提议清单。**人做闸门**：本工具只生成提议，不自动应用任何变更。
 *
 * Usage:
 *   node dist/evolve.js                 # 扫描默认工作区，输出提议清单
 *   node dist/evolve.js --ws <path>     # 指定工作区
 *   node dist/evolve.js --json          # JSON 输出（供自动化/CI 消费）
 *
 * 提取规则（启发式）：
 *   - 行内含「进化提议」「提议：」「建议：」→ 提取该句（含证据/收益描述）
 *   - 去重：按句子归一化（去空白/标点）去重，保留来源最全的一条
 *   - 排序：含「已验证/命中/数据」等证据词者优先
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

interface Proposal {
  text: string;
  source: string;
  evidence: boolean;
}

const SKIP_DIRS = new Set(["node_modules", "dist", ".git"]);

function listFiles(root: string, out: string[] = []): string[] {
  if (!existsSync(root)) return out;
  for (const name of readdirSync(root)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(root, name);
    const st = statSync(p);
    if (st.isDirectory()) listFiles(p, out);
    else if (st.isFile() && p.endsWith(".md")) out.push(p);
  }
  return out;
}

function parseArgs(): { ws: string; json: boolean } {
  const argv = process.argv.slice(2);
  let ws = "";
  let json = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--ws" && argv[i + 1]) ws = argv[i + 1];
    if (argv[i] === "--json") json = true;
  }
  if (!ws) ws = join(homedir(), "WorkBuddy/2026-08-03-11-57-58");
  return { ws, json };
}

/** 从一行中提取提议句：匹配「进化提议…」或「提议：…」或「建议：…」 */
function extractFromLine(line: string): string | null {
  const m = /(进化提议[^。；；\n]*|提议[：:][^。\n]*|建议[：:][^。\n]*)/.exec(line);
  return m ? m[1].trim() : null;
}

function normalize(s: string): string {
  return s.replace(/[\s，。；：:、（）()“”"']/g, "");
}

function main(): void {
  const { ws, json } = parseArgs();
  const roots = [join(ws, ".workbuddy/automations"), join(ws, ".workbuddy/memory")];
  const files = roots.flatMap((r) => listFiles(r));
  if (files.length === 0) {
    console.log("NO_SOURCES: 未找到自动化记忆/工作区日志");
    process.exit(0);
  }

  const seen = new Map<string, Proposal>();
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    for (const line of content.split("\n")) {
      const text = extractFromLine(line);
      if (!text) continue;
      const key = normalize(text);
      const evidence = /已验证|命中|数据|实测|确认|落地/.test(text);
      const rel = file.replace(ws, "~");
      if (!seen.has(key)) seen.set(key, { text, source: rel, evidence });
      else if (evidence && !seen.get(key)!.evidence) seen.set(key, { text, source: rel, evidence });
    }
  }

  const props = [...seen.values()].sort((a, b) => Number(b.evidence) - Number(a.evidence));

  if (json) {
    console.log(JSON.stringify(props, null, 2));
  } else {
    console.log(`进化提议清单（${props.length} 条，来源：自动化记忆 + 工作区日志）`);
    console.log("⚠️ 人做闸门：以下仅为提议，需人工/月度战略复盘确认后才可落地。\n");
    props.forEach((p, i) => {
      console.log(`${i + 1}. [${p.evidence ? "有证据" : "待验证"}] ${p.text}`);
      console.log(`   来源: ${p.source}\n`);
    });
    if (props.length === 0) console.log("（暂无进化提议沉淀）");
  }
}

main();
