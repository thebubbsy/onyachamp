#!/usr/bin/env python3
"""Build data/resources.json for resources.html.

Walks every public, non-fork, non-archived repo owned by GITHUB_OWNER and collects:
  * .exe / .msi / .ps1 assets attached to the repo's latest GitHub release
  * .ps1 files sitting in the root of the repo's default branch

Run by .github/workflows/resources-manifest.yml. Uses GITHUB_TOKEN when present
for a higher API rate limit. Standard library only.
"""

import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

OWNER = os.environ.get("GITHUB_OWNER", "thebubbsy")
TOKEN = os.environ.get("GITHUB_TOKEN", "")
OUT = os.environ.get("RESOURCES_OUT", os.path.join(os.path.dirname(__file__), "..", "data", "resources.json"))

RELEASE_EXTS = (".exe", ".msi", ".ps1")
ROOT_EXTS = (".ps1",)


def api(path):
    req = urllib.request.Request(
        f"https://api.github.com{path}",
        headers={"Accept": "application/vnd.github+json", "User-Agent": "onyachamp-resources"},
    )
    if TOKEN:
        req.add_header("Authorization", f"Bearer {TOKEN}")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        # 404: no releases / empty repo. 409: empty git repository.
        if e.code in (404, 409):
            return None
        raise


def list_repos():
    repos, page = [], 1
    while True:
        batch = api(f"/users/{OWNER}/repos?type=owner&per_page=100&page={page}") or []
        repos.extend(batch)
        if len(batch) < 100:
            return repos
        page += 1


def slug(*parts):
    return "/".join(parts).lower()


def unversioned(name):
    # "Tool-v1.2.3-x64.exe" -> "tool-x64.exe", so a file's download count
    # carries across releases instead of resetting with every new tag.
    return re.sub(r"[-_. ]?v?\d+(\.\d+)+", "", name)


def release_files(repo):
    rel = api(f"/repos/{OWNER}/{repo['name']}/releases/latest")
    if not rel:
        return []
    out = []
    for a in rel.get("assets", []):
        if not a["name"].lower().endswith(RELEASE_EXTS):
            continue
        out.append({
            "id": slug(repo["name"], "release", unversioned(a["name"])),
            "name": a["name"],
            "kind": "release",
            "version": rel.get("tag_name") or "",
            "size": a.get("size", 0),
            "updated": a.get("updated_at") or rel.get("published_at"),
            "url": a["browser_download_url"],
        })
    return out


def root_ps1_files(repo):
    branch = repo.get("default_branch") or "main"
    contents = api(f"/repos/{OWNER}/{repo['name']}/contents/?ref={urllib.parse.quote(branch)}")
    if not isinstance(contents, list):
        return []
    out = []
    for f in contents:
        if f.get("type") != "file" or not f["name"].lower().endswith(ROOT_EXTS):
            continue
        commits = api(
            f"/repos/{OWNER}/{repo['name']}/commits?per_page=1"
            f"&sha={urllib.parse.quote(branch)}&path={urllib.parse.quote(f['path'])}"
        ) or []
        updated = commits[0]["commit"]["committer"]["date"] if commits else None
        out.append({
            "id": slug(repo["name"], "file", f["path"]),
            "name": f["name"],
            "kind": "file",
            "version": branch,
            "size": f.get("size", 0),
            "updated": updated,
            "url": f"https://raw.githubusercontent.com/{OWNER}/{repo['name']}/{branch}/{f['path']}",
        })
    return out


def main():
    groups = []
    for repo in sorted(list_repos(), key=lambda r: r["name"].lower()):
        if repo.get("fork") or repo.get("archived") or repo.get("private"):
            continue
        files = release_files(repo) + root_ps1_files(repo)
        if not files:
            continue
        groups.append({
            "repo": repo["name"],
            "description": repo.get("description") or "",
            "url": repo["html_url"],
            "files": sorted(files, key=lambda f: (f["kind"] != "release", f["name"].lower())),
        })

    manifest = {"owner": OWNER, "groups": groups}
    new = json.dumps(manifest, indent=2) + "\n"

    # Only bump the timestamp when the file list actually changed, so the
    # scheduled workflow doesn't commit (and redeploy) on every run.
    try:
        with open(OUT, encoding="utf-8") as fh:
            old = json.load(fh)
        old.pop("generated", None)
        if json.dumps(old, indent=2) + "\n" == new:
            print("resources.json unchanged")
            return
    except (FileNotFoundError, json.JSONDecodeError):
        pass

    manifest = {"generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), **manifest}
    os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)
        fh.write("\n")
    print(f"wrote {sum(len(g['files']) for g in groups)} files across {len(groups)} repos")


if __name__ == "__main__":
    sys.exit(main())
