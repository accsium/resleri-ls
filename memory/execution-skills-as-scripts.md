---
name: execution-skills-as-scripts
description: type:execution 技能应转为 shell 脚本 + 薄 SKILL.md 包装
metadata:
  type: feedback
---

`type: execution` 的技能若本质是命令封装，应将逻辑放入 `.claude/scripts/xxx.sh`，SKILL.md 精简为单行脚本调用。组合型技能（如 deploy = prepare-data + build）通过脚本调用兄弟脚本实现，不在 SKILL.md 中内联重复命令。

**Why:** build、deploy、prepare-data 三个 execution 技能原本含多步骤描述和约束声明，实际仅执行单条 npm 命令。脚本化消除了技能系统中不必要的计划门控开销，脚本可直接执行。

**How to apply:** 遇到 `type: execution` 的技能时，先问「这一步能用脚本替代吗？」→ 能则创建 `.claude/scripts/xxx.sh`，SKILL.md 重写为 `运行 bash .claude/scripts/xxx.sh`。组合关系在脚本层解决（deploy.sh 调用 prepare-data.sh → build.sh），不在 SKILL.md 中重复。
