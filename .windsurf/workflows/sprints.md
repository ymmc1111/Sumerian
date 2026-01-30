---
description: How to run sprints for Sumerian development
---

# Sprint Workflow

## Overview
This workflow defines how to execute development sprints for the Sumerian Vibe-Runner IDE project.

## Before Starting a Sprint

1. Read the sprint document in `docs/sprints/sprint-XX.md`
2. Review `Agent.md` for project rules and constraints
3. Ensure all dependencies from the previous sprint are complete

## During a Sprint

1. Work on **ONE task at a time** from the sprint checklist
2. For each task:
   - Propose changes before implementing
   - Wait for user approval
   - Implement the change
   - Verify with build/test commands
   - Mark task complete only after user confirms
3. Update the sprint document with progress after each task

## After Completing a Sprint

1. Run full test suite: `npm test`
2. Run build verification: `npm run build`
3. Update `Agent.md` session summary
4. Create PR or commit with sprint summary

## Sprint Documents Location

All sprint documents are located in: `docs/sprints/`

---

*See individual sprint files for task details.*
