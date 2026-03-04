#!/usr/bin/env python3
"""
Extract business context from a PHP codebase (enums, models) and generate
a YAML file suitable for LLM prompts.

Usage:
    python extract_context.py /path/to/backend/src -o clientoffice.generated.yaml
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import yaml


LABEL_RE = re.compile(r"#\[Label\(['\"](.+?)['\"]\)\]")
CASE_RE = re.compile(
    r"case\s+(\w+)\s*=\s*(['\"]?)(\w[\w\-]*)(\2)\s*;", re.IGNORECASE
)
ENUM_DECL_RE = re.compile(r"enum\s+(\w+)\s*:\s*(\w+)")
TABLE_RE = re.compile(r"public\s+const\s+TABLE\s*=\s*['\"](\w+)['\"]")
COLUMN_PROP_RE = re.compile(
    r"#\[Column\((.+?)\)\]\s*(?:#\[.+?\]\s*)*protected\s+\??([\w\\]+)\s+\$(\w+)",
    re.DOTALL,
)
LABEL_ATTR_RE = re.compile(r"label:\s*['\"](.+?)['\"]")


def parse_enum_file(path: Path) -> dict | None:
    text = path.read_text()
    m = ENUM_DECL_RE.search(text)
    if not m:
        return None

    enum_name = m.group(1)
    backing_type = m.group(2)

    cases = []
    lines = text.split("\n")
    pending_label = None

    for line in lines:
        lm = LABEL_RE.search(line)
        if lm:
            pending_label = lm.group(1)
            continue

        cm = CASE_RE.search(line)
        if cm:
            case_name = cm.group(1)
            raw_value = cm.group(3)
            value = int(raw_value) if backing_type == "int" else raw_value
            cases.append({
                "name": case_name,
                "value": value,
                "label": pending_label or case_name,
            })
            pending_label = None

    if not cases:
        return None

    return {
        "enum": enum_name,
        "type": backing_type,
        "file": str(path),
        "cases": cases,
    }


def parse_model_file(path: Path, enum_map: dict[str, dict]) -> dict | None:
    text = path.read_text()

    tm = TABLE_RE.search(text)
    if not tm:
        return None

    table_name = tm.group(1)
    columns_with_enums = []

    for cm in COLUMN_PROP_RE.finditer(text):
        attr_content = cm.group(1)
        type_name = cm.group(2).split("\\")[-1]
        prop_name = cm.group(3)

        if type_name not in enum_map:
            continue

        label_m = LABEL_ATTR_RE.search(attr_content)
        label = label_m.group(1) if label_m else prop_name

        columns_with_enums.append({
            "column": prop_name,
            "label": label,
            "enum": type_name,
        })

    if not columns_with_enums:
        return None

    return {"table": table_name, "columns": columns_with_enums}


def build_yaml(enums: list[dict], mappings: list[dict]) -> dict:
    enum_section = {}
    for e in sorted(enums, key=lambda x: x["enum"]):
        values = {}
        for c in e["cases"]:
            values[c["value"]] = f"{c['name']} ({c['label']})"
        enum_section[e["enum"]] = {
            "type": e["type"],
            "values": values,
        }

    mapping_section = {}
    for m in sorted(mappings, key=lambda x: x["table"]):
        cols = {}
        for c in m["columns"]:
            cols[c["column"]] = {
                "label": c["label"],
                "enum": c["enum"],
            }
        mapping_section[m["table"]] = cols

    return {
        "_generated": "Auto-extracted from PHP codebase. Do NOT edit — re-run extract_context.py instead.",
        "enums": enum_section,
        "column_enum_mappings": mapping_section,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("src_path", help="Path to PHP src/ directory")
    parser.add_argument(
        "-o", "--output",
        default=None,
        help="Output YAML file (default: stdout)",
    )
    args = parser.parse_args()

    src = Path(args.src_path)
    if not src.is_dir():
        print(f"Error: {src} is not a directory", file=sys.stderr)
        sys.exit(1)

    enums_dir = src / "Enums"
    models_dir = src / "Models"

    if not enums_dir.is_dir():
        print(f"Error: {enums_dir} not found", file=sys.stderr)
        sys.exit(1)

    enums = []
    enum_map = {}
    for php_file in sorted(enums_dir.rglob("*.php")):
        result = parse_enum_file(php_file)
        if result:
            enums.append(result)
            enum_map[result["enum"]] = result

    print(f"Found {len(enums)} enums", file=sys.stderr)

    mappings = []
    if models_dir.is_dir():
        for php_file in sorted(models_dir.rglob("*.php")):
            result = parse_model_file(php_file, enum_map)
            if result:
                mappings.append(result)

    print(f"Found {len(mappings)} models with enum columns", file=sys.stderr)

    data = build_yaml(enums, mappings)

    yaml_str = yaml.dump(
        data,
        default_flow_style=False,
        allow_unicode=True,
        sort_keys=False,
        width=120,
    )

    if args.output:
        Path(args.output).write_text(yaml_str)
        print(f"Written to {args.output}", file=sys.stderr)
    else:
        print(yaml_str)


if __name__ == "__main__":
    main()
