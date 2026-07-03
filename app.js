/* ============================================================
   家电行业日报 v2 — 渲染逻辑 (SVG icons + a11y)
   依赖：data.js 提供全局 TODAY_DATA 与 ARCHIVES
   ============================================================ */

(function () {
  "use strict";

  // ---------- 配置 ----------
  const CATEGORY_FILTERS = [
    "全部", "空调", "冰箱", "洗衣机", "电视", "厨电",
    "热水器", "小家电", "清洁电器", "智能家居", "综合家电"
  ];
  const HIGH_SCORE_THRESHOLD = 8;
  const STAT_HIGH_SCORE_THRESHOLD = 7;

  // ---------- 状态 ----------
  let activeCategory = "全部";
  let searchKeyword = "";

  // ---------- SVG 图标库 ----------
  const ICONS = {
    flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
    comment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.5.4 1 1 1 2v.3h6v-.3c0-1 .5-1.6 1-2A7 7 0 0 0 12 2z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 17v5M9 10.76V5a3 3 0 0 1 6 0v5.76l3 2.24v3H6v-3l3-2.24z"/></svg>',
    signal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>',
    inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
    cross: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    sword: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/><line x1="18" y1="20" x2="20" y2="22"/></svg>',
    coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.5 9.5h5v5h-5z"/><path d="M12 7v10"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  };

  // ---------- 工具函数 ----------

  function catTagHTML(category) {
    return `<span class="cat-tag" style="--cat:var(--cat-${category});">${escapeHTML(category)}</span>`;
  }

  function matchFilters(item) {
    if (activeCategory !== "全部" && item.category !== activeCategory) return false;
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      const hay = [item.title || "", item.source || "", item.angle || "", item.category || ""]
        .join(" ").toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    return true;
  }

  /** 单张卡片 HTML (大/小卡都通用) */
  function cardHTML(item, large) {
    const isGold = item.score >= HIGH_SCORE_THRESHOLD;
    const tier = (item.tier || "").toUpperCase();
    const stars = scoreStars(item.score);

    const inter = item.douyin_interactions;
    const interHTML = inter
      ? `<span class="inter-badge" aria-label="${inter} 次互动">${ICONS.flame}${formatK(inter)}</span>`
      : "";
    const commentCount = item.douyin_comments;
    const commentHTML = commentCount
      ? `<span class="inter-badge comments" aria-label="${commentCount} 条评论">${ICONS.comment}${commentCount}</span>`
      : "";

    const pubDate = item.douyin_pub_date || item.pub_date;
    const pubDateHTML = pubDate
      ? `<span class="pub-date">${ICONS.calendar}${formatPubDate(pubDate)}</span>`
      : "";

    let ctrHTML = "";
    if (inter && commentCount && inter > 0) {
      const ctr = ((commentCount / inter) * 100).toFixed(1);
      const ctrClass = ctr >= 10 ? "danger" : ctr >= 5 ? "" : "";
      ctrHTML = `<span class="inter-badge ${ctrClass}">互动率 ${ctr}%</span>`;
    }

    const heatScore = item.heat_score;
    const heatHTML = heatScore !== undefined && heatScore > 0
      ? `<span class="inter-badge" aria-label="热度分 ${heatScore}">${ICONS.flame}${heatScore}</span>`
      : "";

    const angleHTML = item.angle
      ? `<div class="card-angle">${ICONS.bulb}<span>${escapeHTML(item.angle)}</span></div>`
      : "";

    const titleSuggestHTML = item.title_suggest
      ? `<div class="title-suggest">${ICONS.pin}<span>建议标题：${escapeHTML(item.title_suggest)}</span></div>`
      : "";

    const titleParts = cleanTitle(item.title);
    const tagsHTML = titleParts.tags.length
      ? `<div class="card-tags">${titleParts.tags.map(t => `<span class="tag-chip">#${escapeHTML(t)}</span>`).join("")}</div>`
      : "";

    return `
      <article class="card ${large ? "card-lg" : ""} ${isGold ? "gold" : ""}" role="article">
        <div class="card-head">
          ${catTagHTML(item.category)}
          ${tier ? `<span class="tier-tag" data-tier="${tier}">${tierLabel(tier)}</span>` : ""}
          <span class="score-badge ${isGold ? "gold" : ""}">
            <span>${item.score.toFixed(1)}</span>
            <span class="score-stars" aria-hidden="true">${stars}</span>
          </span>
        </div>
        <h3 class="card-title">
          ${item.url
            ? `<a href="${escapeAttr(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(titleParts.clean || item.title)}</a>`
            : escapeHTML(titleParts.clean || item.title)}
        </h3>
        <div class="card-meta">
          <span class="meta-source">${ICONS.signal}${escapeHTML(item.source || "未知来源")}</span>
          ${pubDateHTML}
          ${interHTML}
          ${commentHTML}
          ${ctrHTML}
          ${heatHTML}
        </div>
        ${tagsHTML}
        ${angleHTML}
        ${titleSuggestHTML}
      </article>`;
  }

  function formatPubDate(dateStr) {
    if (!dateStr) return "";
    const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return dateStr;
    const d = new Date(`${m[1]}-${m[2]}-${m[3]}`);
    const today = new Date();
    const diff = Math.floor((today - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "今天";
    if (diff === 1) return "昨天";
    if (diff < 7) return `${diff}天前`;
    if (diff < 30) return `${Math.floor(diff / 7)}周前`;
    return `${Math.floor(diff / 30)}月前`;
  }

  function cleanTitle(title) {
    if (!title) return { clean: "", tags: [] };
    const tags = [];
    const cleaned = title.replace(/#([^#\s]+)/g, (m, tag) => {
      const t = tag.replace(/[\s#]+/g, "").trim();
      if (t && t.length > 1 && !/^[0-9]+$/.test(t) && t.length < 20) {
        tags.push(t);
      }
      return "";
    }).replace(/\s+/g, " ").trim();
    const seen = new Set();
    const uniqTags = tags.filter(t => {
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    });
    return { clean: cleaned, tags: uniqTags.slice(0, 6) };
  }

  function tierLabel(tier) {
    const map = { "H1": "品牌", "H2": "媒体", "H3": "抖音", "H4": "头条" };
    return map[tier] || tier;
  }

  function formatK(n) {
    if (n >= 10000) return (n / 10000).toFixed(1) + "w";
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return n;
  }

  // ---------- 渲染：选题灵感 ----------
  function renderIdeas() {
    const box = document.getElementById("ideasContainer");
    const section = document.getElementById("ideasSection");
    const ideas = (typeof TOPIC_IDEAS !== "undefined" && TOPIC_IDEAS) || null;

    if (!ideas || ideas.length === 0) {
      section.style.display = "none";
      return;
    }

    const cards = ideas.map((idea, i) => {
      const titleA = idea.title_a || idea.title || "";
      const titleB = idea.title_b || "";
      const cat = idea.category || "综合";
      const angle = idea.angle || "";
      const reason = idea.reason || "";
      const diff = idea.diff || "";
      const toutiaoTip = idea.toutiao_tip || "";
      const refs = idea.refs || [];
      const difficulty = idea.difficulty || "medium";

      const refsHTML = refs.length
        ? `<div class="idea-refs">${ICONS.link}<span>参考素材：第 ${refs.join("、")} 条</span></div>`
        : "";

      const titleBHTML = titleB
        ? `<div class="idea-title-b">${ICONS.doc}<span>${escapeHTML(titleB)}</span></div>`
        : "";

      const diffHTML = diff
        ? `<div class="idea-diff">${ICONS.bulb}<span>${escapeHTML(diff)}</span></div>`
        : "";

      const toutiaoHTML = toutiaoTip
        ? `<div class="idea-toutiao">${ICONS.phone}<span>${escapeHTML(toutiaoTip)}</span></div>`
        : "";

      return `
        <article class="idea-card" role="article" style="--cat:var(--cat-${cat});">
          <div class="idea-head">
            <span class="icon-spark">${ICONS.spark}</span>
            <span>灵感 ${String(i + 1).padStart(2, "0")}</span>
            <span class="cat-tag">${escapeHTML(cat)}</span>
            <span class="diff ${difficulty}">${difficultyLabel(difficulty)}</span>
          </div>
          <h3 class="idea-title">${escapeHTML(titleA)}</h3>
          ${titleBHTML}
          <div class="idea-meta">
            ${angle ? `<div><span class="label">写法</span><span>${escapeHTML(angle)}</span></div>` : ""}
            ${reason ? `<div><span class="label">为什么能火</span><span>${escapeHTML(reason)}</span></div>` : ""}
            ${diffHTML ? `<div><span class="label">差异化</span><span>${escapeHTML(diff)}</span></div>` : ""}
            ${toutiaoHTML ? `<div><span class="label">头条适配</span><span>${escapeHTML(toutiaoTip)}</span></div>` : ""}
          </div>
          ${refsHTML}
        </article>`;
    }).join("");

    box.innerHTML = cards;
  }

  function difficultyLabel(d) {
    const m = { low: "简单", medium: "中等", high: "深度" };
    return m[d] || d || "中等";
  }

  // ---------- 渲染：用户评论洞察 ----------
  function renderInsight() {
    const box = document.getElementById("insightContainer");
    const section = document.getElementById("insightSection");
    const insights = (typeof COMMENT_INSIGHTS !== "undefined" && COMMENT_INSIGHTS) || null;

    if (!insights || !insights.by_category || Object.keys(insights.by_category).length === 0) {
      section.style.display = "none";
      return;
    }

    const generated = insights.generated_at
      ? `<div class="insight-meta">${ICONS.calendar}<span>洞察生成：${formatDate(insights.generated_at)} · ${insights.total_videos_analyzed || 0} 条高互动视频</span></div>`
      : "";

    const cards = Object.entries(insights.by_category).map(([cat, data]) => {
      const questions = (data["高频问题"] || []).map(q => `<li>${escapeHTML(q)}</li>`).join("");
      const debates = (data["争议话题"] || []).map(q => `<li>${escapeHTML(q)}</li>`).join("");
      const buzz = (data["口碑参考"] || []).map(q => `<li>${escapeHTML(q)}</li>`).join("");
      const pricing = (data["价格敏感点"] || []).map(q => `<li>${escapeHTML(q)}</li>`).join("");

      return `
        <article class="insight-card" style="--cat:var(--cat-${cat});">
          <div class="insight-head">
            <span class="cat-tag">${escapeHTML(cat)}</span>
            <span class="insight-stat">${data.评论样本 || 0} 条评论样本</span>
          </div>
          <div class="insight-body">
            ${questions ? `<div class="insight-row">
              <div class="insight-label">${ICONS.flame}<span>高频问题</span></div>
              <ul class="insight-list">${questions}</ul>
            </div>` : ""}
            ${debates ? `<div class="insight-row">
              <div class="insight-label">${ICONS.sword}<span>争议话题</span></div>
              <ul class="insight-list">${debates}</ul>
            </div>` : ""}
            ${buzz ? `<div class="insight-row">
              <div class="insight-label">${ICONS.comment}<span>口碑参考</span></div>
              <ul class="insight-list">${buzz}</ul>
            </div>` : ""}
            ${pricing ? `<div class="insight-row">
              <div class="insight-label">${ICONS.coin}<span>价格敏感点</span></div>
              <ul class="insight-list">${pricing}</ul>
            </div>` : ""}
          </div>
          ${data.选题建议 ? `<div class="insight-tip">${ICONS.bulb}<span>选题建议：${escapeHTML(data.选题建议)}</span></div>` : ""}
        </article>`;
    }).join("");

    box.innerHTML = generated + cards;
  }

  // ---------- 渲染：统计卡片 ----------
  function renderStats() {
    const items = TODAY_DATA.items || [];
    const highCount = items.filter(i => i.score >= STAT_HIGH_SCORE_THRESHOLD).length;
    const categories = new Set(items.map(i => i.category));
    const sources = new Set(items.map(i => i.source));

    setText("statTotal", items.length);
    setText("statHighScore", highCount);
    setText("statCategory", categories.size);
    setText("statSource", sources.size);
    setText("todayDate", formatDate(TODAY_DATA.date));
  }

  // ---------- 渲染：筛选标签 ----------
  function renderFilterTags() {
    const wrap = document.getElementById("filterTags");
    wrap.innerHTML = CATEGORY_FILTERS.map(cat => {
      const active = cat === activeCategory ? "active" : "";
      const style = cat !== "全部" ? `style="--cat:var(--cat-${cat});"` : "";
      return `<button class="filter-tag ${active}" data-cat="${cat}" ${style} role="tab" aria-selected="${cat === activeCategory}">${cat}</button>`;
    }).join("");

    wrap.querySelectorAll(".filter-tag").forEach(el => {
      el.addEventListener("click", () => {
        activeCategory = el.getAttribute("data-cat");
        renderFilterTags();
        renderRecommendations();
        renderAllNews();
      });
    });
  }

  // ---------- 渲染：选题推荐区 ----------
  function renderRecommendations() {
    const grid = document.getElementById("recommendGrid");
    const section = document.getElementById("recommendSection");

    const recs = (TODAY_DATA.items || [])
      .filter(i => i.score >= HIGH_SCORE_THRESHOLD)
      .filter(matchFilters)
      .sort((a, b) => b.score - a.score);

    if (activeCategory !== "全部" || searchKeyword) {
      section.style.display = recs.length ? "" : "none";
    } else {
      section.style.display = "";
    }

    grid.innerHTML = recs.length
      ? recs.map(i => cardHTML(i, true)).join("")
      : `<div class="empty-state">${ICONS.cross}<span>当前筛选下暂无 ≥8 分的高价值选题</span></div>`;
  }

  // ---------- 渲染：全部信息区 ----------
  function renderAllNews() {
    const grid = document.getElementById("newsGrid");
    const empty = document.getElementById("emptyState");

    const list = (TODAY_DATA.items || [])
      .filter(matchFilters)
      .sort((a, b) => b.score - a.score);

    if (!list.length) {
      grid.innerHTML = "";
      empty.style.display = "";
      return;
    }
    empty.style.display = "none";
    grid.innerHTML = list.map(i => cardHTML(i, false)).join("");
  }

  // ---------- 渲染：历史归档 ----------
  function renderArchive() {
    const box = document.getElementById("archiveContainer");

    if (!ARCHIVES || ARCHIVES.length === 0) {
      box.innerHTML = `<div class="empty-state">${ICONS.inbox}<span>暂无历史归档数据，每日数据将自动归档到此处</span></div>`;
      return;
    }

    box.innerHTML = ARCHIVES.map(day => {
      const count = (day.items || []).length;
      return `
        <a class="archive-item" href="#archive-${day.date}" data-date="${day.date}">
          <span class="date">${ICONS.calendar}<span>${formatShortDate(day.date)}</span></span>
          <span class="count">${count} 条</span>
        </a>`;
    }).join("");
  }

  // ---------- 搜索绑定 ----------
  function bindSearch() {
    const input = document.getElementById("searchInput");
    let timer = null;
    input.addEventListener("input", e => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        searchKeyword = e.target.value.trim();
        renderRecommendations();
        renderAllNews();
      }, 160);
    });
  }

  // ---------- 工具 ----------
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
  function formatDate(str) {
    if (!str) return "—";
    const m = String(str).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${m[1]}年${m[2]}月${m[3]}日`;
    return str;
  }
  function formatShortDate(str) {
    if (!str) return "—";
    const m = String(str).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${m[2]}-${m[3]}`;
    return str;
  }
  function escapeHTML(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function escapeAttr(s) { return escapeHTML(s); }
  function scoreStars(score) {
    const full = Math.floor(score);
    const half = score - full >= 0.5 ? 1 : 0;
    const empty = Math.max(0, 5 - full - half);
    return "★".repeat(full) + (half ? "⯨" : "") + "☆".repeat(empty);
  }

  // ---------- 初始化 ----------
  function init() {
    if (typeof TODAY_DATA === "undefined") {
      console.error("TODAY_DATA is missing");
      return;
    }
    renderStats();
    renderFilterTags();
    renderIdeas();
    renderInsight();
    renderRecommendations();
    renderAllNews();
    renderArchive();
    bindSearch();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
