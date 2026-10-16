export const STORAGE_KEY = 'seu-study-space-v1';
export const CATEGORIES = ['公共必修课', '专业必修课'];
export const COLORS = ['mint', 'sand', 'lavender', 'blue', 'rose'];
const ID = /^[A-Za-z0-9_-]{1,40}$/;
const forbidden = new Set(['__proto__', 'constructor', 'prototype']);
const validId = value => typeof value === 'string' && ID.test(value) && !forbidden.has(value);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const string = (value, max = 300) => typeof value === 'string' && value.length <= max;

export function safeUrl(value) {
  if (typeof value !== 'string' || value.length > 2048 || !value.trim()) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function validTasks(tasks) {
  return Array.isArray(tasks) && tasks.length <= 200 &&
    tasks.every(t => isObject(t) && validId(t.id) && string(t.title, 300) && t.title.trim()) &&
    new Set(tasks.map(t => t.id)).size === tasks.length;
}
function validResources(resources) {
  return Array.isArray(resources) && resources.length <= 200 && resources.every(r =>
    isObject(r) && validId(r.id) && string(r.title, 150) && r.title.trim() && safeUrl(r.url)) &&
    new Set(resources.map(r => r.id)).size === resources.length;
}

export function validateCourses(courses) {
  if (!Array.isArray(courses) || courses.length > 200) throw new Error('课程配置应为最多 200 门课程的列表。');
  for (const c of courses) {
    if (!isObject(c) || !validId(c.id) || !string(c.title, 100) || !c.title.trim() ||
      !CATEGORIES.includes(c.category) || !Number.isFinite(c.credits) || c.credits < 0 || c.credits > 30 ||
      !string(c.semester, 60) || !c.semester.trim() || !string(c.description) ||
      !COLORS.includes(c.color) || !string(c.symbol, 10) || !validTasks(c.topics) || !validResources(c.resources)) {
      throw new Error('课程配置不完整或格式不正确，请检查课程字段。');
    }
  }
  if (new Set(courses.map(c => c.id.toLowerCase())).size !== courses.length) throw new Error('课程编号不能重复。');
  return courses;
}

export function emptyState() {
  return { version: 1, customCourses: [], courseState: {}, favorites: [], recent: null };
}

export function validateState(data) {
  if (!isObject(data) || data.version !== 1) throw new Error('不支持此备份格式，请选择本网站导出的学习备份。');
  validateCourses(data.customCourses);
  if (!isObject(data.courseState) || Object.keys(data.courseState).length > 400 ||
    !Array.isArray(data.favorites) || data.favorites.length > 400 || !data.favorites.every(validId) ||
    !(data.recent === null || validId(data.recent))) throw new Error('备份中的学习记录格式不正确。');
  for (const [id, record] of Object.entries(data.courseState)) {
    if (!validId(id) || !isObject(record) || !Array.isArray(record.done) || record.done.length > 400 ||
      !record.done.every(validId) || !string(record.notes, 200000) || !validTasks(record.tasks) ||
      !validResources(record.resources)) throw new Error('备份中的笔记、清单或资料格式不正确。');
  }
  // Copy only supported fields to discard unexpected properties in imported data.
  return { version: 1, customCourses: data.customCourses, courseState: data.courseState,
    favorites: [...new Set(data.favorites)], recent: data.recent };
}

export function mergeCourses(base, custom) {
  const map = new Map(base.map(c => [c.id.toLowerCase(), c]));
  for (const c of custom) if (!map.has(c.id.toLowerCase())) map.set(c.id.toLowerCase(), c);
  return [...map.values()];
}

export function courseRecord(state, id) {
  return state.courseState[id] || { done: [], notes: '', tasks: [], resources: [] };
}

export function progress(course, record) {
  const tasks = [...course.topics, ...record.tasks];
  const done = tasks.filter(t => record.done.includes(t.id)).length;
  return { done, total: tasks.length, percent: tasks.length ? Math.round(done / tasks.length * 100) : 0 };
}

export function filterCourses(courses, view, query, favorites) {
  const q = query.trim().toLocaleLowerCase();
  return courses.filter(c => (view === 'all' || (view === 'favorites' ? favorites.includes(c.id) : c.category === view)) &&
    `${c.title} ${c.id} ${c.semester}`.toLocaleLowerCase().includes(q));
}
