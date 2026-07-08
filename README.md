# resleri-ls

レスレリ（Atelier Resleriana）角色图鉴，基于 Vue 3 的纯前端单页应用，部署于 GitHub Pages。

目标：易维护、长期可用——即使原维护者停止更新，他人也可通过更新数据文件继续运营。

## 页面

| 页面 | 路由 | 说明 |
|------|------|------|
| 角色图鉴 | `/dex` | 角色卡片网格、分页、排序、多维筛选（属性/类型/词条/标签/卡池）、角色详情 |
| 角色收藏 | `/collection` | 拥有/未拥有标记、矩阵/顺序双视图、分享码导入导出 |
| 技能一览 | `/skills` | 全技能可排序表格，按属性/种类/状态/对象筛选 |
| 队长技能 | `/leader-skills` | 队长技能可排序表格 |
| 支援能力 | `/support-abilities` | 支援能力可排序表格 |
| 活动 | `/events` | 按年份分组的历史活动可排序表格 |
| 竞技场 | `/contest-rotations` | 当期及历史竞技场周期可排序表格 |
| 卡池一览 | `/gachas` | 卡池列表可排序表格，关联角色头像 |
| 试验 | `/test` | 开发 TODO 清单（`config/todo.md`） |

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 + Composition API（`<script setup>`） |
| 构建 | Vite 5 |
| 路由 | Vue Router 4（Hash 模式） |
| 样式 | CSS 变量 + 单文件组件 `<style scoped>` |
| 国际化 | 中日双语（`useI18n.js`） |
| Markdown | marked |
| 部署 | GitHub Pages（`base: './'`） |

## 本地运行

```bash
npm install
npm run dev              # 开发服务器（HMR，需要先跑一次 build 生成 public/）

npm run data-conversion  # 数据流水线 → data/output/
npm run build            # copy-public → vite build → dist/
npm run preview          # 预览构建结果
```

## 数据流水线

原始 masterdata 存放于 `data/raw/jp/`（已提交到仓库）。`hyperlink.json` 用于解析技能描述中的 `{hyperlink_id N}` 引用。通过三级流水线生成最终数据：

```
npm run data-conversion
  ├── rm -rf data/output/ data/selection/            （清理上次产物）
  ├── npm run selection     → scripts/select.cjs     （文件筛选 → data/selection/）
  ├── npm run prepare-data  → scripts/translate.cjs  （翻译处理，读取 data/selection/ 和 data/language/）
  └── npm run data          → scripts/resolve.cjs    （关系解析 + 输出 → data/output/）
```

- `data/selection/` — 中间产物，不提交（`.gitignore` 排除）
- `data/language/` — 翻译文件（JSON），含 `untranslated/` 子目录存放新增未翻译词条
- `data/output/` — 最终数据，提交到仓库：

| 文件 | 说明 |
|------|------|
| `character_index.json` | 角色列表 + 详情（纯 ID 引用，无 `_ja/_cn` 名称对） |
| `skills.json` | 技能规范表（按 skill_id 索引，description 已 bake） |
| `abilities.json` | 能力规范表（按 ability_id 索引） |
| `trait_color.json` | 特性/辅助色名称 |
| `base_character.json` | 基础角色名称 |
| `original_title.json` | 作品出处名称 |
| `character_tag.json` | 标签 |
| `battle_tool_trait.json` | 战斗道具词条 |
| `equipment_tool_trait.json` | 装备词条 |
| `events.json` | 活动列表 |
| `contest_rotations.json` | 竞技场周期 |

辅助脚本：`resolveConfig.cjs`（配置解析）、`safeReadJSON.cjs`（安全 JSON 读取）。

## 数据更新

1. 使用解包工具获取最新 masterdata 及角色头像（参考 [NGA 教程](https://bbs.nga.cn/read.php?tid=39869227)）
2. 将 masterdata 的 `jp/` 文件夹内容复制到 `data/raw/jp/`，覆盖已有文件
3. 角色头像（`*_FACE_M.png`）改名为角色 ID（如 `10101.png`），放入 `image/character/`
4. 检查 `config/` 下配置文件是否需要更新（新增角色类型、变身角色等）
5. 运行 `npm run data-conversion && npm run build`
6. 确认 `data/output/` 变更已提交，推送到 main 分支

> 推送后 GitHub Actions 自动构建并部署 `dist/` 到 GitHub Pages。

## 构建流程

```bash
npm run build
  ├── rm -rf public/              # 清理上次临时目录
  ├── npm run copy-public         # scripts/copy-public.cjs：
  │   ├── config/ → public/config/（白名单复制）
  │   ├── image/   → public/image/
  │   └── data/output/ → public/data/
  └── vite build                  # Vite 构建，public/ 自动合并到 dist/
```

`public/` 为构建临时目录，由 `.gitignore` 排除，每次构建开始时清理。

## 配置文件

`config/` 下的文件手动维护，构建时复制到 `public/config/` 供前端访问：

| 文件 | 用途 |
|------|------|
| `announcements.json` | 公告，按需添加 |
| `atelier_fes.json` | 白票/星祈石卡池范围（最早和最后角色加入日期） |
| `ex_skill_rules.json` | EX 技能例外处理规则，新机制出现时手动添加 |
| `exclude.json` | 不显示的模板角色 ID |
| `permanent_exclude.json` | 非恒常角色 ID（联动、追忆角色），新非恒常角色出现时添加 |
| `pipeline.json` | 数据流水线配置（定义筛选文件含 hyperlink.json、翻译映射），无新增数据源时无需改动 |
| `transform.json` | 变身角色映射，格式 `[[变身前ID, 变身后ID], ...]` |
| `todo.md` | 试验页 TODO 清单 |

## 目录结构

```
resleri-ls/
├── config/                # 配置文件（手动维护）
├── data/
│   ├── raw/jp/            # 原始 masterdata（已提交）
│   ├── language/          # 翻译文件 + untranslated/
│   ├── selection/         # 中间产物（不提交）
│   └── output/            # 处理后数据（已提交）
├── image/
│   ├── character/         # 角色头像（以角色 ID 命名的 PNG）
│   └── misc/              # 杂项图标（属性、星标等）
├── scripts/               # 数据流水线脚本（CJS）
├── src/                   # Vue 源码
│   ├── views/             # 页面组件
│   ├── components/        # 通用组件
│   ├── composables/       # 状态共享
│   ├── utils/             # 工具函数（date、sort）
│   ├── styles/            # 全局样式
│   └── router/            # 路由定义
├── public/                # 构建临时目录（不提交）
├── dist/                  # 构建输出（仅构建产物，本地 build 后生成，不提交，CI 部署）
└── .github/workflows/     # CI 配置（push main 自动部署）
```

## 灵感来源

- [pomucat/resleri-checker](https://github.com/pomucat/resleri-checker)
- [Nohminist/resleri](https://github.com/Nohminist/resleri)

## 许可

数据版权归 Koei Tecmo 所有。
