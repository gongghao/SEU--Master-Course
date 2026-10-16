import { STORAGE_KEY, emptyState, validateCourses, validateState, mergeCourses, courseRecord, progress, filterCourses, safeUrl } from './model.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const uid = () => `u-${crypto.randomUUID()}`;
let base = [], state = emptyState(), view = 'all', query = '', activeTab = 'outline', current = null;
let toastTimer, storageAvailable = true;

function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 4500);
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageAvailable = true; return true; }
  catch { storageAvailable = false; toast('浏览器无法保存记录，请及时从「数据与备份」导出备份。'); return false; }
}
function record(id) {
  if (!state.courseState[id]) state.courseState[id] = courseRecord(state, id);
  return state.courseState[id];
}
const courses = () => mergeCourses(base, state.customCourses);
const getCourse = id => courses().find(c => c.id === id);
const symbol = c => `<span class="course-symbol ${c.color} ${c.symbol.length > 2 ? 'long' : ''}" aria-hidden="true">${escape(c.symbol)}</span>`;
const star = c => `<button class="star" data-favorite="${escape(c.id)}" aria-pressed="${state.favorites.includes(c.id)}" aria-label="${state.favorites.includes(c.id) ? '取消收藏' : '收藏'}${escape(c.title)}">${state.favorites.includes(c.id) ? '★' : '☆'}</button>`;
const bar = p => `<div class="progress-track" role="progressbar" aria-label="复习清单完成进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p.percent}"><span class="progress-fill" style="width:${p.percent}%"></span></div>`;
function updateSidebar() {
  const all = courses();
  $('#all-count').textContent = all.length;
  $('#favorite-count').textContent = all.filter(c => state.favorites.includes(c.id)).length;
  $('#public-count').textContent = all.filter(c => c.category === '公共必修课').length;
  $('#major-count').textContent = all.filter(c => c.category === '专业必修课').length;
  document.querySelectorAll('[data-view]').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view && !current);
    if (b.dataset.view === view && !current) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
}

function card(c) {
  const p = progress(c, courseRecord(state, c.id));
  return `<article class="course-card"><div class="card-top">${symbol(c)}<span class="category-badge">${c.category}</span>${star(c)}</div>
    <div class="course-code">${escape(c.id)}</div><h3><a href="#course/${encodeURIComponent(c.id)}">${escape(c.title)}</a></h3>
    <p class="course-description">${escape(c.description || '从整理知识开始，建立你的课程复习计划。')}</p>
    <div class="card-progress">${bar(p)}<span class="percent">${p.percent}%</span></div>
    <div class="card-bottom"><span>${c.credits} 学分</span><span>${p.done}/${p.total} 项已完成</span><span class="arrow" aria-hidden="true">↗</span></div></article>`;
}

function renderCards() {
  const visible = filterCourses(courses(), view, query, state.favorites);
  $('#result-count').textContent = `${visible.length} 门课程`;
  $('#course-grid').innerHTML = visible.map(card).join('') + ((!query && view === 'all') ? `<button class="add-card" data-add-course><span class="add-symbol" aria-hidden="true">＋</span><strong>开启一门新课程</strong><small>让你的知识库持续生长</small></button>` : '') ||
    `<div class="empty"><h3>${view === 'favorites' && !query ? '把想优先复习的课程收藏在这里' : '没有找到匹配的课程'}</h3><p>${query ? '试试课程名称或课程编号，或清空搜索。' : '点击课程卡片右上角的星标，即可添加收藏。'}</p></div>`;
}

function renderHome() {
  current = null;
  document.title = '知序 · SEU 课程复习空间';
  const all = courses(), summary = all.map(c => progress(c, courseRecord(state, c.id)));
  const done = summary.reduce((n, p) => n + p.done, 0), total = summary.reduce((n, p) => n + p.total, 0);
  const title = view === 'all' ? '课程总览' : view === 'favorites' ? '我的收藏' : view;
  const recent = getCourse(state.recent);
  $('#breadcrumb-current').textContent = title;
  $('#main').innerHTML = `<div class="page-heading"><div><span class="eyebrow">A LITTLE PROGRESS, EVERY DAY</span><h1>让知识，慢慢有序。</h1><p>欢迎回到你的课程复习空间。选一门课，开始今天的积累。</p></div><button class="button primary" data-add-course><span aria-hidden="true">＋</span>添加课程</button></div>
    <section class="hero" aria-label="本学期复习计划"><div><span class="eyebrow">YOUR SEMESTER, ORGANIZED</span><h2>一门一门梳理，一步一步掌握。</h2><p>公共必修与专业必修，集中在一个安静的角落。<br>从知识清单，到属于自己的复习笔记。</p></div>
    <svg class="hero-art" viewBox="0 0 260 150" fill="none" aria-hidden="true"><ellipse cx="139" cy="133" rx="95" ry="9" fill="#dbe4cf"/><path d="M63 110l105-18 62 19-105 20z" fill="#b6c8a6" stroke="#7f9573"/><path d="M63 110v8l62 20 105-19v-8l-105 20z" fill="#f7f7e8" stroke="#7f9573"/><path d="M52 90l107-17 63 18-107 19z" fill="#e5d9ad" stroke="#9c966f"/><path d="M52 90v12l63 20 107-19V91l-107 19z" fill="#fbf8e9" stroke="#9c966f"/><path d="M87 36l64-12 27 60-64 14z" fill="#fcfcf3" stroke="#8b9e7b" stroke-width="1.4"/><path d="M151 24l57 9-30 51z" fill="#d5dfc5" stroke="#8b9e7b" stroke-width="1.4"/><path d="M101 46l39-7m-34 18l39-7m-35 18l39-7m-34 18l27-5" stroke="#b5c3a3" stroke-width="2"/><path d="M148 25l30 61" stroke="#8b9e7b"/><path d="M124 91l8 17 6-7 8 4-8-17" fill="#bd8e63"/><path d="M47 53v13m-6-6h12m159-43v12m-6-6h12" stroke="#9aad82" stroke-width="1.4"/><circle cx="68" cy="24" r="3" fill="#c6d2b3"/><circle cx="224" cy="62" r="3" stroke="#9aad82"/></svg></section>
    <section class="stats" aria-label="全部课程学习概况">
      <div class="stat"><div><span class="stat-label">已收录课程</span><span class="stat-number">${all.length}<small>门课程</small></span></div><span class="stat-icon" aria-hidden="true">▦</span></div>
      <div class="stat"><div><span class="stat-label">必修课学分</span><span class="stat-number">${all.reduce((n, c) => n + c.credits, 0)}<small>学分</small></span></div><span class="stat-icon" aria-hidden="true">◇</span></div>
      <div class="stat"><div><span class="stat-label">已完成清单</span><span class="stat-number">${done}<small>/ ${total} 项</small></span></div><span class="stat-icon" aria-hidden="true">✓</span></div>
      <div class="stat"><div><span class="stat-label">整体复习进度</span><span class="stat-number">${total ? Math.round(done / total * 100) : 0}<small>%</small></span></div><span class="stat-icon" aria-hidden="true">◷</span></div>
    </section>
    <section aria-labelledby="courses-title"><div class="section-heading"><h2 class="section-title" id="courses-title">${title}<small>COURSE LIBRARY</small></h2><div class="search"><span aria-hidden="true">⌕</span><input id="search" type="search" aria-label="搜索课程名称或编号" placeholder="搜索课程名称或编号…" value="${escape(query)}"></div></div>
    <div class="filters" role="group" aria-label="筛选课程">${[['all','全部课程'],['公共必修课','公共必修课'],['专业必修课','专业必修课']].map(([v,t]) => `<button class="filter ${view === v ? 'active' : ''}" data-filter="${v}" aria-pressed="${view === v}">${t}</button>`).join('')}<span class="result-count" id="result-count"></span></div>
    <div class="course-grid" id="course-grid"></div></section>
    ${recent ? `<div class="recent"><span>继续上次的复习</span><a href="#course/${encodeURIComponent(recent.id)}">${escape(recent.title)} →</a></div>` : ''}
    <p class="home-note"><span aria-hidden="true">ⓘ</span>课程信息来自 2026 年秋季选课表。预设清单为建议复习框架，具体范围请以教师要求为准。学习记录保存在本浏览器。</p>`;
  $('#search').addEventListener('input', e => { query = e.target.value; renderCards(); });
  renderCards(); updateSidebar();
}

function renderDetail(c) {
  current = c.id;
  document.title = `${c.title} · 知序`;
  $('#breadcrumb-current').textContent = c.title;
  const r = courseRecord(state, c.id), p = progress(c, r);
  $('#main').innerHTML = `<a href="#" class="back">← 返回课程总览</a><div class="detail-hero">${symbol(c)}<div><div class="course-code">${escape(c.id)}</div><h1>${escape(c.title)}</h1><div class="detail-meta"><span>${c.category}</span><span>${c.credits} 学分</span><span>${escape(c.semester)}</span></div></div>${star(c)}</div>
    <div class="detail-layout"><section class="panel"><div class="tabs" role="tablist" aria-label="课程内容">${[['outline','复习清单'],['notes','我的笔记'],['resources','课程资料']].map(([key,title]) => `<button class="tab ${activeTab === key ? 'active' : ''}" id="tab-${key}" role="tab" aria-selected="${activeTab === key}" aria-controls="tab-content" tabindex="${activeTab === key ? 0 : -1}" data-tab="${key}">${title}</button>`).join('')}</div><div id="tab-content" role="tabpanel" aria-labelledby="tab-${activeTab}"></div></section>
    <aside class="detail-aside"><section class="panel side-panel"><span class="aside-heading">每一小步，都算数</span><div class="progress-summary"><strong id="detail-percent">${p.percent}%</strong><span id="detail-done">已完成 ${p.done} / ${p.total} 项</span></div><div id="detail-progress">${bar(p)}</div><p>完成一项，就勾选一项。进度以复习清单为准，随你的学习慢慢累积。</p></section>
    <section class="panel side-panel"><h2>关于这门课</h2><p>${escape(c.description || '为这门课建立属于自己的知识体系。')}</p><ul class="course-facts"><li>课程类别<span>${c.category}</span></li><li>课程学分<span>${c.credits} 学分</span></li><li>开课学期<span>${escape(c.semester)}</span></li></ul></section></aside></div>`;
  renderTab(c); updateSidebar();
}

function refreshProgress(c) {
  const p = progress(c, courseRecord(state, c.id));
  $('#detail-percent').textContent = `${p.percent}%`;
  $('#detail-done').textContent = `已完成 ${p.done} / ${p.total} 项`;
  $('#detail-progress').innerHTML = bar(p);
}

function renderTab(c) {
  const r = courseRecord(state, c.id), target = $('#tab-content');
  if (activeTab === 'outline') {
    target.innerHTML = `<h2>把复习拆成可完成的小事</h2><p class="guidance">建议复习框架 · 预设条目根据课程名称整理，并非教师公布的考试大纲。请结合课件与课堂要求补充实际重点。</p><div id="tasks">${[...c.topics, ...r.tasks].map(t => `<div class="task ${r.done.includes(t.id) ? 'completed' : ''}"><input type="checkbox" id="task-${escape(t.id)}" data-task="${escape(t.id)}" ${r.done.includes(t.id) ? 'checked' : ''}><label for="task-${escape(t.id)}">${escape(t.title)}</label>${r.tasks.some(x => x.id === t.id) ? `<button class="delete-button" data-delete-task="${escape(t.id)}" aria-label="删除${escape(t.title)}">删除</button>` : ''}</div>`).join('') || '<p class="muted">还没有复习条目，先添加今天想完成的一件事。</p>'}</div><form class="inline-form" id="task-form"><input name="title" aria-label="新复习条目" required maxlength="300" placeholder="添加一个复习重点…"><button class="button secondary" type="submit">＋ 添加</button></form><p class="form-error" id="task-error" role="alert"></p>`;
    $('#task-form').addEventListener('submit', e => {
      e.preventDefault(); const title = new FormData(e.target).get('title').trim();
      if (!title) return;
      if (record(c.id).tasks.length >= 200) { $('#task-error').textContent = '每门课程最多添加 200 个复习条目。'; return; }
      record(c.id).tasks.push({ id: uid(), title }); save(); renderTab(c); refreshProgress(c); $('#task-form input').focus();
    });
  } else if (activeTab === 'notes') {
    target.innerHTML = `<div class="notes-header"><h2>写下理解，留住思路</h2><span class="save-status" id="save-status">${storageAvailable ? '自动保存到本浏览器' : '保存不可用，请导出备份'}</span></div><label for="notes" class="muted">知识梳理、错题复盘、考前提醒，都可以记在这里。</label><textarea id="notes" class="notes-area" maxlength="200000" placeholder="# 本章重点&#10;&#10;用自己的话，重新讲一遍。&#10;&#10;## 还没弄懂的问题&#10;- ">${escape(r.notes)}</textarea><div class="notes-footer"><small>支持输入 Markdown 文本，导出后可继续编辑。</small><button id="download-notes" class="button secondary">导出笔记 .md ↓</button></div>`;
    $('#notes').addEventListener('input', e => { record(c.id).notes = e.target.value; $('#save-status').textContent = save() ? '已保存到本浏览器' : '未保存，请导出备份'; });
    $('#download-notes').addEventListener('click', () => download(`# ${c.title}\n\n${courseRecord(state,c.id).notes}`, `${c.id}-复习笔记.md`, 'text/markdown'));
  } else {
    const resources = [...c.resources, ...r.resources];
    target.innerHTML = `<h2>让资料归到一处</h2><p class="muted">收集课件、教材、习题与参考链接，复习时少找一步。</p>${resources.map(x => `<div class="resource"><span class="resource-icon" aria-hidden="true">↗</span><a href="${escape(safeUrl(x.url))}" target="_blank" rel="noopener noreferrer">${escape(x.title)}<small>${escape(x.url)}</small></a>${r.resources.some(y => y.id === x.id) ? `<button class="delete-button" data-delete-resource="${escape(x.id)}" aria-label="删除${escape(x.title)}">删除</button>` : ''}</div>`).join('') || '<div class="empty"><h3>这里等待你的第一份资料</h3><p>目前仅导入了选课信息，尚未添加课件或教材。<br>可添加 GitHub 文件、在线文档或其他资料的链接。</p></div>'}<form id="resource-form" class="resource-form"><h3>添加资料链接</h3><label>资料名称<input name="title" required maxlength="150" placeholder="例如：第 1 章课件"></label><label>链接地址<input name="url" type="url" required maxlength="2048" placeholder="https://…"></label><p class="form-error" id="resource-error" role="alert"></p><button class="button primary" type="submit">添加资料 ＋</button></form>`;
    $('#resource-form').addEventListener('submit', e => {
      e.preventDefault(); const data = new FormData(e.target), url = safeUrl(data.get('url')), title = data.get('title').trim();
      if (!url || !title) { $('#resource-error').textContent = '请输入名称和有效的 http / https 链接。'; return; }
      if (record(c.id).resources.length >= 200) { $('#resource-error').textContent = '每门课程最多添加 200 份资料。'; return; }
      record(c.id).resources.push({ id: uid(), title, url }); save(); renderTab(c); toast('资料链接已添加');
    });
  }
}

function route() {
  const match = location.hash.match(/^#course\/([A-Za-z0-9_-]+)$/);
  if (location.hash.startsWith('#course/')) {
    const c = match && getCourse(match[1]);
    if (!c) { current = null; $('#breadcrumb-current').textContent = '课程未找到'; $('#main').innerHTML = '<div class="empty"><h1>没有找到这门课程</h1><p>课程可能只保存在其他浏览器中，请导入学习备份后再试。</p><a class="button primary" href="#">返回课程总览</a></div>'; updateSidebar(); return; }
    activeTab = 'outline'; state.recent = c.id; save(); renderDetail(c);
  } else renderHome();
  window.scrollTo(0, 0);
}

function setView(next) { view = next; query = ''; if (location.hash) location.hash = ''; else renderHome(); }
function download(content, filename, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type })), a = document.createElement('a');
  a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.addEventListener('click', e => {
  const button = e.target.closest('button'); if (!button) return;
  if (button.hasAttribute('data-add-course')) { $('#course-form').reset(); $('#course-error').textContent = ''; $('#course-dialog').showModal(); }
  if (button.dataset.close) document.getElementById(button.dataset.close).close();
  if (button.dataset.view) setView(button.dataset.view);
  if (button.dataset.filter) setView(button.dataset.filter);
  if (button.dataset.favorite) {
    const id = button.dataset.favorite, index = state.favorites.indexOf(id);
    if (index === -1) state.favorites.push(id); else state.favorites.splice(index, 1);
    save(); updateSidebar();
    if (current) { button.outerHTML = star(getCourse(id)); $(`[data-favorite="${id}"]`).focus(); }
    else { renderCards(); $(`[data-favorite="${id}"]`)?.focus(); }
  }
  if (button.dataset.tab && current) {
    activeTab = button.dataset.tab; renderDetail(getCourse(current)); $(`[data-tab="${activeTab}"]`).focus();
  }
  if (button.dataset.deleteTask && current) {
    const r = record(current), id = button.dataset.deleteTask;
    r.tasks = r.tasks.filter(t => t.id !== id); r.done = r.done.filter(t => t !== id); save(); renderTab(getCourse(current)); refreshProgress(getCourse(current));
  }
  if (button.dataset.deleteResource && current) {
    record(current).resources = record(current).resources.filter(r => r.id !== button.dataset.deleteResource); save(); renderTab(getCourse(current));
  }
});
document.addEventListener('change', e => {
  if (!e.target.dataset.task || !current) return;
  const r = record(current), id = e.target.dataset.task;
  r.done = r.done.filter(x => x !== id); if (e.target.checked) r.done.push(id);
  e.target.closest('.task').classList.toggle('completed', e.target.checked); save(); refreshProgress(getCourse(current));
});
document.addEventListener('keydown', e => {
  if (!e.target.matches('[role="tab"]') || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault(); const tabs = ['outline','notes','resources'], i = tabs.indexOf(activeTab);
  activeTab = e.key === 'Home' ? tabs[0] : e.key === 'End' ? tabs[2] : tabs[(i + (e.key === 'ArrowRight' ? 1 : 2)) % 3];
  renderDetail(getCourse(current)); $(`[data-tab="${activeTab}"]`).focus();
});

$('#course-form').addEventListener('submit', e => {
  e.preventDefault(); const data = new FormData(e.target), id = data.get('id').trim();
  if (courses().some(c => c.id.toLowerCase() === id.toLowerCase())) { $('#course-error').textContent = '这个课程编号已存在，请使用不同编号。'; return; }
  const c = { id, title: data.get('title').trim(), category: data.get('category'), credits: Number(data.get('credits')), semester: data.get('semester').trim(), description: data.get('description').trim(), symbol: '◇', color: data.get('category') === '公共必修课' ? 'sand' : 'mint', topics: data.get('topics').split('\n').map(t => t.trim()).filter(Boolean).map(title => ({id:uid(),title})), resources: [] };
  try { validateCourses([...courses(), c]); } catch (error) { $('#course-error').textContent = error.message; return; }
  state.customCourses.push(c); const saved = save(); $('#course-dialog').close(); setView('all');
  if (saved) toast('课程已添加到本浏览器，可在「数据与备份」中导出课程配置');
});
$('#backup-button').addEventListener('click', () => { $('#backup-error').textContent = ''; $('#backup-dialog').showModal(); });
$('#export-backup').addEventListener('click', () => download(JSON.stringify(state, null, 2), 'seu-study-backup.json'));
$('#export-catalog').addEventListener('click', () => download(JSON.stringify(courses(), null, 2), 'courses.json'));
$('#import-backup').addEventListener('change', async e => {
  const file = e.target.files[0]; if (!file) return;
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error('备份文件不能超过 5 MB。');
    const imported = validateState(JSON.parse(await file.text()));
    validateCourses(mergeCourses(base, imported.customCourses));
    if (!window.confirm('导入将替换当前浏览器中的学习记录，包括笔记、进度和新增课程。建议先导出当前备份。确定继续吗？')) return;
    state = imported; const saved = save(); $('#backup-dialog').close(); route();
    if (saved) toast('学习备份已恢复');
  } catch (error) { $('#backup-error').textContent = error instanceof SyntaxError ? '文件不是有效的 JSON 备份。' : error.message; }
  finally { e.target.value = ''; }
});
window.addEventListener('hashchange', route);
window.addEventListener('storage', e => {
  if (e.key !== STORAGE_KEY || !e.newValue) return;
  try { state = validateState(JSON.parse(e.newValue)); if (current && getCourse(current)) renderDetail(getCourse(current)); else renderHome(); toast('已同步此浏览器其他标签页的学习记录'); } catch { /* Ignore invalid external writes. */ }
});

async function init() {
  try {
    const response = await fetch('./data/courses.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    base = validateCourses(await response.json());
  } catch {
    $('#main').innerHTML = '<div class="empty"><h1>课程目录暂时无法加载</h1><p>请检查网络后刷新。若在本地预览，请通过 HTTP 服务打开网站。</p><button class="button primary" id="retry">重新加载</button></div>';
    $('#retry').addEventListener('click', () => location.reload()); return;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = validateState(JSON.parse(raw));
  } catch {
    storageAvailable = false;
    // Keep the original stored value intact until the user makes a new edit.
    toast('原有学习记录无法读取，当前显示初始课程。');
  }
  route();
}
init();
