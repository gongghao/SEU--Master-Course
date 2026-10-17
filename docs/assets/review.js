import { safeUrl } from './model.js';
import { aiReview } from '../data/ai-review.js';

const guides = new Map([[aiReview.courseId, aiReview]]);
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export const getReview = id => guides.get(id);
export function courseTabs(id) {
  return [...(getReview(id) ? [['review','复习讲义']] : []), ['outline','复习清单'], ['notes','我的笔记'], ['resources','课程资料']];
}
export function matchesSection(section, query) {
  return JSON.stringify(section).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}
export function renderSources(guide) {
  return `<div class="review-sources">${guide.sources.map(s => `<a class="source-card" href="${esc(s.path)}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">↗</span><span><strong>${esc(s.title)}</strong><small>${esc(s.description)}</small></span></a>`).join('')}</div>`;
}
function renderBlock(block) {
  const title = `<h4>${esc(block.heading)}</h4>`;
  switch (block.kind) {
    case 'links': return `${title}<ul class="study-references">${block.items.map(item => `<li><a href="${esc(safeUrl(item.url) || '#')}" target="_blank" rel="noopener noreferrer">${esc(item.title)} ↗</a></li>`).join('')}</ul>`;
    case 'list': return `${title}<ul>${block.items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
    case 'formula': return `${title}<pre class="study-formula">${esc(block.text)}</pre>`;
    case 'code': return `${title}<pre class="study-code"><code>${esc(block.text)}</code></pre>`;
    case 'table': return `${title}<div class="study-table-wrap" tabindex="0" role="region" aria-label="${esc(block.heading)}"><table class="study-table"><thead><tr>${block.headers.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${block.rows.map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    case 'flow': return `${title}<div class="study-flows">${block.paths.map(path => `<ol class="study-flow">${path.map(item => `<li>${esc(item)}</li>`).join('')}</ol>`).join('')}</div>`;
    default: throw new Error(`Unknown study block: ${block.kind}`);
  }
}
export function renderStudyGuide(guide, record) {
  return `<div class="study-intro"><span class="eyebrow">FROM OUTLINE TO UNDERSTANDING</span><h2>${esc(guide.title)}</h2><p>${esc(guide.description)}</p><div class="study-meta"><span>${guide.sections.length} 项提纲</span><span>${guide.sections.reduce((sum,s) => sum+s.questions.length,0)} 道自测</span><span>整理于 ${esc(guide.updated)}</span></div></div>
    <p class="guidance">${esc(guide.provenance)}</p>${renderSources(guide)}
    <div class="study-tools"><label class="study-search">查找知识点<input type="search" id="study-search" placeholder="试试 A*、归一化、LoRA…"></label><button class="button secondary" data-study-expand="true">展开全部</button><button class="button secondary" data-study-expand="false">收起全部</button><button class="button secondary" id="download-guide">导出讲义 .md ↓</button></div>
    <details class="study-index"><summary>章节目录 · 按原提纲顺序定位</summary><nav class="study-toc" aria-label="复习讲义章节导航">${guide.sections.map(s => `<button data-study-goto="${s.id}"><span>${String(s.number).padStart(2,'0')}</span>${esc(s.title)}</button>`).join('')}</nav></details>
    <p id="study-results" class="muted" aria-live="polite">共 ${guide.sections.length} 项 · 点击章节展开；自测题先思考，再查看参考答案。</p>
    <div class="study-sections">${guide.sections.map(s => `<details class="review-section" id="section-${s.id}" ${s.number === 1 ? 'open' : ''}><summary><span class="study-number">${String(s.number).padStart(2,'0')}</span><span>${esc(s.title)}<small>提纲第 ${s.number} 项 · PDF 第 ${esc(s.page)} 页</small></span><span class="study-chevron" aria-hidden="true">＋</span></summary><div class="study-body">${s.note ? `<p class="study-source-note">${esc(s.note)}</p>` : ''}${s.blocks.map(renderBlock).join('')}<div class="study-quizzes"><h4>合上资料，试着回答</h4>${s.questions.map(q => `<details class="study-quiz"><summary>${esc(q.question)}<small>展开参考答案</small></summary><p>${esc(q.answer)}</p></details>`).join('')}</div><div class="task review-check ${record.done.includes(s.id) ? 'completed' : ''}"><input type="checkbox" data-task="${s.id}" id="study-check-${s.id}" ${record.done.includes(s.id) ? 'checked' : ''}><label for="study-check-${s.id}">已复习第 ${s.number} 项，能够独立解释与作答</label></div></div></details>`).join('')}</div>`;
}
export function guideToMarkdown(guide) {
  const lines = [`# ${guide.title}`, '', guide.provenance, '', `整理日期：${guide.updated}`, '', '## 原始资料', ''];
  for (const s of guide.sources) lines.push(`- ${s.title}：${s.path.replace('./materials/ai/','./')}`, '');
  for (const s of guide.sections) {
    lines.push(`## ${s.number}. ${s.title}`, '', `来源：PDF 第 ${s.page} 页。${s.note}`, '');
    for (const b of s.blocks) {
      lines.push(`### ${b.heading}`, '');
      if (b.kind === 'links') lines.push(...b.items.map(item => `- [${item.title}](${item.url})`));
      if (b.kind === 'list') lines.push(...b.items.map(item => `- ${item}`));
      if (b.kind === 'formula' || b.kind === 'code') lines.push('```text', b.text, '```');
      if (b.kind === 'flow') lines.push(...b.paths.map(path => `- ${path.join(' → ')}`));
      if (b.kind === 'table') {
        const row = cells => `| ${cells.map(c => c.replaceAll('|','\\|').replaceAll('\n','<br>')).join(' | ')} |`;
        lines.push(row(b.headers), row(b.headers.map(() => '---')), ...b.rows.map(row));
      }
      lines.push('');
    }
    lines.push('### 自测与参考答案', '');
    for (const q of s.questions) lines.push(`**问：${q.question}**`, '', `答：${q.answer}`, '');
  }
  return lines.join('\n');
}
