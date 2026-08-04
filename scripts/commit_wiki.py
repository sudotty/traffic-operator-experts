#!/usr/bin/env python3
"""
commit_wiki.py — Append a section to a GitHub wiki page (stored in repo wiki/ folder)
and push via the `gh` CLI (robust: does NOT depend on the machine's git SOCKS proxy).

Usage:
  python3 commit_wiki.py <repo> <page_path> <section_file> [commit_message]

  <repo>         e.g. sudotty/traffic-operator-experts
  <page_path>    e.g. wiki/每日AI网感雷达.md
  <section_file> path to a markdown file whose content is appended (should start with '## <timestamp>')
  [commit_message] optional; defaults to "wiki: <page_path> 自动产出"

Robustness:
  - If the page does not exist yet, it is CREATED (no sha).
  - If a concurrent modification causes HTTP 409, it re-fetches and retries (up to 3x).
"""
import sys, json, base64, subprocess, tempfile, os, time, re

def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)

def gh_api(method, path, body=None):
    cmd = ["gh", "api", "-X", method, f"/repos/{path}"]
    if body is not None:
        tf = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8")
        json.dump(body, tf, ensure_ascii=False); tf.close()
        cmd += ["--input", tf.name]
        try:
            return run(cmd)
        finally:
            os.unlink(tf.name)
    return run(cmd)

def http_status(r):
    """`gh api` always exits 1 on HTTP error; the real status lives in stderr
    as e.g. 'gh: Not Found (HTTP 404)'. Returns int status, or None if unknown."""
    m = re.search(r"\(HTTP (\d{3})\)", (r.stderr or ""))
    return int(m.group(1)) if m else None

def main():
    if len(sys.argv) < 4:
        print("usage: commit_wiki.py <repo> <page_path> <section_file> [msg]")
        sys.exit(2)
    repo, page, section_file = sys.argv[1], sys.argv[2], sys.argv[3]
    msg = sys.argv[4] if len(sys.argv) > 4 else f"wiki: {page} 自动产出"

    if not os.path.exists(section_file):
        print(f"SECTION_FILE_MISSING: {section_file}")
        sys.exit(3)
    section = open(section_file, encoding="utf-8").read().strip()
    if not section:
        print("SECTION_EMPTY: nothing to append")
        sys.exit(0)

    api = f"{repo}/contents/{page}"

    for attempt in range(3):
        # 1) fetch current state
        r = gh_api("GET", api)
        if r.returncode == 0:
            meta = json.loads(r.stdout)
            old = base64.b64decode(meta["content"]).decode("utf-8")
            sha = meta.get("sha")
        elif http_status(r) == 404:
            old = ""
            sha = None  # page does not exist yet -> create
        else:
            print(f"GET_FAIL (HTTP {http_status(r)}): {r.stderr[:200]}")
            sys.exit(4)

        new = (old.rstrip("\n") + "\n\n" + section + "\n") if old else (section + "\n")
        b64 = base64.b64encode(new.encode("utf-8")).decode("utf-8")
        body = {"message": msg, "content": b64}
        if sha:
            body["sha"] = sha

        # GitHub Contents API uses PUT for BOTH create and update; sha presence
        # is what distinguishes them. POST is not a valid verb here.
        u = gh_api("PUT", api, body)
        if u.returncode == 0:
            print(f"OK {'update' if sha else 'create'} -> {page}")
            return
        # 409 (conflict) / 422 (stale sha) = concurrent write; re-fetch and retry
        st = http_status(u)
        if st in (409, 422) and attempt < 2:
            print(f"CONFLICT (HTTP {st}) retry {attempt+1}/3 ...")
            time.sleep(1.5)
            continue
        print(f"WRITE_FAIL (HTTP {st}): {u.stderr[:300]}")
        sys.exit(5)

    print("WRITE_FAIL: exhausted retries")
    sys.exit(5)

if __name__ == "__main__":
    main()
