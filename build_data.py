#!/usr/bin/env python3
"""
家电选题日报 v5.0 — 编导作战台版
=================================
核心定位：七哥家电说短视频编导打开页面 10 秒内能回答：
1. 今天拍哪 3 条
2. 每条前 3 秒怎么开
3. 用户为什么会点/看/评
4. 画面怎么拍
5. 能不能改成图文

P0 改造：
- TOP3 从"品类方向"→"具体视频选题"（场景+参数+冲突+可拍）
- 每条 TOP3 有 3 个版本的 3 秒开头
- 评论区金矿 → 评论转选题
- 视频爆点分 / 图文可写分 拆开
- 素材库加"可复刻点"
- 标题公式追踪（近14天使用次数/疲劳风险）
- 品类热度解释"为什么没进TOP3"
"""
import json, os, re, subprocess, time
from collections import Counter, defaultdict
from datetime import datetime, timedelta

DATA_DIR = os.path.expanduser("~/.hermes/cron/output/home_appliance")
TODAY = datetime.now().strftime("%Y-%m-%d")

# LLM 配置（参考 home_appliance_digest.py）
try:
    _env_content = open(os.path.expanduser("~/.hermes/.env")).read()
    _m = re.search(r'GLM_API_KEY=(.+)', _env_content)
    LLM_KEY = _m.group(1).strip() if _m else ""
except Exception:
    LLM_KEY = os.environ.get("GLM_API_KEY", "") or os.environ.get("ZAI_API_KEY", "")
LLM_BASE = "https://open.bigmodel.cn/api/coding/paas/v4"
LLM_MODEL = "glm-5.2"

# ════════════════════════════════════════════════════════════
# 1. 加载数据
# ════════════════════════════════════════════════════════════
with open(os.path.join(DATA_DIR, f"{TODAY}_articles.json")) as f:
    items = json.load(f)
ideas_path = os.path.join(DATA_DIR, f"{TODAY}_ideas.json")
ideas = json.load(open(ideas_path)) if os.path.exists(ideas_path) else []

# 历史
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

# ════════════════════════════════════════════════════════════
# 2. 30天时效过滤
# ════════════════════════════════════════════════════════════
CUTOFF = datetime.now() - timedelta(days=30)
def is_fresh(item):
    pub = item.get('douyin_pub_date') or item.get('pub_date') or ''
    if pub:
        try:
            return datetime.strptime(pub[:10], '%Y-%m-%d') >= CUTOFF
        except:
            pass
    eng = item.get('douyin_interactions', 0) or item.get('toutiao_engagement', 0) or 0
    return eng >= 1000

fresh_items = [i for i in items if is_fresh(i)]
stale_count = len(items) - len(fresh_items)
if stale_count:
    print(f"🗑️ 过滤 {stale_count} 条 30天外旧内容")
items = fresh_items if fresh_items else items

# ════════════════════════════════════════════════════════════
# 3. 标题公式使用追踪（近14天）
# ════════════════════════════════════════════════════════════
TITLE_FORMULA_PATTERNS = [
    {
        'name': '参数错位型',
        'regex': r'(别(只|先)看|不是.+而是|其实.+关键|参数.{0,3}(骗|坑)|静压|风量|排烟|外机|压缩机)',
        'power': '高',
        'desc': '颠覆用户已有认知，建立专业感',
    },
    {
        'name': '避坑警告型',
        'regex': r'(千万别|不要买|别瞎买|踩坑|陷阱|翻车|退货|后悔)',
        'power': '高',
        'desc': '恐惧驱动，点击率最高的公式',
    },
    {
        'name': 'N点攻略型',
        'regex': r'(记住这\d+|这\d+句|这\d+个|\d+个不选|\d+买\d+不买|\d+点)',
        'power': '中',
        'desc': '清单体，收藏率高，疲劳风险中等',
    },
    {
        'name': '场景判决型',
        'regex': r'(\d+层|\d+楼|高层|低层|开放厨房|小户型|出租屋|新房|旧房|精装|毛坯)',
        'power': '高',
        'desc': '具体场景+具体判断，对号入座感强',
    },
    {
        'name': '装修师傅型',
        'regex': r'(内行|老兵|师傅|导购|销售|从业|潜台词|不会告诉你|内行人)',
        'power': '中',
        'desc': '权威背书+信息差',
    },
    {
        'name': '实测开箱型',
        'regex': r'(拆了|拆机|实测|测试|用了\d+(\u5e74|月|天)|横评|对比|体验)',
        'power': '高',
        'desc': '硬核信任，眼见为实',
    },
    {
        'name': '反问悬念型',
        'regex': r'(为什么|怎么(办|选|买)|是不是|真的假的|智商税|神器|神器or)',
        'power': '中',
        'desc': '引发好奇，推动用户看答案',
    },
    {
        'name': '账单反噬型',
        'regex': r'(\d+元|\d+块|贵了|便宜|省钱|费电|省电|电费|账单|一度电)',
        'power': '中',
        'desc': '钱是最好用的钩子',
    },
    {
        'name': '血泪教训型',
        'regex': r'(换了\d+次|踩了\d+个坑|后悔|早知道|换过|入住\d+(\u4e2a)?月)',
        'power': '高',
        'desc': '代入感强，故事感强',
    },
]

def detect_formula(title):
    """检测一条标题用的是什么公式"""
    for f in TITLE_FORMULA_PATTERNS:
        if re.search(f['regex'], title):
            return f['name']
    return None

# 近14天标题公式使用频次
cutoff_14 = datetime.now() - timedelta(days=14)
formula_usage_14d = Counter()
formula_examples_14d = defaultdict(list)
for item in all_items:
    pub = item.get('douyin_pub_date') or ''
    if pub:
        try:
            if datetime.strptime(pub[:10], '%Y-%m-%d') < cutoff_14:
                continue
        except:
            continue
    fname = detect_formula(item.get('title', ''))
    if fname:
        formula_usage_14d[fname] += 1
        eng = item.get('douyin_interactions', 0) or item.get('toutiao_engagement', 0) or 0
        if eng > 1000 and len(formula_examples_14d[fname]) < 3:
            formula_examples_14d[fname].append({
                'title': item.get('title', '')[:60],
                'eng': eng,
            })

# 公式疲劳评估
def formula_fatigue(name, used_14d):
    """返回低/中/高 三个等级"""
    if used_14d == 0:
        return '未使用', '低'
    if used_14d <= 2:
        return f'{used_14d}次（新鲜）', '低'
    if used_14d <= 5:
        return f'{used_14d}次（适中）', '中'
    return f'{used_14d}次（高疲劳）', '高'

# ════════════════════════════════════════════════════════════
# 4. LLM 调用（评论转选题 + TOP3精细化）
# ════════════════════════════════════════════════════════════
def call_llm(prompt, system="", max_tokens=2000, temperature=0.7):
    """调用智谱 GLM"""
    if not LLM_KEY:
        print(f"    [LLM跳过] LLM_KEY 为空")
        return None
    print(f"    [LLM调用] model={LLM_MODEL} max_tokens={max_tokens} prompt_len={len(prompt)}")
    try:
        from openai import OpenAI
        client = OpenAI(api_key=LLM_KEY, base_url=LLM_BASE, timeout=90.0)
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        resp = client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"  ⚠️ LLM 错误: {e}")
        return None

def parse_json_safe(text):
    """从 LLM 输出提取 JSON"""
    if not text:
        print(f"    [parse] 文本为空")
        return None
    # 去掉 markdown 标记
    text = re.sub(r'^```(json)?\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'\s*```$', '', text, flags=re.MULTILINE)
    # 找最外层 {}
    m = re.search(r'\{[\s\S]*\}', text)
    if not m:
        print(f"    [parse] 未找到 {{}}: text前100={text[:100]!r}")
        return None
    try:
        return json.loads(m.group(0))
    except Exception as e:
        print(f"    [parse] JSON 错误: {e} | text前100={text[:100]!r}")
        try:
            cleaned = m.group(0).replace('\n', ' ').replace('\r', '')
            return json.loads(cleaned)
        except Exception as e2:
            print(f"    [parse] 清理后仍失败: {e2}")
            return None

# ════════════════════════════════════════════════════════════
# 5. TOP3 候选池（先筛选有潜力的）
# ════════════════════════════════════════════════════════════
def pick_top3_candidates(items, n=8):
    """选出 8 个候选，让 LLM 在里面挑 3 个最佳"""
    # 排序：互动量×权重 + 评分
    ranked = sorted(items, key=lambda x: (
        (x.get('douyin_interactions', 0) or x.get('toutiao_engagement', 0) or 0) * 0.0001 +
        (x.get('score', 0) or 0) +
        (1.5 if x.get('category_bonus', 0) > 0 else 0)
    ), reverse=True)
    
    candidates = []
    seen_cats = Counter()
    for item in ranked:
        cat = item.get('category', '其他')
        # 同品类最多 3 个
        if seen_cats[cat] >= 3:
            continue
        eng = item.get('douyin_interactions', 0) or item.get('toutiao_engagement', 0) or 0
        # 互动太低的不进
        if eng < 50 and item.get('score', 0) < 8:
            continue
        candidates.append(item)
        seen_cats[cat] += 1
        if len(candidates) >= n:
            break
    return candidates

top3_candidates = pick_top3_candidates(items, n=8)
print(f"📋 TOP3 候选池: {len(top3_candidates)} 条")

# ════════════════════════════════════════════════════════════
# 6. LLM 精细化生成 TOP3（每条 12 字段）
# ════════════════════════════════════════════════════════════
TOP3_SYSTEM_PROMPT = """你是"七哥家电说"短视频团队的资深编导 + 选题策划，专门把"品类方向"变成"可拍选题"。

你的任务：基于给定的爆款素材和评论，提炼出 3 条具体可拍的短视频选题。

每条选题必须包含 12 个字段（按 JSON 格式输出）：
{
  "picks": [
    {
      "video_title": "具体的短视频标题（含场景/参数/价格/冲突，不能是'XX选购攻略'这种大方向）",
      "category": "空调/电视/冰箱/洗衣机/热水器/油烟机/厨电/集成灶/扫地机器人/显示器 等",
      "content_type": "短视频优先/图文优先/两者都适合",
      "account_tags": ["七哥家电说", "牛科技", "牛科技说"] 中选合适的标签
      "video_score": 0-100 的视频爆点分（看3秒开头/评论争议/可视化/痛点/实体锚点/画面可拍性）
      "image_text_score": 0-100 的图文可写分（看信息密度/收藏价值/参数解释/标题点击力/结论可复用/证据完整度）
      "score_reason": "一句话说明为什么值得拍（基于用户真实痛点）",
      "user_pain": "用户到底怕什么/烦什么/后悔什么",
      "core_conflict": "用户以为A重要，实际B更影响体验（A→B 的颠覆）",
      "openings_3s": [
        "3秒开头版本1（钩子要狠，第一句话就要让用户停下）",
        "3秒开头版本2（不同角度切入）",
        "3秒开头版本3（争议或反问开头）"
      ],
      "shooting_plan": [
        "画面建议1（具体到画面：参数截图/烟道图/厨房实拍/产品特写/评论区截图/价格截图/对比图 等）",
        "画面建议2",
        "画面建议3",
        "画面建议4"
      ],
      "comment_hook": "一句评论区引导语（让用户自发评论）",
      "risk_warning": "风险提醒（不要写X，除非有证据/不要Y/Z 等）",
      "formula_name": "用到了哪个标题公式（参数错位型/避坑警告型/N点攻略型/场景判决型/装修师傅型/实测开箱型/反问悬念型/账单反噬型/血泪教训型）",
      "ref_title": "参考爆款标题",
      "ref_engagement": 参考爆款互动量,
      "ref_url": 参考爆款链接
    }
  ]
}

严格要求：
1. video_title 必须是具体可拍的题目，不能是"XX选购攻略"这种品类方向
   ❌ 错误："厨电选购攻略"
   ✅ 正确："17层开放厨房买油烟机，别只看风量，静压不够照样跑烟"
2. openings_3s 必须给 3 个不同角度的版本，每个都要有钩子
3. shooting_plan 必须具体到画面，不能只说"展示产品"
4. account_tags 只打标签不排期
5. video_score 和 image_text_score 必须分开打分
6. 输出严格 JSON，不要任何解释文字"""

def generate_top3(candidates):
    """用 LLM 把候选池生成 3 条精细化 TOP3"""
    cand_text = ""
    for i, c in enumerate(candidates):
        eng = c.get('douyin_interactions', 0) or c.get('toutiao_engagement', 0) or 0
        comments = c.get('douyin_comments', 0) or c.get('toutiao_comment_count', 0) or 0
        cand_text += f"""
[{i+1}] 标题：{c.get('title','')}
    品类：{c.get('category','')}
    角度：{c.get('angle','')}
    互动：{eng} | 评论：{comments}
    来源：{c.get('source','')}
    链接：{c.get('url','')}
    评论挖矿状态：{c.get('comment_status','')}
"""
    
    prompt = f"""今日家电爆款素材池（{TODAY}）：

{cand_text}

请从中选出最有视频化价值的 3 条，按 12 字段生成精细化选题。

挑选标准：
- 优先选有具体场景/参数/用户痛点的素材
- 优先选评论数多（说明争议大、用户有话说）的素材
- 3 条尽量覆盖不同品类（不要 3 条都是空调）
- 每条 video_title 必须是具体可拍题目，不是品类方向
"""
    
    raw = call_llm(prompt, TOP3_SYSTEM_PROMPT, max_tokens=6000, temperature=0.8)
    parsed = parse_json_safe(raw)
    if parsed and 'picks' in parsed and len(parsed['picks']) >= 3:
        return parsed['picks'][:3]
    return None

print("🎬 LLM 生成 TOP3 精细化选题...")
top_picks = generate_top3(top3_candidates)
if top_picks:
    print(f"  ✅ LLM 生成 {len(top_picks)} 条 TOP3")
else:
    print("  ⚠️ LLM 生成失败，用规则兜底")
    top_picks = []

# 兜底：LLM 失败时用规则生成
def fallback_top3(items, n=3):
    """LLM 失败时的兜底方案"""
    picks = []
    seen_cats = []
    for item in items[:20]:
        cat = item.get('category', '')
        if cat in seen_cats and len(picks) >= 1:
            continue
        eng = item.get('douyin_interactions', 0) or item.get('toutiao_engagement', 0) or 0
        title = item.get('title', '')
        picks.append({
            'video_title': title[:50],
            'category': cat,
            'content_type': '两者都适合',
            'account_tags': ['七哥家电说', '牛科技'],
            'video_score': min(95, int((item.get('score', 0) or 7) * 10)),
            'image_text_score': min(95, int((item.get('score', 0) or 7) * 10) - 5),
            'score_reason': f'基于爆款{eng}互动 + 评分{item.get("score",0)}',
            'user_pain': '用户购买决策前焦虑',
            'core_conflict': '用户以为参数大=好，实际场景匹配更重要',
            'openings_3s': [
                f'买{cat}之前，先问自己一个问题。',
                f'买{cat}千万别只看参数，场景不对再贵也白搭。',
                f'为什么别人买的{cat}好用，你买回去就翻车？',
            ],
            'shooting_plan': [
                '参数页截图（突出对比）',
                '实际使用场景',
                '评论区精选',
                '产品局部特写',
            ],
            'comment_hook': f'你家在用什么{cat}？评论区说说',
            'risk_warning': '不要写虚标，除非有检测证据',
            'formula_name': '避坑警告型',
            'ref_title': title[:50],
            'ref_engagement': eng,
            'ref_url': item.get('url', ''),
        })
        seen_cats.append(cat)
        if len(picks) >= n:
            break
    return picks

if not top_picks or len(top_picks) < 3:
    top_picks = fallback_top3(items)

# 给每条 TOP3 加排名和疲劳状态
for i, pick in enumerate(top_picks):
    pick['rank'] = i + 1
    formula_name = pick.get('formula_name', '参数错位型')
    used_14d = formula_usage_14d.get(formula_name, 0)
    usage_text, fatigue_level = formula_fatigue(formula_name, used_14d)
    pick['formula_used_14d'] = used_14d
    pick['formula_usage_text'] = usage_text
    pick['formula_fatigue'] = fatigue_level

print(f"✅ TOP3 精细化完成: {[p.get('video_title','')[:30] for p in top_picks]}")

# ════════════════════════════════════════════════════════════
# 7. 评论区金矿 + 评论转选题
# ════════════════════════════════════════════════════════════
def mine_comments(items, top_picks):
    """拉评论 + 转选题"""
    insights = {
        'total_mined': 0,
        'top_questions': [],
        'top_complaints': [],
        'hot_keywords': [],
        'transformed_picks': [],  # 新增：评论转选题
        'by_category': defaultdict(list),  # 新增：按品类分
    }
    
    # 优先用 TOP3 引用的素材
    target_items = []
    for pick in top_picks:
        for item in items:
            if item.get('url') == pick.get('ref_url'):
                target_items.append(item)
                break
    
    # 加上其他高互动
    for item in items[:8]:
        if item not in target_items:
            target_items.append(item)
        if len(target_items) >= 3:
            break
    
    all_comments = []
    all_keywords = []
    comment_to_pick = []  # (comment_text, source_title, like_count, cat)
    
    for item in target_items:
        title = item.get('title', '')[:40]
        url = item.get('url', '')
        cat = item.get('category', '其他')
        tier = item.get('tier', '')
        
        # 尝试拉评论
        comments = []
        if 'xiaohongshu' in url.lower() or 'xhslink' in url.lower():
            comments = fetch_xhs_comments(item)
        elif 'douyin.com' in url.lower():
            comments = fetch_douyin_comments(item)
        
        for c in comments:
            content = c.get('text', '').strip()
            if len(content) < 5 or len(content) > 200:
                continue
            like = int(c.get('likes', 0) or 0)
            all_comments.append({
                'text': content[:100],
                'likes': like,
                'source': title,
                'category': cat,
            })
            comment_to_pick.append({
                'text': content[:200],
                'source': title,
                'likes': like,
                'category': cat,
            })
            for kw in ['推荐', '怎么选', '值得买', '后悔', '坑', '贵', '便宜', '噪音',
                       '安装', '售后', '质量', '对比', '哪个好', '区别', '清洗', '维修',
                       '费电', '省电', '安全', '甲醛', '除菌', '滤芯', '效果', '预算',
                       '高层', '平层', '开放厨房', '小户型', '出租屋']:
                if kw in content:
                    all_keywords.append(kw)
        
        if len(comments) == 0 and item.get('douyin_comments'):
            # 没有原始评论但有数据，用标题模拟场景痛点
            pass
    
    insights['total_mined'] = len(all_comments)
    
    # 高频问题
    questions = [c for c in all_comments if any(m in c['text'] for m in ['?', '？', '吗', '怎么', '哪', '几', '多少'])]
    questions.sort(key=lambda x: -x['likes'])
    insights['top_questions'] = [
        {'question': q['text'][:100], 'likes': q['likes'], 'source': q['source'], 'category': q.get('category','')}
        for q in questions[:10]
    ]
    
    # 吐槽
    complaints = [c for c in all_comments if any(w in c['text'] for w in ['后悔', '坑', '垃圾', '太贵', '不好', '难', '吵', '噪音', '费电', '坏', '翻车', '退货'])]
    complaints.sort(key=lambda x: -x['likes'])
    insights['top_complaints'] = [
        {'complaint': c['text'][:100], 'likes': c['likes'], 'source': c['source'], 'category': c.get('category','')}
        for c in complaints[:8]
    ]
    
    # 关键词
    kw_counter = Counter(all_keywords)
    insights['hot_keywords'] = [
        {'keyword': kw, 'count': cnt}
        for kw, cnt in kw_counter.most_common(15)
    ]
    
    # 按品类分
    for c in all_comments:
        cat = c.get('category', '其他')
        insights['by_category'][cat].append(c)
    insights['by_category'] = dict(insights['by_category'])
    
    # ⭐ 评论转选题（核心新增）
    print("💬→🎬 LLM 转换评论为选题...")
    transformed = transform_comments_to_picks(comment_to_pick[:15])
    insights['transformed_picks'] = transformed
    print(f"  ✅ 转出 {len(transformed)} 条选题")
    
    return insights

def fetch_xhs_comments(item):
    """拉小红书评论"""
    url = item.get('url', '')
    try:
        # 提取 note_id
        m = re.search(r'/explore/(\w+)', url) or re.search(r'/discovery/item/(\w+)', url)
        if not m:
            return []
        note_id = m.group(1)
        # 搜索获取 token
        result = subprocess.run(
            ['xhs', 'search', item.get('title','')[:20], '--json'],
            capture_output=True, text=True, timeout=8
        )
        if result.returncode != 0:
            return []
        data = json.loads(result.stdout)
        token = None
        for si in data.get('data', {}).get('items', []):
            if si.get('id') == note_id:
                token = si.get('xsec_token')
                break
        if not token:
            return []
        time.sleep(1)
        target_url = f'https://www.xiaohongshu.com/explore/{note_id}?xsec_token={token}&xsec_source=pc_search'
        result = subprocess.run(
            ['xhs', 'comments', target_url, '--json'],
            capture_output=True, text=True, timeout=8
        )
        if result.returncode != 0:
            return []
        data = json.loads(result.stdout)
        if not data.get('ok'):
            return []
        comments = []
        for c in data.get('data', {}).get('comments', []):
            content = c.get('content', '').strip()
            if not content:
                continue
            comments.append({
                'text': content,
                'likes': int(c.get('like_count', 0) or 0),
            })
        return comments
    except subprocess.TimeoutExpired:
        return []
    except Exception as e:
        return []

def fetch_douyin_comments(item):
    """抖音评论：没有 API 的话从已有数据中拿"""
    # 当前抖音评论没拉取接口，只能看 item.douyin_comments 数量
    # 但用户没给原始评论文本，所以这条不返回
    return []

def transform_comments_to_picks(comments):
    """LLM 把评论转成选题"""
    if not comments:
        return []
    
    SYSTEM = """你是"七哥家电说"短视频编导。给你一批小红书/抖音爆款的真实用户评论，请从中提炼出可拍的短视频选题。

要求：
- 优先选场景具体、痛点清晰、用户真问过的问题
- 跳过单纯夸奖/情绪化评论
- 跳过没有信息量的"666"、"好棒"
- 每条输出包含 8 个字段（严格 JSON）：
{
  "transformed": [
    {
      "user_quote": "用户原话（保留原汁原味）",
      "pain": "用户真实痛点（一句话）",
      "conflict": "可拍冲突（用户以为X，实际Y）",
      "video_title": "可拍视频标题（场景+参数+冲突）",
      "opening_3s": "3秒开头",
      "shooting_plan": ["画面建议1", "画面建议2", "画面建议3"],
      "comment_hook": "评论区引导语",
      "risk_warning": "风险提醒"
    }
  ]
}

只输出 JSON，不要任何解释。"""
    
    comment_text = ""
    for i, c in enumerate(comments):
        comment_text += f"[{i+1}] (👍{c['likes']} | {c['category']} | 来自:{c['source'][:30]})\n{c['text']}\n\n"
    
    prompt = f"今日家电爆款评论（{len(comments)} 条）：\n\n{comment_text}\n\n请从中挑出 5 条最有视频价值的，按 JSON 输出 transformed 数组。"
    
    raw = call_llm(prompt, SYSTEM, max_tokens=6000, temperature=0.8)
    parsed = parse_json_safe(raw)
    if parsed and 'transformed' in parsed:
        return parsed['transformed'][:8]
    return []

print("💬 挖掘评论区...")
comment_insights = mine_comments(items, top_picks)
print(f"  采集 {comment_insights['total_mined']} 条评论 | 转选题 {len(comment_insights['transformed_picks'])} 条")

# ════════════════════════════════════════════════════════════
# 8. 今日用户痛点 TOP5（多来源合并：评论转化 + TOP3痛点 + 原始评论）
# ════════════════════════════════════════════════════════════
top_pain_points = []
seen_pain = set()

# 源 1: 评论转化结果
for pick in comment_insights.get('transformed_picks', []):
    pain = pick.get('pain', '').strip()
    if pain and pain not in seen_pain:
        seen_pain.add(pain)
        top_pain_points.append({
            'source': '评论转化',
            'user_quote': pick.get('user_quote', '')[:120],
            'pain': pain,
            'category': pick.get('category', '其他'),
            'transformable_title': pick.get('video_title', ''),
            'suitable': '短视频',
        })
        if len(top_pain_points) >= 5:
            break

# 源 2: TOP3 里的 user_pain（当评论不够时从 TOP3 抽）
if len(top_pain_points) < 5:
    for p in top_picks:
        if len(top_pain_points) >= 5:
            break
        pain = p.get('user_pain', '').strip()
        if pain and pain not in seen_pain:
            seen_pain.add(pain)
            top_pain_points.append({
                'source': 'TOP3',
                'user_quote': (p.get('openings_3s', [''])[0] or '')[:80],
                'pain': pain,
                'category': p.get('category', '其他'),
                'transformable_title': p.get('video_title', ''),
                'suitable': '短视频',
            })

# 源 3: 原始评论问题
if len(top_pain_points) < 5:
    for c in comment_insights.get('top_questions', []):
        if len(top_pain_points) >= 5:
            break
        q = c['question']
        if q not in seen_pain:
            seen_pain.add(q)
            top_pain_points.append({
                'source': '评论区',
                'user_quote': c['question'][:120],
                'pain': '用户真实选购疑问',
                'category': c.get('category', '其他'),
                'transformable_title': c['question'][:30],
                'suitable': '短视频/图文',
            })

# ════════════════════════════════════════════════════════════
# 9. 标题公式库（带使用频次）
# ════════════════════════════════════════════════════════════
title_formulas = []
for f in TITLE_FORMULA_PATTERNS:
    name = f['name']
    used_14d = formula_usage_14d.get(name, 0)
    usage_text, fatigue = formula_fatigue(name, used_14d)
    
    # 该公式近 14 天的爆款案例
    examples = formula_examples_14d.get(name, [])
    total_eng = sum(e['eng'] for e in examples)
    
    # 用该公式可以怎么套到当前 TOP3
    apply_demo = []
    for pick in top_picks:
        orig = pick.get('video_title', '')
        cat = pick.get('category', '家电')
        if '参数' in name:
            apply_demo.append(f"{cat}千万别只看参数，{pick.get('user_pain','真实痛点')[:15]}")
        elif '避坑' in name:
            apply_demo.append(f"{cat}选购避坑：{pick.get('user_pain','真实痛点')[:15]}")
        elif '场景' in name:
            apply_demo.append(f"具体场景+{cat}怎么选不踩坑")
        elif 'N点' in name:
            apply_demo.append(f"{cat}选购记住这5点，导购都夸你内行")
        elif '实测' in name:
            apply_demo.append(f"实测{cat}半年，说说真实体验")
        else:
            apply_demo.append(f"{cat}选购{orig[:10]}")
    
    title_formulas.append({
        'name': name,
        'power': f['power'],
        'desc': f['desc'],
        'viral_count_14d': used_14d,
        'fatigue': fatigue,
        'usage_text': usage_text,
        'examples': examples,
        'apply_demo': apply_demo[:3],
    })

# 排序：低疲劳 + 高 power 排前面
title_formulas.sort(key=lambda x: (
    {'低': 0, '中': 1, '高': 2}.get(x['fatigue'], 1),
    {'高': 0, '中': 1, '低': 2}.get(x['power'], 1),
    -x['viral_count_14d']
))

# ════════════════════════════════════════════════════════════
# 10. 时机雷达（带具体字段）
# ════════════════════════════════════════════════════════════
def get_timing_alerts():
    now = datetime.now()
    alerts = []
    timing_db = [
        {
            'range': ((6, 1), (6, 20)),
            'event': '618 大促',
            'category': '全品类',
            'direction': '618返场/抄底/降价对比',
            'why_now': '618 是上半年最大促销节点，用户购买决策集中爆发',
            'best_window': '未来 5-10 天',
            'expire_risk': '低（618 刚结束，余热还在）',
            'angles': ['618 价格对比', '618 销量榜', '618 翻车盘点', '618 隐藏券'],
            'urgency': 'high',
        },
        {
            'range': ((6, 15), (7, 31)),
            'event': '三伏天 + 高温期',
            'category': '空调/除湿机/电风扇/冰箱',
            'direction': '夏季选购/省电/除湿/外机衰减',
            'why_now': '持续高温，用户对空调/冰箱/除湿机的需求达到年度峰值',
            'best_window': '未来 7-30 天（整个盛夏）',
            'expire_risk': '低（窗口长）',
            'angles': [
                '空调外机高温衰减实测',
                '除湿机 vs 空调除湿模式',
                '冰箱高温保鲜能力',
                '风扇和空调搭配省电',
                '空调清洗能省多少电',
                '高温下空调外机位置选择',
            ],
            'urgency': 'high',
        },
        {
            'range': ((7, 15), (8, 31)),
            'event': '暑假 + 七夕',
            'category': '电视/投影仪/小家电',
            'direction': '影音娱乐/送礼/学生宿舍',
            'why_now': '学生暑假 + 七夕送礼节点，客厅娱乐设备需求上涨',
            'best_window': '未来 15-30 天',
            'expire_risk': '中（8月底回落）',
            'angles': ['投影仪 vs 电视', '七夕礼物推荐', '学生宿舍小家电'],
            'urgency': 'medium',
        },
        {
            'range': ((8, 1), (9, 15)),
            'event': '开学季',
            'category': '小家电/电饭煲/洗衣机',
            'direction': '学生宿舍家电推荐',
            'why_now': '开学前 2 周是学生宿舍采购高峰',
            'best_window': '8月中-9月初',
            'expire_risk': '高（窗口短）',
            'angles': ['宿舍神器', '100元以下小家电', '电费友好型电器'],
            'urgency': 'medium',
        },
    ]
    
    for entry in timing_db:
        (sm, sd), (em, ed) = entry['range']
        start = datetime(now.year, sm, sd)
        end = datetime(now.year, em, ed)
        if start <= now <= end:
            days_left = (end - now).days
            entry = dict(entry)
            entry['days_left'] = days_left
            entry['status'] = '进行中' if days_left > 7 else '⏰ 窗口期即将关闭'
            alerts.append(entry)
    
    if not alerts:
        alerts.append({
            'event': '日常选题期',
            'category': '全品类',
            'direction': '关注近期爆款',
            'why_now': '当前无大型节点事件，按日常爆款跟进',
            'best_window': '持续',
            'expire_risk': '无',
            'angles': ['日常爆款跟进', '评论区金矿转化'],
            'days_left': 0,
            'status': '常规期',
            'urgency': 'low',
        })
    return alerts

timing_alerts = get_timing_alerts()

# ════════════════════════════════════════════════════════════
# 11. 品类热度 + 解释为什么没进TOP3
# ════════════════════════════════════════════════════════════
cat_data = defaultdict(lambda: {'count': 0, 'scores': [], 'interactions': [], 'today_count': 0, 'in_top3': False})
for item in all_items:
    cat = item.get('category', '未知')
    cat_data[cat]['count'] += 1
    cat_data[cat]['scores'].append(item.get('score', 0.0))
    cat_data[cat]['interactions'].append(item.get('douyin_interactions', 0) or item.get('toutiao_engagement', 0) or 0)
    if item.get('_date') == TODAY:
        cat_data[cat]['today_count'] += 1

# 标记哪些品类进了 TOP3
top3_cats = {p.get('category', '') for p in top_picks}
for cat in cat_data:
    cat_data[cat]['in_top3'] = cat in top3_cats

# 解释"为什么没进TOP3"
def explain_why_not_in_top3(cat, today_n, total_inter):
    if today_n == 0:
        return f"今日无 {cat} 素材入库", 'low'
    if total_inter < 5000:
        return f"历史互动量偏低（{total_inter}），缺乏爆款支撑", 'low'
    # 检查是否缺新冲突
    return f"素材偏老或场景不够新冲突，建议改为图文备选", 'medium'

category_trend = []
for cat, d in sorted(cat_data.items(), key=lambda x: -sum(x[1]['interactions'])):
    total_inter = sum(d['interactions'])
    avg_score = round(sum(d['scores']) / max(len(d['scores']), 1), 1)
    today = d['today_count']
    in_top3 = d['in_top3']
    
    if in_top3:
        reason = f"✅ 今日进入 TOP3，{today} 条素材命中"
        status = 'in_top3'
    else:
        reason, status = explain_why_not_in_top3(cat, today, total_inter)
    
    category_trend.append({
        'category': cat,
        'total_items': d['count'],
        'today_items': today,
        'total_interactions': total_inter,
        'avg_score': avg_score,
        'in_top3': in_top3,
        'reason': reason,
        'status': status,
    })

# ════════════════════════════════════════════════════════════
# 12. 素材库（加可复刻点 + LLM 增强）
# ════════════════════════════════════════════════════════════
def enrich_material_library(items, top_picks):
    """给每条素材加可复刻点、不能照搬的地方、可生成标题"""
    enriched = []
    
    # 找出每条 TOP3 的参考爆款
    ref_urls = {p.get('ref_url', '') for p in top_picks}
    
    for item in items:
        eng = item.get('douyin_interactions', 0) or item.get('toutiao_engagement', 0) or 0
        comments = item.get('douyin_comments', 0) or item.get('toutiao_comment_count', 0) or 0
        title = item.get('title', '')
        cat = item.get('category', '其他')
        angle = item.get('angle', '')
        platform = '抖音' if '抖音' in item.get('source', '') else \
                   '小红书' if '小红书' in item.get('source', '') else \
                   '头条' if '今日头条' in item.get('source', '') else '媒体'
        
        # 互动太低的不进素材库
        if eng < 100 and item.get('score', 0) < 7.5:
            continue
        
        is_ref = item.get('url', '') in ref_urls
        
        # 基础可复刻点
        repeatable = []
        if '避坑' in title or '不踩坑' in title:
            repeatable.append('避坑话题天然高点击')
        if '怎么选' in title or '选购' in title:
            repeatable.append('选购类收藏率高，长尾流量稳')
        if re.search(r'\d+', title):
            repeatable.append('带数字的标题点击率高')
        if comments > 100:
            repeatable.append(f'评论数{comments}，用户有强烈表达欲')
        if not repeatable:
            repeatable.append('可作为话题切入点')
        
        not_copy = []
        if len(title) > 35:
            not_copy.append('标题太长，需精简到 20 字内')
        if '千万别' in title and '别' in title and title.count('别') >= 2:
            not_copy.append('"别"字重复使用，疲劳感强')
        if not not_copy:
            not_copy.append('可直接复刻标题壳，替换品类/场景')
        
        # 七哥版本标题
        qige_title = transform_to_qige(title, cat, angle)
        
        enriched.append({
            'title': title,
            'url': item.get('url', ''),
            'source': item.get('source', ''),
            'category': cat,
            'angle': angle,
            'platform': platform,
            'engagement': eng,
            'comments': comments,
            'score': item.get('score', 0),
            'pub_date': item.get('douyin_pub_date', ''),
            'is_today_top3_ref': is_ref,
            'repeatable_points': repeatable,
            'not_copy_points': not_copy,
            'qige_title': qige_title,
            'controversy': '',  # 留作后续填
            'suitable_account': ['七哥家电说'] if cat in ['空调', '电视', '冰箱', '洗衣机', '热水器', '油烟机', '厨电'] else ['牛科技'],
        })
    
    # 按是否 TOP3 参考 + 互动量排序
    enriched.sort(key=lambda x: (not x['is_today_top3_ref'], -x['engagement']))
    return enriched

def transform_to_qige(title, cat, angle):
    """把爆款标题转成七哥版本（场景化、具体化）"""
    # 简单规则
    if '选购' in title or '怎么选' in title:
        return f"买{cat}之前先问自己3个问题"
    if '避坑' in title or '不踩坑' in title:
        return f"{cat}避坑：3 个参数比风量更关键"
    if '拆' in title:
        return f"拆了一台{cat}，发现商家没说的事"
    if '后悔' in title:
        return f"买{cat}后悔的人，都在这3件事上踩了坑"
    if '智商税' in title:
        return f"{cat}到底是不是智商税？3个月实测告诉你"
    return f"{cat}选购：先别看参数，先看这3个"

print("📚 增强素材库...")
enriched_materials = enrich_material_library(items, top_picks)
print(f"  ✅ 增强 {len(enriched_materials)} 条素材")

# ════════════════════════════════════════════════════════════
# 13. 输出 data.js
# ════════════════════════════════════════════════════════════
now_time = datetime.now().strftime("%H:%M")
data = {
    "version": "5.0",
    "date": TODAY,
    "generated_at": now_time,
    "freshness_cutoff": "30天",
    "total_today": len(items),
    "total_materials": len(enriched_materials),
    
    # P0-1/2: TOP3 精细化
    "top_picks": top_picks,
    
    # P0-3: 用户痛点 TOP5
    "top_pain_points": top_pain_points,
    
    # P0-3: 评论转选题
    "comment_insights": comment_insights,
    
    # 标题公式库（含追踪）
    "title_formulas": title_formulas,
    
    # 标题壳疲劳监控
    "formula_usage_14d": dict(formula_usage_14d),
    
    # 时机雷达
    "timing_alerts": timing_alerts,
    
    # 品类热度（含解释）
    "category_trend": category_trend,
    
    # 素材库
    "materials": enriched_materials,
    
    # 图文可转化选题（高 image_text_score 的 TOP3）
    "image_text_picks": [p for p in top_picks if p.get('image_text_score', 0) >= p.get('video_score', 0)],
    
    # 原始信源流水
    "items": items,
    "ideas": ideas,
}

out_path = os.path.expanduser("~/home-appliance-daily/data.js")
header = f"/* 家电选题日报 v5.0 · 编导作战台 · {TODAY} {now_time} */\n"
content = header + "const TODAY_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"

with open(out_path, 'w') as f:
    f.write(content)

print(f"\n✅ 已生成 {out_path}")
print(f"   文件: {os.path.getsize(out_path):,} bytes")
print(f"   TOP3选题 | 痛点{len(top_pain_points)}个 | 评论{comment_insights['total_mined']}条 → 转选题{len(comment_insights['transformed_picks'])}条")
print(f"   标题公式{len(title_formulas)}个 | 时机{len(timing_alerts)}个 | 品类{len(category_trend)}个 | 素材{len(enriched_materials)}条")
