# 知序 · SEU 课程复习空间

东南大学计算机科学与工程学院研究生课程复习网站。纯 HTML、CSS、JavaScript，无构建依赖，适合 GitHub Pages。

## 已收录课程

根据提供的 2026–2027 学年秋季选课表，仅纳入公共必修课与专业必修课，共 5 门、14 学分。

| 类别 | 课程编号 | 课程名称 | 学分 |
| --- | --- | --- | --- |
| 公共必修课 | MS000151 | 学位英语 | 4 |
| 专业必修课 | DB009141 | 人工智能算法设计的形式化思维与方法 | 3 |
| 专业必修课 | MS009101 | 算法设计与分析 | 3 |
| 专业必修课 | MS009114 | 计算机网络体系结构 | 2 |
| 专业必修课 | MS009147 | 人工智能 | 2 |

人工智能课程已依据用户提供的《期末复习提纲.pdf》和《复习.docx》补充为 24 项复习讲义，并保存原始资料。其他课程的预设清单仍是根据课程名称整理的**建议框架**。仓库不包含原始选课表或学生学号。

## 功能

- 主页课程卡片、按类别筛选、课程名称/编号搜索、收藏和最近学习入口。
- 每门课程的复习清单、个人补充条目、完成进度、笔记和资料链接。
- 笔记自动保存，可导出 Markdown 文本。
- 网页表单添加新课程；课程由 JSON 配置驱动，无需修改页面结构。
- 完整学习备份的导出/导入；课程目录可单独导出用于更新仓库。
- 适配手机和桌面，支持键盘导航和系统减少动态效果偏好。

## 人工智能复习内容

进入“人工智能”会默认打开“复习讲义”。对应 PDF 的全部 24 项，包括搜索与群体优化、逻辑与概率推理、深度学习、Transformer、强化学习、大模型技术、AI 系统和论述题。

- 24 项章节导航、全文关键词筛选、公式与手算例子、算法伪代码、结构流程图和对照表。
- 29 道自测题，参考答案默认折叠；每节标注原 PDF 页码。
- 讲义中的“已复习”与“复习清单”同步，沿用原有浏览器存储与备份机制。
- 原始 PDF / Word 可从“复习讲义”或“课程资料”打开；整理讲义可导出 Markdown。
- 政策题已补充官方来源与比较要点，并区分事实、归纳和建议；南京正式纲要附件仍待核对，采用官方发布会解读并明确标注。具体前沿报告与个人体验需自行补充。讲解与自测答案为整理补充，并非教师标准答案。

旧版四个通用复习条目的勾选不会自动映射成新章节已掌握。原有笔记、收藏、自建条目与资料链接保留，新内容需重新核对后勾选。

维护入口：`docs/data/ai-review.js` 为讲义内容；`docs/assets/review.js` 为通用讲义渲染与 Markdown 导出；`docs/materials/ai/` 保存原始文件和可下载讲义。修改内容后同步生成 Markdown：

```bash
node --input-type=module - <<'JS'
import { writeFile } from 'node:fs/promises';
import { aiReview } from './docs/data/ai-review.js';
import { guideToMarkdown } from './docs/assets/review.js';
await writeFile('docs/materials/ai/study-guide.md', guideToMarkdown(aiReview));
JS
npm test
```

新增/删除章节时，同步更新 `docs/data/courses.json` 中人工智能的 `topics`，保留已有章节 ID。其他课程可按相同结构添加讲义并注册到 `review.js`。

## 部署到 GitHub Pages

首次配置：

1. 将这些文件提交到本仓库的 `main` 分支。
2. 打开仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
3. 在 **Actions** 中运行 **Deploy study space to GitHub Pages**，或提交一次 `docs/` 目录的修改触发部署。
4. 工作流成功后，访问 `https://gongghao.github.io/SEU--Master-Course/`。此地址是预期部署地址，是否上线以 GitHub Actions 结果为准。

工作流会先运行数据和状态逻辑测试，再上传 `docs/` 静态目录。所有页面资源使用相对路径，课程通过 hash 路由打开，适用于仓库子路径，详情页刷新无需服务器重写规则。

也可在 Pages 中选择 **Deploy from a branch**，使用 `main` 分支的 `/docs` 目录；此时应停用 `.github/workflows/pages.yml`，避免重复部署。

## 本地运行

需要 Python 3；测试另外需要 Node.js 18 或更新版本。无需 `npm install`。

```bash
npm run preview
# 浏览器打开 http://localhost:4173
npm test
```

或直接运行 `python3 -m http.server 4173 --directory docs`。不要双击 HTML 使用 `file://` 打开，因为浏览器通常会阻止读取课程 JSON。

## 添加课程

### 方式一：使用网页

点击“添加课程”，填写课程信息和每行一条的复习清单。此时课程仅存在于当前浏览器。要发布到网站，打开“数据与备份 → 导出课程配置”，用导出的 `courses.json` 替换仓库的 `docs/data/courses.json` 并提交。

仓库课程和浏览器课程按编号合并，同一课程发布后不会重复显示。编号不区分大小写；长期维护请保留课程编号和复习条目 ID，以免已有进度无法对应。

### 方式二：编辑配置

在 `docs/data/courses.json` 数组末尾加入一个对象：

```json
{
  "id": "MS009999",
  "title": "新课程名称",
  "category": "专业必修课",
  "credits": 2,
  "semester": "2026–2027 秋季",
  "description": "课程简介",
  "symbol": "◇",
  "color": "mint",
  "topics": [{ "id": "chapter-1", "title": "第一章复习" }],
  "resources": [{ "id": "slides-1", "title": "第一章课件", "url": "https://example.com/slides.pdf" }]
}
```

`category` 可选 `公共必修课`、`专业必修课`；`color` 可选 `mint`、`sand`、`lavender`、`blue`、`rose`。课程编号和条目 ID 使用不超过 40 位的字母、数字、下划线或短横线；每份课程配置最多 200 门，每门课程最多 200 个预设条目。

资料仅支持 HTTP/HTTPS 链接。可先将可公开的课件放到 `docs/materials/`，再使用部署后的完整链接；或添加已有在线资料链接。用户自行添加资料的表单仅保存链接，不提供服务端文件上传或账号系统；本次提供的人工智能原始资料已随网站静态文件发布。

## 数据存储与备份

个人笔记、进度、收藏、补充条目、资料链接及新增课程保存在浏览器 `localStorage`，键名为 `seu-study-space-v1`。它们不会自动上传 GitHub，也不会在不同设备或不同网站域名之间同步。清理浏览器数据、使用无痕模式或更换浏览器时可能丢失，因此请定期导出完整学习备份。

导入备份会提示确认，并替换当前浏览器的学习记录。导入前会检查数据格式、大小与链接协议；建议先导出旧数据。课程配置仅包含课程目录及预设清单，不包含个人笔记、进度或个人追加的资料链接。要让个人补充条目/资料成为所有访问者可见的预设内容，请自行整理到课程 JSON。

## 目录

```text
docs/
  index.html             网页入口
  data/courses.json      课程目录与预设清单
  assets/app.js          页面与交互
  assets/model.js        数据校验、进度计算与筛选
  assets/style.css       响应式样式
  assets/favicon.svg     网站图标
tests/model.test.mjs     课程数据与状态逻辑测试
.github/workflows/pages.yml  GitHub Pages 自动部署
```

本项目为个人复习整理工具，非学校官方网站。
