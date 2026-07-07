/* ═══════════════════════════════════════════════
   家电短视频选题作战台 v5.0 · 前端逻辑
   ═══════════════════════════════════════════════ */

const D = typeof TODAY_DATA !== 'undefined' ? TODAY_DATA : {
  date: '----', generated_at: '--:--', top_picks: [], top_pain_points: [],
  comment_insights: {}, title_formulas: [], timing_alerts: [],
  category_trend: [], materials: [], items: [],
};

// ── 工具 ──
function fmt(n) {
  if (!n) return '0';
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}
function esc(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}
function fatigueClass(f) {
  if (!f) return '';
  if (f.includes('低')) return 'fatigue-low';
  if (f.includes('高')) return 'fatigue-high';
  return 'fatigue-mid';
}

// ══════════════════════════════════════════════
// 渲染入口
// ══════════════════════════════════════════════
function render() {
  const app = document.getElementById('app');
  app.innerHTML = renderTopbar() + renderContainer();
  bindEvents();
}

// ── 顶栏 ──
function renderTopbar() {
  return `
    <div class="topbar">
      <div class="topbar-inner">
        <div class="logo">
          <span>🎯 家电短视频选题作战台</span>
          <span class="logo-sub">v5</span>
        </div>
        <div class="topbar-meta">
          <span>${D.date || '----'} ${D.generated_at || ''}</span>
          <span class="fresh-tag">30天内爆款</span>
        </div>
      </div>
    </div>
  `;
}

// ── 主容器 ──
function renderContainer() {
  let html = '<div class="container">';

  // ══ 第一屏：左右分栏 ══
  html += `<div class="hero-section">`;

  // 左侧：TOP3
  html += `<div>`;
  html += `<div class="hero-label">🔥 TODAY'S TOP 3</div>`;
  html += `<div class="hero-title">今日视频必拍 TOP3</div>`;
  html += `<div class="pick-list">`;
  for (const p of (D.top_picks || [])) {
    html += renderPickCard(p);
  }
  html += `</div></div>`;

  // 右侧：痛点 TOP5
  html += `<div>`;
  html += `<div class="hero-label">⚡ PAIN POINTS</div>`;
  html += `<div class="hero-title">今日用户痛点 TOP5</div>`;
  html += `<div class="pain-panel">`;
  html += renderPainList(D.top_pain_points || []);
  html += `</div></div>`;

  html += `</div>`; // hero-section

  // ══ 标题公式库 ══
  if (D.title_formulas && D.title_formulas.length > 0) {
    html += renderFormulaSection();
  }

  // ══ 时机雷达 ══
  if (D.timing_alerts && D.timing_alerts.length > 0) {
    html += renderTimingSection();
  }

  // ══ 品类热度 ══
  if (D.category_trend && D.category_trend.length > 0) {
    html += renderCategorySection();
  }

  // ══ 素材库 ══
  html += renderMaterialSection();

  html += `</div>`; // container
  return html;
}

// ══════════════════════════════════════════════
// TOP3 选题卡
// ══════════════════════════════════════════════
function renderPickCard(p) {
  const rank = p.rank || 1;
  const accounts = (p.account_tags || []).join(' / ') || '七哥家电说';
  const formula = p.formula_name || '';
  const fatigue = p.formula_fatigue || '';
  const fatigueCls = fatigueClass(fatigue);

  let html = `<div class="pick-card" data-rank="${rank}">`;

  // ── 卡片头部（始终可见）──
  html += `<div class="pick-head">`;
  html += `<div class="pick-rank">${rank}</div>`;
  html += `<div class="pick-head-main">`;
  html += `<div class="pick-video-title">${esc(p.video_title || '')}</div>`;
  // 标签行
  html += `<div class="pick-tags">`;
  html += `<span class="pick-tag" data-type="cat">${esc(p.category || '')}</span>`;
  if (p.content_type) html += `<span class="pick-tag" data-type="content">${esc(p.content_type)}</span>`;
  html += `<span class="pick-tag" data-type="account">${esc(accounts)}</span>`;
  if (formula) html += `<span class="pick-tag" data-type="formula">${esc(formula)}</span>`;
  html += `</div>`;
  // 双评分
  html += `<div class="pick-scores">`;
  html += `<div class="score-pill" data-type="video"><span class="score-val">${p.video_score || '--'}</span><span class="score-label">视频爆点分</span></div>`;
  html += `<div class="score-pill" data-type="image"><span class="score-val">${p.image_text_score || '--'}</span><span class="score-label">图文可写分</span></div>`;
  html += `</div>`;
  html += `</div></div>`; // pick-head

  // ── 可折叠详情 ──
  html += `<div class="pick-details">`;

  // 爆点原因
  if (p.score_reason) {
    html += `<div class="detail-block"><div class="detail-label">💡 爆点原因</div><div class="detail-text">${esc(p.score_reason)}</div></div>`;
  }

  // 用户痛点
  if (p.user_pain) {
    html += `<div class="detail-block"><div class="detail-label">😣 用户痛点</div><div class="detail-text">${esc(p.user_pain)}</div></div>`;
  }

  // 核心冲突
  if (p.core_conflict) {
    html += `<div class="detail-block"><div class="detail-label">⚡ 核心冲突</div><div class="detail-text">${esc(p.core_conflict)}</div></div>`;
  }

  // 3秒开头 ×3
  if (p.openings_3s && p.openings_3s.length > 0) {
    html += `<div class="detail-block"><div class="detail-label">🎬 前3秒开头（${p.openings_3s.length}版）</div>`;
    for (let i = 0; i < p.openings_3s.length; i++) {
      html += `<div class="opening-item"><strong>${i + 1}.</strong> ${esc(p.openings_3s[i])}</div>`;
    }
    html += `</div>`;
  }

  // 画面怎么拍
  if (p.shooting_plan && p.shooting_plan.length > 0) {
    html += `<div class="detail-block"><div class="detail-label">📹 画面怎么拍</div><ul class="detail-list">`;
    for (const s of p.shooting_plan) {
      html += `<li>${esc(s)}</li>`;
    }
    html += `</ul></div>`;
  }

  // 评论引导
  if (p.comment_hook) {
    html += `<div class="detail-block"><div class="detail-label">💬 评论引导</div><div class="detail-text">${esc(p.comment_hook)}</div></div>`;
  }

  // 风险提醒
  if (p.risk_warning) {
    html += `<div class="detail-block"><div class="detail-label">⚠️ 风险提醒</div><div class="detail-text" style="color:var(--gold)">${esc(p.risk_warning)}</div></div>`;
  }

  // 标题公式追踪
  if (formula) {
    html += `<div class="detail-block"><div class="detail-label">📐 公式追踪</div><div class="formula-tracker">`;
    html += `<span>${esc(formula)}</span>`;
    html += `<span>14天: ${esc(p.formula_usage_text || '未使用')}</span>`;
    html += `<span class="${fatigueCls}">疲劳: ${esc(fatigue)}</span>`;
    html += `</div></div>`;
  }

  // 参考爆款
  if (p.ref_title) {
    html += `<div class="ref-link">📌 参考: ${esc(p.ref_title).slice(0, 50)} · 📊 ${fmt(p.ref_engagement || 0)}互动`;
    if (p.ref_url) {
      html += ` · <a href="${esc(p.ref_url)}" target="_blank">看原片 →</a>`;
    }
    html += `</div>`;
  }

  html += `</div>`; // pick-details

  // 展开按钮
  html += `<div class="pick-expand-btn">▼ 展开详情（3秒开头 / 画面怎么拍 / 评论引导 / 风险提醒）</div>`;

  html += `</div>`; // pick-card
  return html;
}

// ══════════════════════════════════════════════
// 痛点 TOP5
// ══════════════════════════════════════════════
function renderPainList(pains) {
  if (!pains || pains.length === 0) {
    return `<div class="empty-state">
      <div style="font-size:14px;margin-bottom:8px;">📭 暂无真实评论区数据</div>
      <div style="font-size:12px;line-height:1.6;">
        痛点数据来自今日爆款的真实用户评论。<br>
        当前小红书评论接口拉取受限，建议查看左侧 TOP3 选题获取痛点。
      </div>
    </div>`;
  }
  let html = '<div class="pain-list">';
  for (const p of pains) {
    html += `<div class="pain-item">`;
    html += `<div class="pain-quote">"${esc(p.user_quote || '')}"</div>`;
    html += `<div class="pain-desc"><span class="pain-cat">${esc(p.category || '')}</span>${esc(p.pain || '')}</div>`;
    if (p.transformable_title) {
      html += `<div class="pain-transform"><span class="pain-transform-label">→ 可转选题:</span> ${esc(p.transformable_title)}</div>`;
    }
    html += `<div style="font-size:10px;color:var(--text-faint);margin-top:4px;">来源: ${esc(p.source || '')} · ${esc(p.suitable || '')}</div>`;
    html += `</div>`;
  }
  html += '</div>';
  return html;
}

// ══════════════════════════════════════════════
// 标题公式库
// ══════════════════════════════════════════════
function renderFormulaSection() {
  let html = `<div class="section">`;
  html += `<div class="section-label">📐 TITLE FORMULAS</div>`;
  html += `<div class="section-head"><span class="section-icon">📐</span><span class="section-name">爆款标题公式库</span></div>`;
  html += `<div class="formula-grid">`;

  for (const f of D.title_formulas) {
    const fatigue = f.fatigue || '';
    const fcls = fatigueClass(fatigue);
    html += `<div class="formula-card">`;
    html += `<div class="formula-head">`;
    html += `<span class="formula-name">${esc(f.name)}</span>`;
    html += `<span class="formula-power" data-power="${esc(f.power || '中')}">${esc(f.power || '中')}</span>`;
    html += `</div>`;
    html += `<div class="formula-desc">${esc(f.desc || '')}</div>`;
    html += `<div class="formula-meta">`;
    html += `<span>14天爆款: ${f.viral_count_14d || 0}</span>`;
    html += `<span>使用: ${esc(f.usage_text || '未使用')}</span>`;
    html += `<span class="${fcls}">疲劳: ${esc(fatigue)}</span>`;
    html += `</div>`;
    // 经典案例（真实历史爆款）+ 结构模板
    if (f.apply_demo && f.apply_demo.length > 0) {
      const real = f.apply_demo.filter(d => d && d.is_real);
      const tmpl = f.apply_demo.filter(d => d && !d.is_real);
      html += `<div class="formula-demos">`;
      if (real.length > 0) {
        html += `<div style="font-size:10px;color:var(--green);font-weight:600;margin-bottom:4px;">✅ 真实爆款案例</div>`;
        for (const d of real) {
          html += `<div class="formula-demo-item">→ ${esc(d.text)}</div>`;
        }
      }
      if (tmpl.length > 0) {
        html += `<div style="font-size:10px;color:var(--blue);font-weight:600;margin:8px 0 4px;">📝 结构模板（填空即可）</div>`;
        for (const d of tmpl) {
          html += `<div class="formula-demo-item" style="color:var(--text-dim);font-style:italic;">→ ${esc(d.text)}</div>`;
        }
      }
      html += `</div>`;
    }
    html += `</div>`;
  }

  html += `</div></div>`;
  return html;
}

// ══════════════════════════════════════════════
// 时机雷达
// ══════════════════════════════════════════════
function renderTimingSection() {
  let html = `<div class="section">`;
  html += `<div class="section-label">⏰ TIMING RADAR</div>`;
  html += `<div class="section-head"><span class="section-icon">⏰</span><span class="section-name">选题时机雷达</span></div>`;

  for (const t of D.timing_alerts) {
    html += `<div class="timing-card" data-urgency="${esc(t.urgency || 'low')}" style="margin-bottom:12px;">`;
    html += `<div class="timing-head">`;
    html += `<span class="timing-event">${esc(t.event)}</span>`;
    html += `<span class="timing-badge" data-urgency="${esc(t.urgency || 'low')}">${esc(t.status || '')}</span>`;
    html += `</div>`;

    html += `<div class="timing-grid">`;
    html += `<div class="timing-field"><div class="timing-field-label">为什么现在拍</div>${esc(t.why_now || '')}</div>`;
    html += `<div class="timing-field"><div class="timing-field-label">最佳窗口</div>${esc(t.best_window || '')}</div>`;
    html += `<div class="timing-field"><div class="timing-field-label">过期风险</div>${esc(t.expire_risk || '')}</div>`;
    html += `<div class="timing-field"><div class="timing-field-label">适合品类</div>${esc(t.category || '')}</div>`;
    html += `</div>`;

    if (t.angles && t.angles.length > 0) {
      html += `<div class="timing-field-label" style="margin-bottom:6px;">可拍角度</div>`;
      html += `<div class="timing-angles">`;
      for (const a of t.angles) {
        html += `<span class="timing-angle">${esc(a)}</span>`;
      }
      html += `</div>`;
    }

    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

// ══════════════════════════════════════════════
// 品类热度
// ══════════════════════════════════════════════
function renderCategorySection() {
  let html = `<div class="section">`;
  html += `<div class="section-label">📊 CATEGORY TREND</div>`;
  html += `<div class="section-head"><span class="section-icon">📊</span><span class="section-name">品类热度</span><span class="section-sub">· 为什么进了/没进 TOP3</span></div>`;
  html += `<div class="cat-grid">`;

  for (const c of D.category_trend) {
    const inTop3 = c.in_top3;
    html += `<div class="cat-card" data-status="${esc(c.status || 'low')}">`;
    html += `<div class="cat-head">`;
    html += `<span class="cat-name">${esc(c.category)}</span>`;
    html += `<span class="cat-top3-flag" data-in="${inTop3}">${inTop3 ? '✅ 进了TOP3' : '❌ 未进'}</span>`;
    html += `</div>`;
    html += `<div class="cat-stats">`;
    html += `<span><span class="num">${fmt(c.total_interactions)}</span> 互动</span>`;
    html += `<span><span class="num">${c.total_items}</span> 条</span>`;
    html += `<span>均<span class="num">${c.avg_score}</span></span>`;
    html += `<span>今日<span class="num">${c.today_items}</span></span>`;
    html += `</div>`;
    html += `<div class="cat-reason">${esc(c.reason || '')}</div>`;
    html += `</div>`;
  }

  html += `</div></div>`;
  return html;
}

// ══════════════════════════════════════════════
// 素材库
// ══════════════════════════════════════════════
function renderMaterialSection() {
  const mats = D.materials || D.items || [];
  let html = `<div class="section">`;
  html += `<div class="section-label">📁 MATERIAL LIBRARY</div>`;
  html += `<div class="section-head"><span class="section-icon">📁</span><span class="section-name">素材库</span><span class="section-sub">· ${mats.length} 条可复刻素材</span></div>`;

  // 筛选
  const cats = [...new Set(mats.map(m => m.category || '未知'))];
  html += `<div class="filter-bar">`;
  html += `<div class="filter-chip active" data-cat="all">全部</div>`;
  for (const cat of cats) {
    html += `<div class="filter-chip" data-cat="${esc(cat)}">${esc(cat)}</div>`;
  }
  html += `</div>`;
  html += `<input class="search-box" id="matSearch" placeholder="🔍 搜索标题 / 来源..." />`;
  html += `<div class="material-list" id="matList">`;
  html += renderMaterialList(mats);
  html += `</div></div>`;
  return html;
}

function renderMaterialList(mats) {
  if (!mats || mats.length === 0) return `<div class="empty-state">暂无素材</div>`;
  let html = '';
  for (const m of mats) {
    const score = m.score || 0;
    const level = score >= 9 ? 'hot' : score >= 8 ? 'good' : score >= 7 ? 'mid' : 'low';
    const platform = m.platform || (m.source || '').includes('抖音') ? '抖音' :
      (m.source || '').includes('小红书') ? '小红书' :
        (m.source || '').includes('头条') ? '头条' : '媒体';
    const isRef = m.is_today_top3_ref;

    html += `<div class="material-card" data-cat="${esc(m.category || '未知')}" data-ref="${isRef}">`;
    html += `<div class="mat-head">`;
    html += `<span class="mat-platform" data-p="${esc(platform)}">${esc(platform)}</span>`;
    html += `<div class="mat-title">${m.url ? `<a href="${esc(m.url)}" target="_blank">${esc(m.title)}</a>` : esc(m.title)}</div>`;
    html += `<div class="mat-score" data-level="${level}">${score.toFixed(1)}</div>`;
    html += `</div>`;

    html += `<div class="mat-meta">`;
    html += `<span>📊 ${fmt(m.engagement || 0)}</span>`;
    if (m.comments) html += `<span>💬 ${fmt(m.comments)}</span>`;
    if (m.source) html += `<span>${esc(m.source).slice(0, 20)}</span>`;
    html += `</div>`;

    // 增强信息
    if (m.repeatable_points && m.repeatable_points.length > 0) {
      html += `<div class="mat-insight">`;
      html += `<div class="mat-insight-row"><span class="mat-insight-label">✅ 可复刻:</span> <span class="mat-insight-text">${esc(m.repeatable_points.join(' · '))}</span></div>`;
      if (m.not_copy_points && m.not_copy_points.length > 0) {
        html += `<div class="mat-insight-row"><span class="mat-insight-label">❌ 别照搬:</span> <span class="mat-insight-text">${esc(m.not_copy_points.join(' · '))}</span></div>`;
      }
      if (m.qige_title) {
        html += `<div class="mat-qige">🔥 七哥版: ${esc(m.qige_title)}</div>`;
      }
      html += `</div>`;
    }

    html += `</div>`;
  }
  return html;
}

// ══════════════════════════════════════════════
// 事件绑定
// ══════════════════════════════════════════════
function bindEvents() {
  // TOP3 卡片展开/折叠
  document.querySelectorAll('.pick-expand-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.pick-card');
      const expanded = card.classList.toggle('expanded');
      btn.textContent = expanded
        ? '▲ 收起详情'
        : '▼ 展开详情（3秒开头 / 画面怎么拍 / 评论引导 / 风险提醒）';
    });
  });

  // 素材库筛选
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterMaterial();
    });
  });

  // 素材库搜索
  const search = document.getElementById('matSearch');
  if (search) search.addEventListener('input', filterMaterial);
}

function filterMaterial() {
  const activeCat = document.querySelector('.filter-chip.active')?.dataset.cat || 'all';
  const searchText = document.getElementById('matSearch')?.value.toLowerCase() || '';
  const mats = D.materials || D.items || [];

  let filtered = mats;
  if (activeCat !== 'all') {
    filtered = filtered.filter(m => (m.category || '未知') === activeCat);
  }
  if (searchText) {
    filtered = filtered.filter(m =>
      (m.title || '').toLowerCase().includes(searchText) ||
      (m.source || '').toLowerCase().includes(searchText)
    );
  }

  document.getElementById('matList').innerHTML = renderMaterialList(filtered);
}

// ── 启动 ──
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', render);
} else {
  render();
}
