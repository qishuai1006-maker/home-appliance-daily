#!/usr/bin/env python3
"""把 2026-07-02_articles.json + 2026-07-02_ideas.json → data.js"""
import json
import os
from datetime import datetime

OUT_DIR = os.path.expanduser("~/.hermes/cron/output/home_appliance")
today = datetime.now().strftime("%Y-%m-%d")
articles_path = os.path.join(OUT_DIR, f"{today}_articles.json")
ideas_path = os.path.join(OUT_DIR, f"{today}_ideas.json")

with open(articles_path) as f:
    items = json.load(f)
with open(ideas_path) as f:
    ideas = json.load(f)

# 转换选题灵感格式
def idea_to_item(idea):
    return {
        "title": idea.get("title_a", ""),
        "title_b": idea.get("title_b", ""),
        "category": idea.get("category", "综合"),
        "angle": idea.get("angle", ""),
        "reason": idea.get("reason", ""),
        "diff": idea.get("diff", ""),
        "toutiao_tip": idea.get("toutiao_tip", ""),
        "refs": idea.get("refs", []),
        "difficulty": idea.get("difficulty", "medium"),
        "tier": "IDEA",
    }

# 把灵感中的 ref 对应的 item 加 title_suggest 字段（兼容前端）
refs_to_titles = {}
for idea in ideas:
    for ref in idea.get("refs", []):
        if 1 <= ref <= len(items):
            title = items[ref-1].get("title", "")
            refs_to_titles[ref] = title

for i, item in enumerate(items):
    ref_idx = i + 1
    if ref_idx in refs_to_titles:
        item["title_suggest"] = refs_to_titles[ref_idx]
    item.setdefault("title_suggest", "")

now_time = datetime.now().strftime("%H:%M")
data = {
    "date": today,
    "run_time": now_time,
    "items": items,
    "ideas": [idea_to_item(x) for x in ideas],
}

# 写入 data.js
out_path = os.path.join(os.path.dirname(__file__), "data.js")
header = f"/* 家电行业日报数据 · 生成于 {today} {now_time} */\n"
content = header + "const TODAY_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"

with open(out_path, "w") as f:
    f.write(content)

print(f"✓ 已生成 {out_path}")
print(f"  - 资讯: {len(items)} 条")
print(f"  - 灵感: {len(ideas)} 条")
