#!/usr/bin/env python3
"""Extract the supplied official BINA PivotChart ZIP into the repository root.

Safe import: refuses ZIP-slip paths, links, ambiguous roots and missing runtime.
This script never executes any source code from the uploaded archive.
"""
from pathlib import Path, PurePosixPath
import sys
import zipfile

REQUIRED = {
    "index.html",
    "preview.html",
    "viewer.html",
    "js/BinaPivotChart.js",
    "js/BinaPivotRenderer.js",
    "js/BinaPivotViewer.js",
    "css/BinaPivotChart.css",
    "js/demo-data.js",
}
MAX_FILE_BYTES = 5_000_000
MAX_TOTAL_BYTES = 25_000_000

def main() -> int:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/import_chart_zip.py <path-to-zip>")
    root = Path(__file__).resolve().parents[1]
    archive = Path(sys.argv[1]).resolve()
    if not archive.is_file() or archive.suffix.lower() != ".zip":
        raise ValueError("A ZIP archive file must be supplied")
    with zipfile.ZipFile(archive) as z:
        entries = [i for i in z.infolist() if not i.is_dir()]
        if not entries:
            raise ValueError("Archive is empty")
        if sum(i.file_size for i in entries) > MAX_TOTAL_BYTES:
            raise ValueError("Archive exceeds size limit")
        plan = []
        for info in entries:
            p = PurePosixPath(info.filename)
            parts = p.parts
            if (len(parts) < 2 or not parts[0].startswith("BinaPivotChart_v")
                    or p.is_absolute() or any(part in ("", ".", "..") for part in parts)
                    or "\\" in info.filename or info.file_size > MAX_FILE_BYTES):
                raise ValueError(f"Unsafe archive member: {info.filename}")
            if (info.external_attr >> 16) & 0o170000 == 0o120000:
                raise ValueError(f"Symlink rejected: {info.filename}")
            relative = PurePosixPath(*parts[1:])
            if relative.parts[0] in (".git", ".github", "imports", "scripts", "docs"):
                raise ValueError(f"Reserved location: {relative}")
            plan.append((info, relative))
        if len({i.filename.split("/", 1)[0] for i, _ in plan}) != 1:
            raise ValueError("Multiple source roots are not allowed")
        if len({str(relative) for _, relative in plan}) != len(plan):
            raise ValueError("Duplicate destination paths")
        missing = REQUIRED - {str(relative) for _, relative in plan}
        if missing:
            raise ValueError(f"Required runtime files missing: {sorted(missing)}")
        for info, relative in plan:
            target = root.joinpath(*relative.parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(z.read(info))
            print(f"Imported: {relative} ({info.file_size} bytes)")
    print(f"SUCCESS: {len(plan)} source files imported")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
