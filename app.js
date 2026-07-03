/* ============================================================
   家电行业日报 — 渲染逻辑 v3
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

  // ---------- SVG icon 库（无 emoji 依赖，跨平台一致） ----------
  const ICON = {
    zap:    '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
    flame:  '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5 .5 2.5-2 4.05-2 4.05C12 6 11 3 8 3a8 8 0 0 0 0 8c.5 2 1 3 1 3"/></svg>',
    star:   '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" stroke="currentColor" stroke-width="0.5" stroke-linejoin="round"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    sparkle:'<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>',
    bulb:   '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.5.4 1 1 1.3 1.6l.7 1.7h4l.7-1.7c.3-.6.8-1.2 1.3-1.6A7 7 0 0 0 12 2z"/></svg>',
    pin:    '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8M9 2h6l-1 8h-4l-1-8zM7 14h10v3l-2 1v4H9v-4l-2-1v-3z"/></svg>',
    phone:  '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>',
    paper:  '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>',
    chat:   '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    antenna:'<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>',
    cal:    '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    target: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    fire:   '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5 .5 2.5-2 4.05-2 4.05C12 6 11 3 8 3a8 8 0 0 0 0 8c.5 2 1 3 1 3"/></svg>',
    light:  '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5C18 9.5 19 8 19 6a7 7 0 0 0-14 0c0 2 1 3.5 2.5 5.5 .8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/></svg>',
    sword:  '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/></svg>',
    coin:   '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.37 18.09M7 6h1v4M16.71 13.88l.7.71-2.82 2.82"/></svg>',
    link:   '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    box:    '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg>',
    inbox:  '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
  };

  // ---------- 工具函数 ----------
  function catTagHTML(category) {
    return `<span class="cat-tag" style="--cat:var(--cat-${category});">${escapeHTML(category)}</span>`;
  }

  function scoreStars(score) {
    const full = Math.floor(score);
    const half = score - full >= 0.5 ? 1 : 0;
    const empty = Math.max(0, 5 - full - half);
    return ICON.star.repeat(full) + (half ? ICON.star : "") + ICON.star.repeat(empty);
    // Note: 全部用实心星，下方通过颜色区分
  }

  function matchFilters(item) {
    if (activeCategory !== "全部" && item.category !== activeCategory) return false;
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      const hay = [
        item.title || "", item.source || "", item.angle || "", item.category || ""
      ].join(" ").toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    return true;
  }

  function cardHTML(item, large) {
    const isGold = item.score >= HIGH_SCORE_THRESHOLD;
    const tier = (item.tier || "").toUpperCase();
    const starsHTML = scoreStars(item.score);

    const inter = item.douyin_interactions;
    const interHTML = inter
      ? `<span class="inter-badge">${ICON.flame}${formatK(inter)}</span>`
      : "";
    const commentCount = item.douyin_comments;
    const commentHTML = commentCount
      ? `<span class="inter-badge comments">${ICON.chat}${commentCount}</span>`
      : "";

    const pubDate = item.douyin_pub_date || item.pub_date;
    const pubDateHTML = pubDate
      ? `<span class="pub-date">${ICON.cal}${formatPubDate(pubDate)}</span>`
      : "";

    let ctrHTML = "";
    if (inter && commentCount && inter > 0) {
      const ctr = ((commentCount / inter) * 100).toFixed(1);
      const ctrClass = ctr >= 10 ? "ctr-high" : ctr >= 5 ? "ctr-mid" : "";
      ctrHTML = `<span class="ctr-badge ${ctrClass}">互动率 ${ctr}%</span>`;
    }

    const heatScore = item.heat_score;
    const heatHTML = heatScore !== undefined && heatScore > 0
      ? `<span class="heat-badge" title="内容热度分">${ICON.fire}${heatScore}</span>`
      : "";

    const angleHTML = item.angle
      ? `<div class="angle">${ICON.bulb}<span>${escapeHTML(item.angle)}</span></div>`
      : "";

    const titleSuggestHTML = item.title_suggest
      ? `<div class="title-suggest">${ICON.pin}<span>建议标题：${escapeHTML(item.title_suggest)}</span></div>`
      : "";

    const titleParts = cleanTitle(item.title);
    const tagsHTML = titleParts.tags.length
      ? `<div class="card-tags">${titleParts.tags.map(t => `<span class="tag-chip">#${escapeHTML(t)}</span>`).join("")}</div>`
      : "";

    return `
      <div class="card ${large ? "card-lg" : ""} ${isGold ? "gold" : ""}">
        <h3 class="card-title">
          ${item.url
            ? `<a href="${escapeAttr(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(titleParts.clean || item.title)} ${ICON.link}</a>`
            : escapeHTML(titleParts.clean || item.title)}
        </h3>
        <div class="card-meta">
          ${catTagHTML(item.category)}
          ${tier ? `<span class="tier-badge tier-${tier}">${tierLabel(tier)}</span>` : ""}
          <span class="source-tag">${ICON.antenna}${escapeHTML(item.source || "未知来源")}</span>
          ${pubDateHTML}
          ${interHTML}
          ${commentHTML}
          ${ctrHTML}
          ${heatHTML}
          <span class="score">
            <span class="score-num">${item.score.toFixed(1)}</span>
          </span>
        </div>
        ${tagsHTML}
        ${angleHTML}
        ${titleSuggestHTML}
      </div>`;
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
    const map = {"H1": "品牌", "H2": "媒体", "H3": "抖音", "H4": "头条"};
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

    const diffLabel = (d) => {
      const m = { low: "简单", medium: "中等", high: "深度" };
      const c = { low: "#16a34a", medium: "#ca8a04", high: "#dc2626" };
      const v = m[d] || d || "中等";
      const color = c[d] || "#ca8a04";
      return `<span class="diff-badge" style="--c:${color}">${ICON.cal}${v}</span>`;
    };

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
        ? `<div class="idea-refs">${ICON.paper}<span>参考素材：第 ${refs.join("、")} 条</span></div>`
        : "";

      const titleBHTML = titleB
        ? `<div class="idea-title-b">${ICON.paper}<span>B 方案：${escapeHTML(titleB)}</span></div>`
        : "";

      const diffHTML = diff
        ? `<div class="idea-diff">${ICON.sparkle}<span class="idea-label">差异化</span><span>${escapeHTML(diff)}</span></div>`
        : "";

      const toutiaoHTML = toutiaoTip
        ? `<div class="idea-toutiao">${ICON.phone}<span class="idea-label">头条适配</span><span>${escapeHTML(toutiaoTip)}</span></div>`
        : "";

      return `
        <div class="idea-card" style="--cat:var(--cat-${cat});">
          <div class="idea-header">
            <span class="idea-num">${String(i + 1).padStart(2, "0")}</span>
            <span class="cat-tag" style="--cat:var(--cat-${cat});">${escapeHTML(cat)}</span>
            ${diffLabel(difficulty)}
          </div>
          <h3 class="idea-title">${escapeHTML(titleA)}</h3>
          ${titleBHTML}
          ${angle ? `<div class="idea-angle">${ICON.paper}<span class="idea-label">写法</span><span>${escapeHTML(angle)}</span></div>` : ""}
          ${reason ? `<div class="idea-reason">${ICON.fire}<span class="idea-label">为什么能火</span><span>${escapeHTML(reason)}</span></div>` : ""}
          ${diffHTML}
          ${toutiaoHTML}
          ${refsHTML}
        </div>`;
    }).join("");

    box.innerHTML = cards;
  }

  // ---------- 渲染：评论洞察 ----------
  function renderInsight() {
    const box = document.getElementById("insightContainer");
    const section = document.getElementById("insightSection");
    const insights = (typeof COMMENT_INSIGHTS !== "undefined" && COMMENT_INSIGHTS) || null;

    if (!insights || !insights.by_category || Object.keys(insights.by_category).length === 0) {
      section.style.display = "none";
      return;
    }

    const generated = insights.generated_at
      ? `<div class="insight-meta" style="font-size:12px;color:var(--ink-4);margin-bottom:16px;">${ICON.cal}<span>洞察生成时间：${formatDate(insights.generated_at)} · 来源：${insights.total_videos_analyzed || 0} 条高互动视频评论</span></div>`
      : "";

    const cards = Object.entries(insights.by_category).map(([cat, data]) => {
      const questions = (data.高频问题 || []).map(q =>
        `<li>${escapeHTML(q)}</li>`).join("");
      const debates = (data.争议话题 || []).map(q =>
        `<li>${escapeHTML(q)}</li>`).join("");
      const buzz = (data.口碑参考 || []).map(q =>
        `<li>${escapeHTML(q)}</li>`).join("");
      const pricing = (data.价格敏感点 || []).map(q =>
        `<li>${escapeHTML(q)}</li>`).join("");

      return `
        <div class="insight-card" style="--cat:var(--cat-${cat});">
          <div class="insight-card-header">
            <span class="insight-cat">${escapeHTML(cat)}</span>
            <span class="insight-stat">${data.评论样本 || 0} 样本</span>
          </div>
          <div class="insight-body">
            ${questions ? `
              <div class="insight-row">
                <div class="insight-label">${ICON.flame} 高频问题</div>
                <ul class="insight-list">${questions}</ul>
              </div>` : ""}
            ${debates ? `
              <div class="insight-row">
                <div class="insight-label">${ICON.sword} 争议话题</div>
                <ul class="insight-list">${debates}</ul>
              </div>` : ""}
            ${buzz ? `
              <div class="insight-row">
                <div class="insight-label">${ICON.chat} 口碑参考</div>
                <ul class="insight-list">${buzz}</ul>
              </div>` : ""}
            ${pricing ? `
              <div class="insight-row">
                <div class="insight-label">${ICON.coin} 价格敏感点</div>
                <ul class="insight-list">${pricing}</ul>
              </div>` : ""}
          </div>
          ${data.选题建议 ? `<div class="insight-tip">${ICON.bulb}<span style="margin-left:4px;">选题建议：${escapeHTML(data.选题建议)}</span></div>` : ""}
        </div>`;
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
      return `<span class="tag ${active}" data-cat="${cat}" ${style}>${escapeHTML(cat)}</span>`;
    }).join("");

    wrap.querySelectorAll(".tag").forEach(el => {
      el.addEventListener("click", () => {
        activeCategory = el.getAttribute("data-cat");
        renderFilterTags();
        renderRecommendations();
        renderAllNews();
      });
    });
  }

  // ---------- 渲染：高价值推荐 ----------
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
      : `<div class="empty-state">当前筛选下暂无 ≥ 8 分的高价值选题</div>`;
  }

  // ---------- 渲染：全部信息 ----------
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
      box.innerHTML = `<div class="archive-empty">${ICON.inbox}<span style="margin-left:6px;">暂无历史归档数据，每日数据将自动归档到此处。</span></div>`;
      return;
    }

    box.innerHTML = `<div class="archive-list">` + ARCHIVES.map(day => {
      const count = (day.items || []).length;
      return `
        <div class="archive-item">
          <span>${formatDate(day.date)}</span>
          <span class="count">${count} 条</span>
        </div>`;
    }).join("") + `</div>`;
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
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    return str;
  }

  function escapeHTML(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function escapeAttr(s) { return escapeHTML(s); }

  // ---------- 初始化 ----------
  function init() {
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
