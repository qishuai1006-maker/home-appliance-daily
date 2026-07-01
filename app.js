/* ============================================================
   家电行业日报 — 渲染逻辑
   依赖：data.js 提供全局 TODAY_DATA 与 ARCHIVES
   ============================================================ */

(function () {
  "use strict";

  // ---------- 配置 ----------
  // 筛选条展示的品类（顺序即排列顺序）
  const CATEGORY_FILTERS = [
    "全部", "空调", "冰箱", "洗衣机", "电视", "厨电",
    "热水器", "小家电", "清洁电器", "智能家居", "综合家电"
  ];
  const HIGH_SCORE_THRESHOLD = 8;       // 高价值选题推荐阈值
  const STAT_HIGH_SCORE_THRESHOLD = 7;  // 统计卡 "高分选题" 阈值

  // ---------- 状态 ----------
  let activeCategory = "全部";
  let searchKeyword = "";

  // ---------- 工具函数 ----------

  /** 构造品类标签 HTML（带颜色 CSS 变量） */
  function catTagHTML(category) {
    return `<span class="cat-tag" style="--cat:var(--cat-${category});">${category}</span>`;
  }

  /** 评分转星标字符串（半星用半角近似） */
  function scoreStars(score) {
    const full = Math.floor(score);
    const half = score - full >= 0.5 ? 1 : 0;
    const empty = Math.max(0, 5 - full - half);
    return "★".repeat(full) + (half ? "⯨" : "") + "☆".repeat(empty);
  }

  /** 是否命中当前筛选条件 */
  function matchFilters(item) {
    // 品类
    if (activeCategory !== "全部" && item.category !== activeCategory) return false;
    // 搜索
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      const hay = [
        item.title || "",
        item.source || "",
        item.angle || "",
        item.category || ""
      ].join(" ").toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    return true;
  }

  /** 单张卡片 HTML */
  function cardHTML(item, large) {
    const isGold = item.score >= HIGH_SCORE_THRESHOLD;
    const tier = (item.tier || "").toUpperCase();
    const stars = scoreStars(item.score);

    const angleHTML = item.angle
      ? `<div class="angle"><span class="angle-icon">💡</span><span>${escapeHTML(item.angle)}</span></div>`
      : "";

    return `
      <div class="card ${large ? "card-lg" : ""} ${isGold ? "gold" : ""}">
        <h3 class="card-title">
          ${item.url
            ? `<a href="${escapeAttr(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(item.title)}</a>`
            : escapeHTML(item.title)}
        </h3>
        <div class="card-meta">
          ${catTagHTML(item.category)}
          ${tier ? `<span class="tier-badge tier-${tier}">${tier}</span>` : ""}
          <span class="source-tag">📡 ${escapeHTML(item.source || "未知来源")}</span>
          <span class="score">
            <span class="stars">${stars}</span>
            <span class="score-num">${item.score.toFixed(1)}</span>
          </span>
        </div>
        ${angleHTML}
      </div>`;
  }

  // ---------- 渲染：选题灵感（AI 生成） ----------
  function renderIdeas() {
    const box = document.getElementById("ideasContainer");
    const section = document.getElementById("ideasSection");
    const ideas = (typeof TOPIC_IDEAS !== "undefined" && TOPIC_IDEAS) || null;

    if (!ideas || ideas.length === 0) {
      section.style.display = "none";
      return;
    }

    const cards = ideas.map((idea, i) => {
      const title = idea.title || "";
      const cat = idea.category || "综合";
      const angle = idea.angle || "";
      const reason = idea.reason || "";
      const refs = idea.refs || [];

      const refsHTML = refs.length
        ? `<div class="idea-refs">📎 参考素材：第 ${refs.join("、")} 条</div>`
        : "";

      return `
        <div class="idea-card">
          <div class="idea-header">
            <span class="idea-num">${i + 1}</span>
            <span class="cat-tag" style="--cat:var(--cat-${cat});">${cat}</span>
          </div>
          <h3 class="idea-title">${escapeHTML(title)}</h3>
          ${angle ? `<div class="idea-angle"><span class="idea-label">📝 写法</span>${escapeHTML(angle)}</div>` : ""}
          ${reason ? `<div class="idea-reason"><span class="idea-label">🔥 为什么能火</span>${escapeHTML(reason)}</div>` : ""}
          ${refsHTML}
        </div>`;
    }).join("");

    box.innerHTML = cards;
  }

  // ---------- 渲染：用户评论洞察（选题金矿） ----------
  function renderInsight() {
    const box = document.getElementById("insightContainer");
    const section = document.getElementById("insightSection");
    const insights = (typeof COMMENT_INSIGHTS !== "undefined" && COMMENT_INSIGHTS) || null;

    if (!insights || !insights.by_category || Object.keys(insights.by_category).length === 0) {
      section.style.display = "none";
      return;
    }

    const generated = insights.generated_at
      ? `<div class="insight-meta">📅 洞察生成时间：${formatDate(insights.generated_at)} · 来源：${insights.total_videos_analyzed || 0} 条高互动视频评论</div>`
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
            <span class="insight-stat">${data.评论样本 || 0} 条评论样本</span>
          </div>
          <div class="insight-body">
            ${questions ? `
              <div class="insight-row">
                <div class="insight-label">🔥 高频问题</div>
                <ul class="insight-list">${questions}</ul>
              </div>` : ""}
            ${debates ? `
              <div class="insight-row">
                <div class="insight-label">⚔️ 争议话题</div>
                <ul class="insight-list">${debates}</ul>
              </div>` : ""}
            ${buzz ? `
              <div class="insight-row">
                <div class="insight-label">💬 口碑参考</div>
                <ul class="insight-list">${buzz}</ul>
              </div>` : ""}
            ${pricing ? `
              <div class="insight-row">
                <div class="insight-label">💰 价格敏感点</div>
                <ul class="insight-list">${pricing}</ul>
              </div>` : ""}
          </div>
          ${data.选题建议 ? `<div class="insight-tip">💡 选题建议：${escapeHTML(data.选题建议)}</div>` : ""}
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
    setText("todayDate", `📅 ${formatDate(TODAY_DATA.date)}`);
  }

  // ---------- 渲染：筛选标签 ----------
  function renderFilterTags() {
    const wrap = document.getElementById("filterTags");
    wrap.innerHTML = CATEGORY_FILTERS.map(cat => {
      const active = cat === activeCategory ? "active" : "";
      const style = cat !== "全部" ? `style="--cat:var(--cat-${cat});"` : "";
      return `<span class="tag ${active}" data-cat="${cat}" ${style}>${cat}</span>`;
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

  // ---------- 渲染：选题推荐区 (score≥8) ----------
  function renderRecommendations() {
    const grid = document.getElementById("recommendGrid");
    const section = document.getElementById("recommendSection");

    const recs = (TODAY_DATA.items || [])
      .filter(i => i.score >= HIGH_SCORE_THRESHOLD)
      .filter(matchFilters)
      .sort((a, b) => b.score - a.score);

    // 没有命中筛选时隐藏整个推荐区（避免空块）
    if (activeCategory !== "全部" || searchKeyword) {
      section.style.display = recs.length ? "" : "none";
    } else {
      section.style.display = "";
    }

    grid.innerHTML = recs.length
      ? recs.map(i => cardHTML(i, true)).join("")
      : `<div class="empty-state">当前筛选下暂无 ≥8 分的高价值选题</div>`;
  }

  // ---------- 渲染：全部信息区（按评分排序）----------
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
      box.innerHTML = `<div class="archive-empty">📭 暂无历史归档数据，每日数据将自动归档到此处。</div>`;
      return;
    }

    box.innerHTML = ARCHIVES.map(day => {
      const count = (day.items || []).length;
      return `
        <div class="archive-item">
          <span class="ar-date">📅 ${formatDate(day.date)}</span>
          <span class="ar-count">${count} 条信息</span>
        </div>`;
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

  // ---------- 小工具 ----------
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function formatDate(str) {
    if (!str) return "—";
    // 2026-07-01 -> 2026年07月01日
    const m = String(str).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${m[1]}年${m[2]}月${m[3]}日`;
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
