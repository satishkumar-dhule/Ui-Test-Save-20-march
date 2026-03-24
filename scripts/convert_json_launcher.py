#!/usr/bin/env python3
import json, sys


def main(path):
    with open(path, "r") as f:
        data = json.load(f)
    apps = data.get("apps", [])
    entries = []
    for a in apps:
        name = a.get("name", "")
        cmd = a.get("cmd", "")
        workspace = a.get("workspace", 1)
        geometry = a.get("geometry", "")
        # Build entry: NAME|CMD|WORKSPACE|GEOMETRY
        if name and cmd:
            if geometry:
                entries.append(f'"{name}|{cmd}|{workspace}|{geometry}"')
            else:
                entries.append(f'"{name}|{cmd}|{workspace}|"')
    print("LAUNCH_APPS=(")
    for e in entries:
        print(f"  {e}")
    print(")")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: convert_json_launcher.py path/to/launcher_config.json")
        sys.exit(2)
    main(sys.argv[1])
