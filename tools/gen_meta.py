"""Generate Cocos Creator .meta files for runtime art assets.

This project loads UI images with resources.load(), so any programmatically
loaded sprite must live under assets/resources and have a spriteFrame sub-meta.
The script also refreshes the copied assets/art/ui mirror so those metas do not
carry fake 256x256 dimensions.
"""

from __future__ import annotations

import json
import os
import struct
import sys
import uuid
from pathlib import Path


IMAGE_EXTENSIONS = {".png"}


def new_uuid() -> str:
    return str(uuid.uuid4())


def read_json(path: Path) -> dict | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def write_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def png_size(path: Path) -> tuple[int, int]:
    with path.open("rb") as handle:
        header = handle.read(24)
    if len(header) < 24 or header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
        raise ValueError(f"Unsupported PNG header: {path}")
    return struct.unpack(">II", header[16:24])


def existing_uuid(path: Path) -> str:
    meta = read_json(path)
    value = meta.get("uuid") if isinstance(meta, dict) else None
    return value if isinstance(value, str) and value else new_uuid()


def ensure_dir_meta(directory: Path, *, force: bool = False) -> bool:
    meta_path = directory.with_name(directory.name + ".meta")
    if meta_path.exists() and not force:
        return False

    meta = read_json(meta_path) or {}
    data = {
        "ver": meta.get("ver", "1.2.0"),
        "importer": "directory",
        "imported": True,
        "uuid": meta.get("uuid") or new_uuid(),
        "files": meta.get("files", []),
        "subMetas": meta.get("subMetas", {}),
        "userData": meta.get("userData", {}),
    }
    write_json(meta_path, data)
    return True


def ensure_ts_meta(path: Path, *, force: bool = False) -> bool:
    meta_path = path.with_name(path.name + ".meta")
    if meta_path.exists() and not force:
        return False

    meta = read_json(meta_path) or {}
    data = {
        "ver": meta.get("ver", "4.0.24"),
        "importer": "typescript",
        "imported": True,
        "uuid": meta.get("uuid") or new_uuid(),
        "files": meta.get("files", []),
        "subMetas": meta.get("subMetas", {}),
        "userData": meta.get("userData", {}),
    }
    write_json(meta_path, data)
    return True


def image_meta(path: Path) -> dict:
    width, height = png_size(path)
    meta_path = path.with_name(path.name + ".meta")
    image_uuid = existing_uuid(meta_path)
    stem = path.stem
    half_w = width / 2
    half_h = height / 2

    return {
        "ver": "1.0.27",
        "importer": "image",
        "imported": True,
        "uuid": image_uuid,
        "files": [".json", ".png"],
        "subMetas": {
            "6c48a": {
                "importer": "texture",
                "uuid": f"{image_uuid}@6c48a",
                "displayName": stem,
                "id": "6c48a",
                "name": "texture",
                "userData": {
                    "wrapModeS": "clamp-to-edge",
                    "wrapModeT": "clamp-to-edge",
                    "imageUuidOrDatabaseUri": image_uuid,
                    "isUuid": True,
                    "visible": False,
                    "minfilter": "linear",
                    "magfilter": "linear",
                    "mipfilter": "none",
                    "anisotropy": 0,
                },
                "ver": "1.0.22",
                "imported": True,
                "files": [".json"],
                "subMetas": {},
            },
            "f9941": {
                "importer": "sprite-frame",
                "uuid": f"{image_uuid}@f9941",
                "displayName": stem,
                "id": "f9941",
                "name": "spriteFrame",
                "userData": {
                    "trimThreshold": 1,
                    "rotated": False,
                    "offsetX": 0,
                    "offsetY": 0,
                    "trimX": 0,
                    "trimY": 0,
                    "width": width,
                    "height": height,
                    "rawWidth": width,
                    "rawHeight": height,
                    "borderTop": 0,
                    "borderBottom": 0,
                    "borderLeft": 0,
                    "borderRight": 0,
                    "packable": True,
                    "pixelsToUnit": 100,
                    "pivotX": 0.5,
                    "pivotY": 0.5,
                    "meshType": 0,
                    "vertices": {
                        "rawPosition": [
                            -half_w,
                            -half_h,
                            0,
                            half_w,
                            -half_h,
                            0,
                            -half_w,
                            half_h,
                            0,
                            half_w,
                            half_h,
                            0,
                        ],
                        "indexes": [0, 1, 2, 2, 1, 3],
                        "uv": [0, height, width, height, 0, 0, width, 0],
                        "nuv": [0, 1, 1, 1, 0, 0, 1, 0],
                        "minPos": [-half_w, -half_h, 0],
                        "maxPos": [half_w, half_h, 0],
                    },
                    "isUuid": True,
                    "imageUuidOrDatabaseUri": f"{image_uuid}@6c48a",
                    "atlasUuid": "",
                    "trimType": "auto",
                },
                "ver": "1.0.12",
                "imported": True,
                "files": [".json"],
                "subMetas": {},
            },
        },
        "userData": {
            "type": "sprite-frame",
            "fixAlphaTransparencyArtifacts": False,
            "hasAlpha": True,
            "redirect": f"{image_uuid}@6c48a",
        },
    }


def ensure_image_meta(path: Path, *, force: bool = False) -> bool:
    meta_path = path.with_name(path.name + ".meta")
    if meta_path.exists() and not force:
        return False

    write_json(meta_path, image_meta(path))
    return True


def walk_dirs(root: Path) -> list[Path]:
    if not root.exists():
        return []
    dirs = [root]
    dirs.extend(path for path, _, _ in os.walk(root) if Path(path) != root)
    return [Path(path) for path in dirs]


def walk_images(root: Path) -> list[Path]:
    if not root.exists():
        return []
    return sorted(path for path in root.rglob("*") if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS)


def main() -> int:
    project_root = Path(__file__).resolve().parents[1]
    assets = project_root / "assets"

    changed = 0

    # Script metas used by the mobile UI migration.
    for path in [
        assets / "scripts" / "ui" / "MobileUIFactory.ts",
        assets / "scripts" / "ui" / "MobileSceneBase.ts",
        assets / "scripts" / "mock" / "MockData.ts",
    ]:
        if path.exists() and ensure_ts_meta(path):
            changed += 1
            print(f"TS   {path.relative_to(project_root)}")

    # Runtime-loadable art. This is the path UiSkin/resources.load uses.
    runtime_roots = [
        assets / "resources",
        assets / "resources" / "art",
    ]
    for root in runtime_roots:
        for directory in walk_dirs(root):
            if ensure_dir_meta(directory):
                changed += 1
                print(f"DIR  {directory.relative_to(project_root)}")

    for image in walk_images(assets / "resources" / "art"):
        if ensure_image_meta(image):
            changed += 1
            print(f"IMG  {image.relative_to(project_root)}")

    # Copied mirror used for source organization. Force-refresh these because a
    # previous script wrote 256x256 placeholder sprite data.
    mirror = assets / "art" / "ui"
    for directory in walk_dirs(mirror):
        if ensure_dir_meta(directory):
            changed += 1
            print(f"DIR  {directory.relative_to(project_root)}")

    for image in walk_images(mirror):
        if ensure_image_meta(image, force=True):
            changed += 1
            print(f"IMG  {image.relative_to(project_root)}")

    print(f"\nDone. Changed {changed} meta file(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
