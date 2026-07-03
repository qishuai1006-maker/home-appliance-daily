#!/usr/bin/env python3
"""
家电选题日报 v4.0 — 编导视角重写
核心：今日必拍TOP3 → 评论区金矿 → 趋势雷达 → 标题公式 → 素材库
"""
import json, os, re, subprocess, time
from collections import Counter, defaultdict
from datetime import datetime, timedelta

DATA_DIR = os.path.expanduser("~/.hermes/cron/output/home_appliance")
TODAY = datetime.now().strftime("%Y-%m-%d")

# ── 1. 加载数据 ──────────────────────────────────────────
with open(os.path.join(DATA_DIR, f"{TODAY}_articles.json")) as f:
    items = json.load(f)
ideas_path = os.path.join(DATA_DIR, f"{TODAY}_ideas.json")
ideas = json.load(open(ideas_path)) if os.path.exists(ideas_path) else []

# 历史数据
all_items = []
for fname in sorted(os.listdir(DATA_DIR)):
    if not fname.endswith('_articles.json') or fname.startswith('analysis'):
        continue
    date = fname.replace('_articles.json', '')
    try:
        day_items = json.load(open(os.path.join(DATA_DIR, fname)))
        for item in day_items:
            item['_date'] = date
        all_items.extend(day_items)
    except:
        pass

print(f"今日: {len(items)} 条 | 历史: {len(all_items)} 条")

# ── 2. 30天时效过滤（编导硬要求）──────────────────────────
CUTOFF = datetime.now() - timedelta(days=30)
def is_fresh(item):
    """检查内容是否在30天内"""
    # 优先用发布时间
    pub = item.get('douyin_pub_date') or item.get('pub_date') or ''
    if pub:
        try:
            d = datetime.strptime(pub[:10], '%Y-%m-%d')
            return d >= CUTOFF
        except:
            pass
    # 没有发布时间的，如果互动量较高就保留（可能是小红书/头条没解析到日期的爆款）
    eng = item.get('douyin_interactions', 0) or item.get('toutiao_engagement', 0) or 0
    return eng >= 1000

fresh_items = [i for i in items if is_fresh(i)]
stale_count = len(items) - len(fresh_items)
if stale_count:
    print(f"🗑️ 过滤 {stale_count} 条 30天外旧内容")
items = fresh_items if fresh_items else items  # 保底：全过滤了就用原数据

# ── 3. 今日必拍 TOP 3（自动选题决策）─────────────────────
def pick_top3(items):
    """从 items 中选出最有选题价值的 3 个，带决策理由"""
    # 按互动量+评分排序
    ranked = sorted(items, key=lambda x: (
        x.get('douyin_interactions', 0) or x.get('toutiao_engagement', 0) or 0,
        x.get('score', 0)
    ), reverse=True)
    
    # 去重品类（避免3个都是空调）
    picks = []
    seen_cats = set()
    seen_angles = set()
    for item in ranked:
        cat = item.get('category', '未知')
        if cat in seen_cats and len(picks) >= 1:
            continue  # 第二个开始要求品类不同
        
        eng = item.get('douyin_interactions', 0) or item.get('toutiao_engagement', 0) or 0
        platform = '抖音' if '抖音' in item.get('source', '') else \
                   '小红书' if '小红书' in item.get('source', '') else \
                   '头条' if '今日头条' in item.get('source', '') else '媒体'
        
        # 生成选题建议
        title = item.get('title', '')
        angle = suggest_angle_auto(item, eng, platform)
        suggested_title = generate_title(title, cat, eng)
        
        pick = {
            'rank': len(picks) + 1,
            'topic': angle['topic'],
            'category': cat,
            'platform': platform,
            'why': angle['why'],
            'angle': angle['angle'],
            'suggested_title': suggested_title,
            'reference': {
                'title': title[:60],
                'author': item.get('source', ''),
                'url': item.get('url', ''),
                'interactions': eng,
                'platform': platform,
                'comments': item.get('douyin_comments', 0) or item.get('toutiao_comment_count', 0) or 0,
            },
        }
        picks.append(pick)
        seen_cats.add(cat)
        if len(picks) >= 3:
            break
    return picks

def suggest_angle_auto(item, eng, platform):
    """根据内容自动建议选题角度"""
    title = item.get('title', '')
    cat = item.get('category', '')
    
    # 判断角度类型
    if re.search(r'拆机|拆解|实测|横评|对比', title):
        return {
            'topic': f'{cat}硬核实测/拆机',
            'why': f'{platform}上拆机/实测类内容互动{eng:,}，用户对"眼见为实"的内容信任度最高',
            'angle': '拆机实测向',
        }
    elif re.search(r'避坑|踩坑|千万别|不选|陷阱', title):
        return {
            'topic': f'{cat}选购避坑',
            'why': f'避坑类内容互动{eng:,}，用户在购买前最焦虑"被坑"，这是最强点击动机',
            'angle': '避坑攻略向',
        }
    elif re.search(r'选购|推荐|怎么选|指南', title):
        return {
            'topic': f'{cat}选购攻略',
            'why': f'选购攻略类内容互动{eng:,}，正值{cat}消费旺季，用户决策需求强',
            'angle': '选购攻略向',
        }
    elif re.search(r'清洗|保养|安装|隐藏|用法', title):
        return {
            'topic': f'{cat}实用技巧/冷知识',
            'why': f'实用技巧类内容互动{eng:,}，用户收藏率高（"先马后看"），长尾流量稳定',
            'angle': '实用知识向',
        }
    elif re.search(r'小米|华为|品牌', title):
        return {
            'topic': f'{cat}品牌对比/跨界评测',
            'why': f'品牌对比类互动{eng:,}，互联网品牌做家电自带话题争议，评论区容易吵起来',
            'angle': '品牌争议向',
        }
    else:
        return {
            'topic': f'{cat}热门话题',
            'why': f'{platform}上{cat}内容互动{eng:,}，是当前热门话题',
            'angle': '热点追踪向',
        }

def generate_title(ref_title, cat, eng):
    """基于参考爆款生成标题建议"""
    # 标题公式库
    formulas = [
        ('避坑', f'{cat}千万别乱买！记住这{["5","6","8"][hash(cat)%3]}点，导购都夸你内行'),
        ('拆机', f'拆了{cat}才知道：{["良心配置","偷工减料","值这个价"][hash(cat)%3]}，别再被参数骗了'),
        ('实测', f'花{["3000","5000","8000"][hash(cat)%3]}买{cat}，实测{["一个月","三个月","半年"][hash(cat)%3]}，真实体验来了'),
        ('故事', f'换了{["2次","3次"][hash(cat)%2]}{cat}才明白，这{["5个","6个"][hash(cat)%2]}教训太贵了'),
        ('攻略', f'{cat}怎么选？记住这{["8句话","6个原则","5个标准"][hash(cat)%3]}就够了'),
    ]
    # 根据参考标题选最合适的公式
    for keyword, template in formulas:
        if keyword in ref_title:
            return template
    # 默认用避坑公式
    return formulas[0][1]

top_picks = pick_top3(items)
print(f"✅ TOP3 选题: {[p['topic'] for p in top_picks]}")

# ── 4. 评论区挖矿（杀手锏功能）──────────────────────────
def mine_comments(items):
    """从小红书 TOP 内容拉取评论，提取高频问题"""
    comment_insights = {
        'top_questions': [],
        'top_complaints': [],
        'hot_keywords': [],
    }
    
    # 只挖小红书 TOP 5 的评论（抖音评论需要另外的 API）
    xhs_items = [i for i in items if i.get('tier') == 'H5'][:5]
    if not xhs_items:
        return comment_insights
    
    all_comments = []
    all_keywords = []
    
    for item in xhs_items:
        url = item.get('url', '')
        title = item.get('title', '')[:30]
        
        # 从 URL 提取 note_id 和 xsec_token
        # 需要重新搜索获取 xsec_token（URL 里可能没有）
        note_id = url.split('/explore/')[-1].split('?')[0].split('/')[0]
        
        try:
            # 先搜索获取带 token 的 URL
            search_title = item.get('title', '')[:20]
            result = subprocess.run(
                ['xhs', 'search', search_title, '--json'],
                capture_output=True, text=True, timeout=15
            )
            if result.returncode != 0:
                continue
            data = json.loads(result.stdout)
            search_items = data.get('data', {}).get('items', [])
            
            # 找到匹配的 note
            target_url = None
            for si in search_items:
                if si.get('id') == note_id:
                    token = si.get('xsec_token', '')
                    target_url = f'https://www.xiaohongshu.com/explore/{note_id}?xsec_token={token}&xsec_source=pc_search'
                    break
            
            if not target_url:
                continue
            
            time.sleep(1)  # 防反爬
            
            # 拉评论
            result = subprocess.run(
                ['xhs', 'comments', target_url, '--json'],
                capture_output=True, text=True, timeout=15
            )
            if result.returncode != 0:
                continue
            data = json.loads(result.stdout)
            if not data.get('ok'):
                continue
            
            comments = data.get('data', {}).get('comments', [])
            for c in comments:
                content = c.get('content', '').strip()
                if len(content) < 4:
                    continue
                like = int(c.get('like_count', 0) or 0)
                all_comments.append({
                    'text': content[:100],
                    'likes': like,
                    'source': title,
                })
                # 简单关键词提取
                for kw in ['推荐', '怎么选', '值得买', '后悔', '坑', '贵', '便宜', '噪音',
                           '安装', '售后', '质量', '对比', '哪个好', '区别', '清洗', '维修',
                           '费电', '省电', '安全', '甲醛', '除菌', '滤芯', '效果']:
                    if kw in content:
                        all_keywords.append(kw)
            
        except Exception as e:
            continue
    
    # 提取高频问题（包含问号的评论）
    questions = [c for c in all_comments if '?' in c['text'] or '？' in c['text'] or '吗' in c['text'] or '怎么' in c['text']]
    questions.sort(key=lambda x: -x['likes'])
    comment_insights['top_questions'] = [
        {'question': q['text'][:80], 'likes': q['likes'], 'source': q['source']}
        for q in questions[:10]
    ]
    
    # 提取吐槽/抱怨
    complaints = [c for c in all_comments if any(w in c['text'] for w in ['后悔', '坑', '垃圾', '太贵', '不好', '难', '吵', '噪音', '费电', '坏'])]
    complaints.sort(key=lambda x: -x['likes'])
    comment_insights['top_complaints'] = [
        {'complaint': c['text'][:80], 'likes': c['likes'], 'source': c['source']}
        for c in complaints[:8]
    ]
    
    # 关键词频率
    kw_counter = Counter(all_keywords)
    comment_insights['hot_keywords'] = [
        {'keyword': kw, 'count': cnt}
        for kw, cnt in kw_counter.most_common(15)
    ]
    comment_insights['total_mined'] = len(all_comments)
    
    return comment_insights

print("💬 挖掘评论区...")
comment_insights = mine_comments(items)
print(f"  采集 {comment_insights['total_mined']} 条评论 | 高频问题 {len(comment_insights['top_questions'])} | 吐槽 {len(comment_insights['top_complaints'])}")

# ── 5. 标题公式库 ────────────────────────────────────────
def extract_title_formulas(all_items):
    """从历史爆款标题中提取标题公式"""
    formulas = []
    
    # 预定义标题公式模板（从家电爆款归纳）
    formula_patterns = [
        {
            'pattern': '换了X次XX才明白...',
            'regex': r'换了\d+次.+才明白',
            'examples': [],
            'power': '高',
            'why': '制造"血泪教训"的代入感，暗示踩过坑后得出真知'
        },
        {
            'pattern': '千万别买XX，除非...',
            'regex': r'千万别买|不要买|别瞎买',
            'examples': [],
            'power': '高',
            'why': '逆反心理+恐惧驱动，点击率最高的公式之一'
        },
        {
            'pattern': 'X个不选/X买X不买',
            'regex': r'\d+不选|\d+买\d+不买|买不买',
            'examples': [],
            'power': '高',
            'why': '清单体+避坑，适合收藏，小红书最容易爆的公式'
        },
        {
            'pattern': '导购不会告诉你的秘密',
            'regex': r'导购|销售|不会告诉你|潜台词',
            'examples': [],
            'power': '中',
            'why': '制造信息差，暗示"内幕消息"'
        },
        {
            'pattern': '拆了X才知道...',
            'regex': r'拆了|拆机|拆解.+才知道|拆开看',
            'examples': [],
            'power': '高',
            'why': '好奇心+硬核信任，适合拆机类内容'
        },
        {
            'pattern': '记住这X句话/X个原则就够了',
            'regex': r'记住这\d+|这\d+句|这\d+个原则',
            'examples': [],
            'power': '中',
            'why': '降低认知负担，承诺简单易懂'
        },
        {
            'pattern': 'X年XX经验/行业老兵',
            'regex': r'\d+年.+经验|老兵|内行人|从业',
            'examples': [],
            'power': '中',
            'why': '权威背书，增强可信度'
        },
    ]
    
    for item in all_items:
        title = item.get('title', '')
        eng = item.get('douyin_interactions', 0) or item.get('toutiao_engagement', 0) or 0
        for fp in formula_patterns:
            if re.search(fp['regex'], title) and eng > 1000:
                fp['examples'].append({
                    'title': title[:50],
                    'eng': eng,
                    'source': item.get('source', ''),
                })
    
    # 只保留有例子的公式，按例子数排序
    for fp in formula_patterns:
        fp['viral_count'] = len(fp['examples'])
        fp['total_eng'] = sum(e['eng'] for e in fp['examples'])
    
    formulas = [fp for fp in formula_patterns if fp['viral_count'] > 0]
    formulas.sort(key=lambda x: -x['total_eng'])
    
    return formulas

title_formulas = extract_title_formulas(all_items)
print(f"📝 标题公式: {len(title_formulas)} 个")

# ── 6. 时机雷达 ──────────────────────────────────────────
def get_timing_alerts():
    """基于当前日期生成选题时机提醒"""
    now = datetime.now()
    month, day = now.month, now.day
    alerts = []
    
    timing_db = [
        # (起止月日, 事件, 建议品类, 建议方向, 紧急度)
        ((6, 1, 6, 20), '618 大促', '全品类', '618返场/抄底/降价对比', 'high'),
        ((6, 15, 7, 15), '夏季高温期', '空调/风扇/冰箱', '选购/清洗/省电/安装', 'high'),
        ((7, 1, 8, 15), '三伏天将至', '空调/除湿机/电风扇', '高温家电选购+除湿防潮', 'high'),
        ((8, 1, 9, 30), '开学季', '小家电/电饭煲/洗衣机', '学生宿舍家电推荐', 'medium'),
        ((9, 15, 10, 15), '国庆促销预热', '全品类', '国庆比价/新品发布', 'medium'),
        ((10, 20, 11, 11), '双11 大促', '全品类', '双11选购攻略/比价/预售', 'high'),
        ((11, 20, 12, 25), '年终大促', '全品类', '年终总结/双12/圣诞促销', 'medium'),
        ((12, 1, 2, 28), '冬季取暖', '电暖器/浴霸/热水器', '冬季取暖/热水器选购', 'medium'),
    ]
    
    for (sm, sd, em, ed), event, category, direction, urgency in timing_db:
        start = datetime(now.year, sm, sd)
        end = datetime(now.year, em, ed)
        if start <= now <= end:
            days_left = (end - now).days
            alerts.append({
                'event': event,
                'category': category,
                'direction': direction,
                'urgency': urgency,
                'days_left': days_left,
                'status': '进行中' if days_left > 7 else '窗口期即将关闭！',
            })
    
    # 如果没有匹配的，给一个默认提醒
    if not alerts:
        alerts.append({
            'event': '日常选题',
            'category': '全品类',
            'direction': '关注近期爆款跟进',
            'urgency': 'low',
            'days_left': 0,
            'status': '常规期',
        })
    
    return alerts

timing_alerts = get_timing_alerts()

# ── 7. 品类趋势（简化版）────────────────────────────────
cat_data = defaultdict(lambda: {'count': 0, 'scores': [], 'interactions': [], 'today_count': 0})
for item in all_items:
    cat = item.get('category', '未知')
    cat_data[cat]['count'] += 1
    cat_data[cat]['scores'].append(item.get('score', 0.0))
    cat_data[cat]['interactions'].append(item.get('douyin_interactions', 0) or item.get('toutiao_engagement', 0) or 0)
    if item.get('_date') == TODAY:
        cat_data[cat]['today_count'] += 1

category_trend = []
for cat, d in sorted(cat_data.items(), key=lambda x: -sum(x[1]['interactions'])):
    total_inter = sum(d['interactions'])
    avg_score = round(sum(d['scores']) / max(len(d['scores']), 1), 1)
    today = d['today_count']
    # 判断趋势：今日 vs 历史
    trend = '🔥' if today > 0 and total_inter > 100000 else '📈' if total_inter > 10000 else '💤'
    category_trend.append({
        'category': cat,
        'total_items': d['count'],
        'today_items': today,
        'total_interactions': total_inter,
        'avg_score': avg_score,
        'trend_icon': trend,
    })

# ── 8. 输出 data.js ──────────────────────────────────────
now_time = datetime.now().strftime("%H:%M")
data = {
    "date": TODAY,
    "generated_at": now_time,
    "freshness_cutoff": "30天",
    "total_today": len(items),
    
    # 核心决策区
    "top_picks": top_picks,
    
    # 评论区金矿
    "comment_insights": comment_insights,
    
    # 标题公式库
    "title_formulas": title_formulas,
    
    # 时机雷达
    "timing_alerts": timing_alerts,
    
    # 品类趋势
    "category_trend": category_trend,
    
    # 原始素材库
    "items": items,
    "ideas": ideas,
}

out_path = os.path.expanduser("~/home-appliance-daily/data.js")
header = f"/* 家电选题日报 v4.0 · 编导视角 · {TODAY} {now_time} */\n"
content = header + "const TODAY_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"

with open(out_path, 'w') as f:
    f.write(content)

print(f"\n✅ 已生成 {out_path}")
print(f"   文件: {os.path.getsize(out_path):,} bytes")
print(f"   TOP3选题 | 评论区{comment_insights['total_mined']}条 | 标题公式{len(title_formulas)}个 | 时机{len(timing_alerts)}个 | 素材{len(items)}条")
