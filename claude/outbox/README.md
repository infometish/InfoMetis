# Outbox

This directory contains cross-repository tasks awaiting distribution.

## File Format
- **Filename**: `YYYY-MM-DDTHH-MM-SS-sssZ_target-repo_task-name.md`
- **Content**: Standardized task format with metadata header

## Workflow Integration
- Tasks created here via `task sesame` (TASK_CREATE workflow)
- Tasks distributed via `outbox sesame` (OUTBOX workflow)
- Tasks processed at target via `inbox sesame` (INBOX workflow)

## Status
- Files in this directory are **pending distribution**
- Files are moved during OUTBOX workflow execution
- Empty directory indicates all tasks have been distributed