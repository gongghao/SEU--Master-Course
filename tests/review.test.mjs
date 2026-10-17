import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { aiReview } from '../docs/data/ai-review.js';
import { getReview, courseTabs, renderStudyGuide, guideToMarkdown, matchesSection } from '../docs/assets/review.js';
import { courseRecord, progress, validateState } from '../docs/assets/model.js';
const catalog=JSON.parse(await readFile(new URL('../docs/data/courses.json',import.meta.url),'utf8'));
const ai=catalog.find(c=>c.id==='MS009147');

test('all 24 source items map to exactly one checklist item with source pages and self-tests',()=>{
  assert.deepEqual(aiReview.sections.map(s=>s.number),Array.from({length:24},(_,i)=>i+1));
  assert.deepEqual(ai.topics.map(t=>t.id),aiReview.sections.map(s=>s.id));
  assert.equal(new Set(ai.topics.map(t=>t.id)).size,24);
  for (const s of aiReview.sections) {
    assert.match(s.page,/^\d+(?:–\d+)?$/);
    assert.ok(s.blocks.length>0 && s.questions.length>0);
    for (const b of s.blocks) {
      assert.ok(['list','formula','code','flow','table','links'].includes(b.kind));
      if(b.kind==='table') assert.ok(b.rows.every(row=>row.length===b.headers.length));
    }
  }
});
test('old AI notes, custom tasks and resource links survive without crediting old generic checks',()=>{
  const old={version:1,customCourses:[],favorites:['MS009147'],recent:'MS009147',courseState:{MS009147:{done:['search','reasoning'],notes:'自己的旧笔记',tasks:[{id:'my-task',title:'课堂补充'}],resources:[{id:'link',title:'我的资料',url:'https://example.com/'}]}}};
  const imported=validateState(JSON.parse(JSON.stringify(old)));
  const r=courseRecord(imported,ai.id);
  assert.equal(r.notes,'自己的旧笔记');
  assert.deepEqual(progress(ai,r),{done:0,total:25,percent:0});
  r.done.push('ai-01');
  assert.deepEqual(progress(ai,r),{done:1,total:25,percent:4});
  assert.equal(r.resources.length,1);
});
test('guide navigation is course-specific and keyword search covers explanations and algorithms',()=>{
  assert.equal(getReview('MS000151'),undefined);
  assert.equal(courseTabs('MS000151').length,3);
  assert.equal(courseTabs('MS009147')[0][0],'review');
  assert.ok(matchesSection(aiReview.sections[3],' A* '));
  assert.ok(matchesSection(aiReview.sections[23],'RMSNorm'));
  assert.ok(matchesSection(aiReview.sections[12],'lora'));
  assert.equal(matchesSection(aiReview.sections[0],'impossible-query'),false);
});
test('renderer escapes lecture and code text and keeps answers expandable',()=>{
  const clone=structuredClone(aiReview);
  clone.sections[0].blocks=[{kind:'code',heading:'示例',text:'<script>alert(1)</script>'}];
  const html=renderStudyGuide(clone,{done:['ai-01']});
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.equal((html.match(/class="study-quiz"/g)||[]).length,29);
  assert.ok(html.includes('id="study-check-ai-01" checked'));
});
test('original resources exist and checked-in Markdown matches the web content',async()=>{
  for(const source of aiReview.sources){
    const path=new URL('../docs/'+source.path.replace(/^\.\//,''),import.meta.url);
    assert.ok((await stat(path)).size>20000);
  }
  const markdown=await readFile(new URL('../docs/materials/ai/study-guide.md',import.meta.url),'utf8');
  assert.equal(markdown,guideToMarkdown(aiReview));
  assert.equal((markdown.match(/^## \d+\./gm)||[]).length,24);
});
