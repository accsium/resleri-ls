---
name: readme-public-claude-internal
description: README.md 是公开文档，.claude/ 是内部工具，不交叉引用
metadata:
  type: feedback
---

README.md 面向人类用户，npm scripts 是其操作界面。`.claude/scripts/` 和 `.claude/CLAUDE.md` 是 agent 内部工具，不在 README 中引用。CLAUDE.md 可以引用 `.claude/scripts/`。

**Why:** 用户纠正：将 README.md 中的 `npm run data-conversion` 改为 `bash .claude/scripts/prepare-data.sh` 后，用户指出「readme不应该修改。这个脚本不是公用的」。`.claude/` 下的脚本是 agent 专用，不应暴露给 README 读者。

**How to apply:** 修改构建/数据命令时，仅更新 `.claude/CLAUDE.md`（agent 的指令）和 SKILL.md（slash command 入口）。README.md 保持 npm scripts 作为用户界面，不做同步修改。
