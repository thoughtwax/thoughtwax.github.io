#!/usr/bin/env python3
"""Merge every source in _mmx/items/*.json into mmx/items.json.

Your own tags (Pinboard, Readwise, mymind manual tags, wiki) are always kept.
Machine tags (mymind auto_tags) are folded through ALIASES, dropped if in
DENY, and only kept once a tag is used on at least MIN_AUTO items.
Any id listed in _mmx/hidden.txt is left out.
"""
import collections, glob, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIN_AUTO = 5

ALIASES = {
    "user interface": "interface", "graphic design": "design", "graphics": "design",
    "digital art": "art", "visual arts": "art", "drawing": "illustration", "sketch": "illustration",
    "cartoon": "comics", "comic": "comics", "meme": "humor", "internet culture": "humor",
    "command line": "terminal", "programming": "software", "software development": "software",
    "computer": "computers", "technology": "tech", "infographic": "data visualization",
    "monochrome": "black and white", "geometric pattern": "geometric", "retro": "vintage",
    "futuristic": "sci-fi", "cyberpunk": "sci-fi", "technical drawing": "diagram",
    "dark theme": "dark ui", "book": "books", "poster": "posters", "productivity": "work",
    "business": "work", "motivation": "work", "artificial intelligence": "ai",
}
DENY = {"image", "slope", "number", "black", "darkness", "multimedia", "circle", "blue",
        "paper", "graphics", "social media", "symmetry", "stationery", "abstract", "concept art"}
OWN_DENY = {"tags", "posts", "highlight", "read later"}  # mymind housekeeping tags


def norm(t):
    t = t.strip().lower()
    return ALIASES.get(t, t)


def main():
    hidden = set()
    hp = os.path.join(ROOT, "_mmx", "hidden.txt")
    if os.path.exists(hp):
        hidden = {l.split("#")[0].strip() for l in open(hp)} - {""}
    items = []
    for f in sorted(glob.glob(os.path.join(ROOT, "_mmx", "items", "*.json"))):
        items += [i for i in json.load(open(f)) if i["id"] not in hidden]

    auto_counts = collections.Counter()
    for i in items:
        auto_counts.update({norm(t) for t in i.get("auto_tags", [])} - DENY)
    keep_auto = {t for t, c in auto_counts.items() if c >= MIN_AUTO}

    for i in items:
        own = [norm(t) for t in i.get("tags", []) if t not in OWN_DENY]
        auto = [norm(t) for t in i.pop("auto_tags", []) if norm(t) in keep_auto]
        seen, tags = set(), []
        for t in own + auto:
            if t not in seen:
                seen.add(t); tags.append(t)
        i["tags"] = tags
        i = {k: v for k, v in i.items() if v not in (None, [], "")}

    items = [{k: v for k, v in i.items() if v not in (None, [], "")} for i in items]
    items.sort(key=lambda i: i["added"], reverse=True)
    counts = collections.Counter(t for i in items for t in i.get("tags", []))
    out = {"tags": dict(sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))), "items": items}
    with open(os.path.join(ROOT, "mmx", "items.json"), "w") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"{len(items)} items, {len(counts)} tags")
    print(", ".join(f"{t} {c}" for t, c in counts.most_common()))


if __name__ == "__main__":
    main()
