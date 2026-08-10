/**
 * archive.ts — Append a section to a GitHub wiki page (repo `wiki/` folder)
 * and push via the `gh` CLI (robust: does NOT depend on the machine's git proxy).
 *
 * TypeScript port of the former `scripts/commit_wiki.py` (Python 3).
 *
 * Usage:
 *   node dist/archive.js <repo> <page_path> <section_file> [commit_message]
 *
 *   <repo>         e.g. sudotty/traffic-operator-experts
 *   <page_path>    e.g. wiki/每日AI网感雷达.md
 *   <section_file> markdown file whose content is appended (should start with '## <timestamp>')
 *   [commit_message] optional; defaults to "wiki: <page_path> 自动产出"
 *
 * Robustness:
 *   - If the page does not exist yet, it is CREATED (no sha).
 *   - On HTTP 409/422 (concurrent modification) it re-fetches and retries (up to 3x).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

interface GhResult {
  code: number;
  stdout: string;
  stderr: string;
}

function run(cmd: string, args: string[]): GhResult {
  try {
    const stdout = execFileSync(cmd, args, { encoding: "utf8" });
    return { code: 0, stdout, stderr: "" };
  } catch (e: any) {
    return { code: e.status ?? 1, stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
  }
}

function ghApi(method: string, path: string, body?: Record<string, unknown>): GhResult {
  const args = ["api", "-X", method, `/repos/${path}`];
  if (body !== undefined) {
    const dir = mkdtempSync(join(tmpdir(), "ghapi-"));
    const tf = join(dir, "body.json");
    writeFileSync(tf, JSON.stringify(body), "utf8");
    try {
      return run("gh", [...args, "--input", tf]);
    } finally {
      try { unlinkSync(tf); } catch { /* ignore */ }
    }
  }
  return run("gh", args);
}

/** `gh api` exits 1 on HTTP errors; the real status lives in stderr like 'gh: Not Found (HTTP 404)'. */
function httpStatus(r: GhResult): number | null {
  const m = /\(HTTP (\d{3})\)/.exec(r.stderr || "");
  return m ? parseInt(m[1], 10) : null;
}

function usage(): never {
  console.error("usage: archive.js <repo> <page_path> <section_file> [msg]");
  process.exit(2);
}

function main(): void {
  void (async () => {
    const args = process.argv.slice(2);
    if (args.length < 3) usage();
    const [repo, page, sectionFile] = args;
    const msg = args[3] ?? `wiki: ${page} 自动产出`;

    if (!existsSync(sectionFile)) {
      console.error(`SECTION_FILE_MISSING: ${sectionFile}`);
      process.exit(3);
    }
    const section = readFileSync(sectionFile, "utf8").trim();
    if (!section) {
      console.log("SECTION_EMPTY: nothing to append");
      process.exit(0);
    }

    const api = `${repo}/contents/${page}`;

    for (let attempt = 0; attempt < 3; attempt++) {
      // 1) fetch current state
      const r = ghApi("GET", api);
      let old = "";
      let sha: string | null = null;
      if (r.code === 0) {
        const meta = JSON.parse(r.stdout) as { content: string; sha?: string };
        old = Buffer.from(meta.content, "base64").toString("utf8");
        sha = meta.sha ?? null;
      } else if (httpStatus(r) === 404) {
        // page does not exist yet -> create
      } else {
        console.error(`GET_FAIL (HTTP ${httpStatus(r)}): ${r.stderr.slice(0, 200)}`);
        process.exit(4);
      }

      const newContent = old ? `${old.replace(/\n+$/, "")}\n\n${section}\n` : `${section}\n`;
      const body: Record<string, unknown> = {
        message: msg,
        content: Buffer.from(newContent, "utf8").toString("base64"),
      };
      if (sha) body["sha"] = sha;

      // GitHub Contents API uses PUT for BOTH create and update; sha presence distinguishes them.
      const u = ghApi("PUT", api, body);
      if (u.code === 0) {
        console.log(`OK ${sha ? "update" : "create"} -> ${page}`);
        return;
      }
      const st = httpStatus(u);
      if ((st === 409 || st === 422) && attempt < 2) {
        console.error(`CONFLICT (HTTP ${st}) retry ${attempt + 1}/3 ...`);
        await new Promise((res) => setTimeout(res, 1500));
        continue;
      }
      console.error(`WRITE_FAIL (HTTP ${st}): ${u.stderr.slice(0, 300)}`);
      process.exit(5);
    }
    console.error("WRITE_FAIL: exhausted retries");
    process.exit(5);
  })();
}

main();
