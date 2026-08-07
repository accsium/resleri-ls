# resleri-ls

レスレリ（Atelier Resleriana）角色图鉴，Vue 3 多页应用（MPA），部署于 GitHub Pages。

目标：易维护、长期可用——即使原维护者停止更新，他人也可通过更新数据文件继续运营。

## 页面

| 页面 | 文件 | 说明 |
|------|------|------|
| 角色图鉴 | `dex.html` | 角色卡片网格、筛选、排序、详情 |
| 角色收藏 | `collection.html` | 拥有标记、矩阵/顺序视图、分享码导入导出 |
| 技能一览 | `skills.html` | 全技能可排序表格，多维筛选 |
| 队长技能 | `leader-skills.html` | 队长技能表格 |
| 支援能力 | `support-abilities.html` | 支援能力表格 |
| 活动 | `events.html` | 按年份分组的活动表格 |
| 竞技场 | `contest-rotations.html` | 当期及历史竞技场周期表格 |
| 卡池一览 | `gachas.html` | 卡池表格，关联角色头像 |
| 试验 | `test.html` | 开发 TODO 清单（`config/todo.md`） |

## 技术栈

Vue 3（`<script setup>`）+ Vite 5，无路由（每页独立 HTML 入口），CSS 变量样式，GitHub Actions 自动部署。

## 快速开始

```bash
npm install
npm run dev        # 开发服务器
npm run build      # copy-public → vite build → dist/
npm run preview    # 预览构建结果
```

## 数据更新

1. 解包工具（[AtelierToolP](https://github.com/accsium/AtelierToolP)，C++ 单二进制）解包最新 masterdata 与图片，同步到 `data/raw/jp/` 与 `image/`
2. `npm run data-conversion` — 数据流水线（select → translate → resolve）→ `data/output/`
3. `npm run build` — 构建到 `dist/`
4. 提交变更并推送 main — GitHub Actions 自动部署到 GitHub Pages

## 目录结构

```
resleri-ls/
├── config/              # 手动维护的配置（构建时复制到 public/config/）
├── data/
│   ├── raw/jp/          # 原始 masterdata（已提交）
│   ├── translation/     # 翻译文件（含 untranslated/ 新增词条）
│   ├── raw_select/      # 中间产物（不提交）
│   └── output/          # 处理后数据（已提交）
├── image/               # 图片（character/gacha/memoria/misc，webp）
├── scripts/             # 数据流水线脚本（CJS，含 pipeline.json）
├── src/                 # Vue 源码（pages/ 入口 + views/ 页面 + components/ 组件）
└── *.html               # MPA 页面入口
```

## 灵感来源

- [pomucat/resleri-checker](https://github.com/pomucat/resleri-checker)
- [Nohminist/resleri](https://github.com/Nohminist/resleri)

## 许可

数据版权归 Koei Tecmo 所有。
