# resleri-ls

レスレリ（Atelier Resleriana）角色图鉴，基于 Vue 3 的纯前端单页应用，部署于 GitHub Pages。

目标：易维护、长期可用——即使原维护者停止更新，他人也可通过更新数据文件继续运营。

## 页面

| 页面 | 路由 | 说明 |
|------|------|------|
| 角色图鉴 | `/` | 角色卡片网格、分页、排序、多维筛选（属性/类型/词条/标签/卡池）、角色详情 |
| 角色收藏 | `/collection` | 拥有/未拥有标记、矩阵/顺序双视图、分享码导入导出 |
| 技能一览 | `/skills` | 全技能可排序表格，按属性/种类/状态/对象筛选 |
| 队长技能 | `/leader-skills` | 队长技能可排序表格 |
| 支援能力 | `/support-abilities` | 支援能力可排序表格 |
| 活动 | `/events` | 按年份分组的历史活动可排序表格 |
| 竞技场 | `/contest-rotations` | 当期及历史竞技场周期可排序表格 |
| 试验 | `/test` | 开发 TODO 清单（`config/todo.md`） |

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 + Composition API (`<script setup>`) |
| 构建 | Vite 5 |
| 路由 | Vue Router 4（Hash 模式） |
| 样式 | CSS 变量 + 单文件组件 `<style scoped>` |
| 国际化 | 中日双语（`useI18n.js`） |
| 部署 | GitHub Pages（`base: './'`） |

## 本地运行

```bash
npm install
npm run dev        # 开发服务器（HMR）
npm run data-conversion   # 数据流水线
npm run build      # 生产构建 → dist/
```

## 数据流水线

原始数据在项目外 `/data_raw/`。通过三级流水线生成最终数据：

```
npm run data-conversion
  ├── npm run selection  → scripts/select.cjs  （文件筛选 → data/selection/）
  ├── npm run prepare-data → scripts/translate.cjs （翻译处理，输入 data/language/）
  └── npm run data       → scripts/resolve.cjs  （关系解析 + 输出生成 → data/output/）
```

辅助脚本：`resolveConfig.cjs`（配置解析）、`safeReadJSON.cjs`（安全读取）

## 数据更新

1. 使用解包工具获取 masterdata 及角色头像（参考 [NGA 教程](https://bbs.nga.cn/read.php?tid=39869227)）
2. 将 masterdata 的 `/jp` 文件夹复制到 `/data/raw/jp/`，覆盖已有文件
3. 角色头像（`*_FACE_M.png`）改名为角色 ID，放入 `/image/character/`
4. 运行 `npm run data-conversion && npm run build`
5. 确认 `data/output/` 变更已提交到 git
6. 部署 `dist/` 到 GitHub Pages

## 配置文件

`config/` 下的文件手动维护（构建时由 `copy-public` 复制到 `public/config/`，`public/` 为临时目录，构建结束后自动清理）：

| 文件 | 用途 |
|------|------|
| `announcements.json` | 公告，按需添加 |
| `atelier_fes.json` | 白票/星祈石的卡池范围，通过最早的角色加入日期和最后一个角色的加入日期控制 |
| `ex_skill_rules.json` | 各种 EX 技能的例外处理，由于 EX 技能实际被用于实现多种不同的机制，如果有新的机制出现需要手动加入 |
| `exclude.json` | 不显示的模板角色 ID |
| `permanent_exclude.json` | 非恒常角色 ID（联动角色、追忆角色），新非恒常角色出现时添加 |
| `pipeline.json` | data-conversion 流水线配置，无新增数据源时无需改动 |
| `transform.json` | 变身角色，格式 `[[变身前ID, 变身后ID], ...]`，如 `[[43106, 43107]]` |
| `todo.md` | 试验页 TODO 清单 |

## 灵感来源

- [pomucat/resleri-checker](https://github.com/pomucat/resleri-checker)
- [Nohminist/resleri](https://github.com/Nohminist/resleri)

## 许可

数据版权归 Koei Tecmo 所有。
