# MMX data pipeline

/mmx/ is a static page (mmx/index.html, mmx.js, mmx.css) that reads mmx/items.json.

1. Each source has an importer that writes normalised items to `_mmx/items/<source>.json`
   and web-sized media to `mmx/media/` (full ≤1600px, thumbs 600px wide in `mmx/media/t/`).
   - mymind: `python3 _mmx/import_mymind.py /path/to/mymind-export`
2. `python3 _mmx/build.py` merges every source, tidies tags and writes `mmx/items.json`.

Item fields: id, source, type, title, url, excerpt, creator, added, tags, media{src, thumb, w, h, color, video?}.

Your own tags always show. Machine tags (mymind auto-tags) are merged through ALIASES in
build.py, dropped if in DENY, and kept only once used on 5+ items.
To hide an item, add its id to `_mmx/hidden.txt` (one per line) and rebuild.
