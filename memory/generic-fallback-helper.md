---
name: generic-fallback-helper
description: 多处字段需要降级链时用辅助函数统一定义，新增字段自动覆盖
metadata:
  type: project
---

当同一数据结构的多个字段需要相同的降级逻辑（如 cn → jp → `ID:xxx`）时，定义辅助函数（如 `cnFallback(id, mapName)`）而非逐字段手写 fallback。新增字段自动获得降级链，无需手动添加。

**Why:** `resolve.cjs` 中 `buildIndexEntry` 的 6 个 CN 字段手动 `|| null` / `|| ''` 兜底，而 `buildLocalizedChar` 已用 `cnFallback` 统一降级。用户要求「通用化，避免每次有什么新字段都要添加 fallback」。引入 `cnFallback` 辅助函数后，新增 CN 字段只需一行 `cnFallback(id, mapName)`。

**How to apply:** 审查数据流水线时，发现同类字段的降级逻辑重复 2+ 次 → 提取辅助函数。辅助函数遵循项目已有的模式（如 `cnFallback` 的 cn → jp → `ID:xxx` 链），在函数所在作用域内定义即可。
