import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateCourses, validateState, emptyState, mergeCourses, courseRecord, progress, filterCourses, safeUrl } from '../docs/assets/model.js';
const courses = JSON.parse(await readFile(new URL('../docs/data/courses.json', import.meta.url), 'utf8'));
test('catalog matches required courses in the selection sheet', () => {
  validateCourses(courses);
  assert.deepEqual(courses.map(c => [c.id, c.category, c.credits]), [
    ['MS000151','公共必修课',4], ['DB009141','专业必修课',3],
    ['MS009101','专业必修课',3], ['MS009114','专业必修课',2], ['MS009147','专业必修课',2]
  ]);
  assert.equal(courses.reduce((sum,c) => sum+c.credits, 0), 14);
});
test('progress counts only real completed tasks, including personal additions', () => {
  const c = courses[0], r = courseRecord(emptyState(), c.id);
  r.tasks.push({ id:'extra',title:'课堂补充' });
  r.done = [c.topics[0].id,c.topics[0].id,'missing','extra'];
  assert.deepEqual(progress(c,r), {done:2,total:5,percent:40});
  assert.deepEqual(progress({...c,topics:[]},courseRecord(emptyState(), c.id)), {done:0,total:0,percent:0});
});
test('search combines course names, identifiers, category and favorites', () => {
  assert.equal(filterCourses(courses,'专业必修课','人工智能',[]).length,2);
  assert.equal(filterCourses(courses,'公共必修课','人工智能',[]).length,0);
  assert.equal(filterCourses(courses,'all',' ms009101 ',[])[0].title,'算法设计与分析');
  assert.equal(filterCourses(courses,'favorites','',[courses[0].id]).length,1);
});
test('a locally created course promoted to the repository does not appear twice', () => {
  const custom = {...courses[0],id:'LOCAL101',title:'新增课程'};
  assert.equal(mergeCourses(courses,[custom]).length,6);
  assert.equal(mergeCourses([...courses,custom],[custom]).length,6);
});
test('backups preserve notes, task progress and resource links', () => {
  const state = emptyState();
  state.courseState.MS000151 = { done:['vocabulary'],notes:'# 单词\n复习',tasks:[],resources:[{id:'resource1',title:'课件',url:'https://example.com/slides.pdf'}] };
  state.favorites.push('MS000151'); state.recent='MS000151';
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(state))), state);
});
test('import rejects malformed records and prototype keys', () => {
  assert.throws(() => validateState({version:2}));
  assert.throws(() => validateState({...emptyState(),courseState:{bad:{notes:42}}}));
  const polluted = JSON.parse('{"version":1,"customCourses":[],"courseState":{"__proto__":{}},"favorites":[],"recent":null}');
  assert.throws(() => validateState(polluted));
  assert.throws(() => validateCourses([{...courses[0],id:'constructor'}]));
  assert.throws(() => validateCourses([{...courses[0],credits:-1}]));
  assert.throws(() => validateCourses([courses[0], {...courses[0],id:'ms000151'}]));
});
test('resource links reject executable URLs and embedded credentials', () => {
  for (const url of ['javascript:alert(1)','data:text/html,test','file:///tmp/foo','//example.com','https://user:pass@example.com']) assert.equal(safeUrl(url),null);
  assert.equal(safeUrl('https://example.com/a.pdf'),'https://example.com/a.pdf');
  const state = emptyState(); state.courseState.MS000151 = {done:[],notes:'',tasks:[],resources:[{id:'x',title:'x',url:'javascript:alert(1)'}]};
  assert.throws(() => validateState(state));
});
