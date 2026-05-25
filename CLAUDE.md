# RESLERI-LS

## 不可修改的组件

以下组件已完善，**除非用户明确要求**，否则不得修改：

- `src/components/StarIcon.vue` — 星星图标（45x45 容器、per-type 像素偏移）
- `src/components/StarsDisplay.vue` — 星星展示行（transform: scale() 缩放排列）
- `src/components/IconDisplay.vue` — 图标覆盖（left/right 定位）
- `src/components/AvatarDisplay.vue` — 头像组件（SVG 背景 + 渐变遮罩 + 角色图 + 覆盖图标 + 初始星星）

## 技术栈

- Vue 3 + Composition API (`<script setup>`)
- Vite 构建，`base: './'`（GitHub Pages）
- Vue Router (Hash History)
- CSS 变量系统（`src/styles/global.css`）
- Node.js CommonJS 脚本（`.cjs`）

## 构建与部署

- `npx vite build` — 构建到 `dist/`
- `npm run prepare-data` — 运行数据流水线
- GitHub Actions 自动部署 `dist/` 到 GitHub Pages
