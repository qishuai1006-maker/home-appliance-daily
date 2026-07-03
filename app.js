/* ═══════════════════════════════════════════════
   家电选题日报 v4.0 · 前端逻辑
   ═══════════════════════════════════════════════ */

const D = typeof TODAY_DATA !== 'undefined' ? TODAY_DATA : { top_picks: [], items: [], comment_insights: {}, title_formulas: [], timing_alerts: [], category_trend: [] };

// ── 工具函数 ──
function fmt(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  return dateStr;
}

// ── 渲染 ──
function render() {
  const app = document.getElementById('app');
  
  let html = '';

  // ── 顶部导航 ──
  html += `
    <div class="topbar">
      <div class="topbar-inner">
        <div class="logo">
          <span class="logo-icon">🎯</span>
          <span>家电选题日报</span>
          <span class="logo-sub">v4 · 编导版</span>
        </div>
        <div class="topbar-date">
          ${D.date || '----'}
          <span class="fresh">30天内爆款</span>
        </div>
      </div>
    </div>
  `;

  // ── 第一屏：今日必拍 TOP 3 ──
  html += `<div class="container"><div class="section" id="hero">`;
  html += `<div class="section-label">🔥 TODAY'S TOP PICKS</div>`;
  html += `<h2 class="section-title">今日必拍 TOP ${D.top_picks.length}</h2>`;
  html += `<p class="section-desc">基于30天内爆款数据 + 真实互动量，自动推荐最有选题价值的内容方向</p>`;
  html += `<div class="pick-grid">`;

  for (const pick of D.top_picks) {
    const ref = pick.reference || {};
    html += `
      <div class="pick-card" data-rank="${pick.rank}">
        <div class="pick-header">
          <div class="pick-rank">${pick.rank}</div>
          <div class="pick-main">
            <div class="pick-topic">
              ${esc(pick.topic)}
              <span class="pick-cat-badge">${esc(pick.category)}</span>
            </div>
            <div class="pick-why">${esc(pick.why).replace(/(\d[\d,]+)/g, '<strong>$1</strong>')}</div>
            <div class="pick-suggested">
              <div class="pick-suggested-label">📝 建议标题</div>
              <div class="pick-suggested-title">${esc(pick.suggested_title)}</div>
            </div>
            <div class="pick-ref">
              <span class="pick-angle-tag">${esc(pick.angle)}</span>
              <span>参考爆款：</span>
              ${ref.url ? `<a href="${esc(ref.url)}" target="_blank">${esc(ref.title)}</a>` : esc(ref.title)}
              <span class="pick-ref-stat">📊 <span class="num">${fmt(ref.interactions || 0)}</span> 互动</span>
              <span class="pick-ref-stat">💬 <span class="num">${fmt(ref.comments || 0)}</span> 评论</span>
              <span class="pick-ref-stat">📍 ${esc(pick.platform)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  html += `</div></div>`;

  // ── 评论区金矿 ──
  const ci = D.comment_insights || {};
  html += `<div class="section">`;
  html += `<div class="section-label">💬 COMMENT MINING</div>`;
  html += `<h2 class="section-title">评论区金矿</h2>`;
  html += `<p class="section-desc">从爆款内容评论区提取的用户真实问题 · 每条都是你的下一个选题</p>`;
  html += `<div class="comment-section">`;

  // 高频问题
  if (ci.top_questions && ci.top_questions.length > 0) {
    html += `<div class="comment-subsection">`;
    html += `<div class="comment-subsection-title">❓ 用户最关心的问题</div>`;
    html += `<div class="comment-list">`;
    for (const q of ci.top_questions) {
      html += `
        <div class="comment-item">
          <div class="comment-likes">👍${q.likes}</div>
          <div class="comment-text">
            ${esc(q.question)}
            <span class="comment-source">— 来自「${esc(q.source)}」</span>
          </div>
        </div>
      `;
    }
    html += `</div></div>`;
  }

  // 用户吐槽
  if (ci.top_complaints && ci.top_complaints.length > 0) {
    html += `<div class="comment-subsection">`;
    html += `<div class="comment-subsection-title">😤 用户吐槽 / 痛点（=选题机会）</div>`;
    html += `<div class="comment-list">`;
    for (const c of ci.top_complaints) {
      html += `
        <div class="comment-item">
          <div class="comment-likes">👍${c.likes}</div>
          <div class="comment-text">
            ${esc(c.complaint)}
            <span class="comment-source">— 来自「${esc(c.source)}」</span>
          </div>
        </div>
      `;
    }
    html += `</div></div>`;
  }

  // 关键词云
  if (ci.hot_keywords && ci.hot_keywords.length > 0) {
    html += `<div class="comment-subsection">`;
    html += `<div class="comment-subsection-title">🔑 评论高频词</div>`;
    html += `<div class="keyword-cloud">`;
    for (const kw of ci.hot_keywords) {
      const freq = kw.count >= 5 ? 'high' : kw.count >= 2 ? 'mid' : '';
      html += `<span class="keyword-tag" data-freq="${freq}">${esc(kw.keyword)} (${kw.count})</span>`;
    }
    html += `</div></div>`;
  }

  if ((!ci.top_questions || ci.top_questions.length === 0) && (!ci.top_complaints || ci.top_complaints.length === 0)) {
    html += `<div class="comment-empty">今天暂未采集到评论区数据，正在持续挖掘中... 🚀</div>`;
  }

  html += `</div></div>`;

  // ── 标题公式库 ──
  if (D.title_formulas && D.title_formulas.length > 0) {
    html += `<div class="section">`;
    html += `<div class="section-label">📝 TITLE FORMULAS</div>`;
    html += `<h2 class="section-title">爆款标题公式库</h2>`;
    html += `<p class="section-desc">从历史爆款标题归纳的套路 · 直接填空就能用</p>`;
    html += `<div class="formula-list">`;
    for (const f of D.title_formulas) {
      const examplesText = (f.examples || []).slice(0, 2).map(e => `「${e.title}」(${fmt(e.eng)}互动)`).join(' · ');
      html += `
        <div class="formula-card">
          <div class="formula-power" data-power="${f.power}">${f.power}</div>
          <div class="formula-body">
            <div class="formula-pattern">${esc(f.pattern)}</div>
            <div class="formula-why">${esc(f.why)}</div>
            ${examplesText ? `<div class="formula-examples">案例：${examplesText}</div>` : ''}
          </div>
          <div class="formula-stat">
            <div class="num">${f.viral_count}</div>
            <div class="label">爆款</div>
          </div>
        </div>
      `;
    }
    html += `</div></div>`;
  }

  // ── 时机雷达 ──
  if (D.timing_alerts && D.timing_alerts.length > 0) {
    html += `<div class="section">`;
    html += `<div class="section-label">⏰ TIMING RADAR</div>`;
    html += `<h2 class="section-title">选题时机雷达</h2>`;
    html += `<p class="section-desc">跟着节气/事件走，踩对时间窗口 = 事半功倍</p>`;
    html += `<div class="timing-list">`;
    for (const t of D.timing_alerts) {
      const icon = t.urgency === 'high' ? '🔴' : t.urgency === 'medium' ? '🟡' : '🟢';
      html += `
        <div class="timing-card" data-urgency="${t.urgency}">
          <div class="timing-icon">${icon}</div>
          <div class="timing-body">
            <div class="timing-event">${esc(t.event)} · ${esc(t.category)}</div>
            <div class="timing-direction">建议方向：${esc(t.direction)}</div>
          </div>
          <div class="timing-status">${esc(t.status)}</div>
        </div>
      `;
    }
    html += `</div></div>`;
  }

  // ── 品类趋势 ──
  if (D.category_trend && D.category_trend.length > 0) {
    html += `<div class="section">`;
    html += `<div class="section-label">📊 CATEGORY TREND</div>`;
    html += `<h2 class="section-title">品类热度</h2>`;
    html += `<p class="section-desc">基于历史数据，哪个品类流量最大一目了然</p>`;
    html += `<div class="trend-grid">`;
    for (const c of D.category_trend) {
      html += `
        <div class="trend-card">
          <div class="trend-cat">${c.trend_icon} ${esc(c.category)}</div>
          <div class="trend-stats">
            <span><span class="num">${fmt(c.total_interactions)}</span> 互动</span>
            <span><span class="num">${c.total_items}</span> 条</span>
            <span>均<span class="num">${c.avg_score}</span></span>
          </div>
        </div>
      `;
    }
    html += `</div></div>`;
  }

  // ── 素材库 ──
  html += `<div class="section">`;
  html += `<div class="section-label">📁 RAW MATERIAL</div>`;
  html += `<h2 class="section-title">素材库</h2>`;
  html += `<p class="section-desc">全部爆款素材 · 按品类筛选 · 共 ${D.items.length} 条</p>`;
  
  // 筛选
  const categories = [...new Set(D.items.map(i => i.category || '未知'))];
  html += `<div class="filter-bar">`;
  html += `<div class="filter-chip active" data-cat="all">全部</div>`;
  for (const cat of categories) {
    html += `<div class="filter-chip" data-cat="${esc(cat)}">${esc(cat)}</div>`;
  }
  html += `</div>`;
  html += `<input class="search-box" id="materialSearch" placeholder="搜索标题 / 来源..." />`;

  html += `<div class="material-list" id="materialList">`;
  html += renderMaterialList(D.items);
  html += `</div></div>`;

  html += `</div>`; // container

  // 归档
  html += `<a class="archive-link" href="#" id="archiveBtn">📅 历史归档</a>`;

  app.innerHTML = html;
  
  // 绑定事件
  bindEvents();
}

function renderMaterialList(items) {
  if (!items || items.length === 0) {
    return `<div class="empty-state">暂无数据</div>`;
  }
  let html = '';
  for (const item of items) {
    const eng = item.douyin_interactions || item.toutiao_engagement || 0;
    const comments = item.douyin_comments || item.toutiao_comment_count || 0;
    const platform = item.source?.includes('抖音') ? '抖音' :
                     item.source?.includes('小红书') ? '小红书' :
                     item.source?.includes('头条') ? '头条' : '媒体';
    const score = item.score || 0;
    const level = score >= 9 ? 'hot' : score >= 8 ? 'good' : score >= 7 ? 'mid' : 'low';
    
    html += `
      <div class="material-card" data-cat="${esc(item.category || '未知')}">
        <div class="material-platform" data-platform="${platform}">${platform}</div>
        <div class="material-body">
          <div class="material-title">
            ${item.url ? `<a href="${esc(item.url)}" target="_blank">${esc(item.title)}</a>` : esc(item.title)}
          </div>
          <div class="material-meta">
            <span>${esc(item.source || '')}</span>
            <span>📊 ${fmt(eng)}</span>
            ${comments > 0 ? `<span>💬 ${fmt(comments)}</span>` : ''}
          </div>
        </div>
        <div class="material-score" data-level="${level}">${score.toFixed(1)}</div>
      </div>
    `;
  }
  return html;
}

function bindEvents() {
  // 品类筛选
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterMaterial();
    });
  });
  
  // 搜索
  const search = document.getElementById('materialSearch');
  if (search) {
    search.addEventListener('input', filterMaterial);
  }
}

function filterMaterial() {
  const activeCat = document.querySelector('.filter-chip.active')?.dataset.cat || 'all';
  const searchText = document.getElementById('materialSearch')?.value.toLowerCase() || '';
  
  let filtered = D.items;
  if (activeCat !== 'all') {
    filtered = filtered.filter(i => (i.category || '未知') === activeCat);
  }
  if (searchText) {
    filtered = filtered.filter(i => 
      (i.title || '').toLowerCase().includes(searchText) ||
      (i.source || '').toLowerCase().includes(searchText)
    );
  }
  
  document.getElementById('materialList').innerHTML = renderMaterialList(filtered);
}

// 启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', render);
} else {
  render();
}
