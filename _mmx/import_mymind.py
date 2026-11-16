#!/usr/bin/env python3
"""Import a mymind export into MMX.

Usage: python3 _mmx/import_mymind.py /path/to/mymind-export

Reads the export's items.json (+ images/, thumbs/), writes web-sized media to
mmx/media/ and merges mymind items into _mmx/items/mymind.json. Run
_mmx/build.py afterwards to regenerate mmx/items.json.
"""
import json, os, shutil, sys
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA = os.path.join(ROOT, "mmx", "media")
FULL_MAX = 1600   # longest edge of the lightbox image
THUMB_W = 600     # grid thumbnail width

# Cards that should never be published (work files, private links).
SKIP_HOSTS = ("files.slack.com",)


def save_webp(src, dst, max_w=None, max_edge=None, q=80):
    im = Image.open(src)
    im = ImageOps.exif_transpose(im)
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
    w, h = im.size
    scale = 1.0
    if max_w and w > max_w:
        scale = max_w / w
    if max_edge and max(w, h) * scale > max_edge:
        scale = max_edge / max(w, h)
    if scale < 1:
        im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    im.save(dst, "WEBP", quality=q, method=6)
    return im.size


def main(export):
    items = json.load(open(os.path.join(export, "items.json")))
    os.makedirs(os.path.join(MEDIA, "t"), exist_ok=True)
    out = []
    for it in items:
        url = it.get("url") or ""
        if any(h in url for h in SKIP_HOSTS) or it["type"] == "other":
            continue
        m = it.get("media") or {}
        if not m and not it.get("excerpt"):
            continue  # nothing to show
        rec = {
            "id": "mm-" + it["id"][-10:],
            "source": "mymind",
            "type": it["type"],
            "title": it.get("title"),
            "url": url or None,
            "excerpt": it.get("excerpt"),
            "creator": it.get("creator") if it.get("creator") not in ("X",) else "x.com",
            "added": it["added"],
            "tags": [t.lower() for t in it.get("tags") or []],
            "auto_tags": [t.lower() for t in it.get("auto_tags") or []],
        }
        if m.get("file"):
            base = rec["id"]
            if m.get("mime", "").startswith("video/"):
                shutil.copy(os.path.join(export, m["file"]), os.path.join(MEDIA, base + ".mp4"))
                fw, fh = save_webp(os.path.join(export, m["poster"]), os.path.join(MEDIA, base + ".webp"), max_edge=FULL_MAX)
                rec["media"] = {"video": f"media/{base}.mp4"}
            else:
                fw, fh = save_webp(os.path.join(export, m["file"]), os.path.join(MEDIA, base + ".webp"), max_edge=FULL_MAX)
                rec["media"] = {}
            tsrc = os.path.join(export, m["thumb"]) if m.get("thumb") else os.path.join(export, m["file"])
            tw, th = save_webp(tsrc, os.path.join(MEDIA, "t", base + ".webp"), max_w=THUMB_W, q=72)
            rec["media"].update({"src": f"media/{base}.webp", "thumb": f"media/t/{base}.webp",
                                 "w": fw, "h": fh, "color": m.get("dominant_color")})
        out.append(rec)
    os.makedirs(os.path.join(ROOT, "_mmx", "items"), exist_ok=True)
    with open(os.path.join(ROOT, "_mmx", "items", "mymind.json"), "w") as f:
        json.dump(out, f, indent=1, ensure_ascii=False)
    print(f"mymind: {len(out)} items")


if __name__ == "__main__":
    main(sys.argv[1])
