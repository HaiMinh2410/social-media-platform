# 🧠 ANTIGRAVITY v1 — GEMINI LOADER
# Routing table only. Chi tiết → .antigravity/runtime/

---

## BOOT SEQUENCE

On session start:

1. Read `.antigravity/memory/memory_state.json`
2. Check `session_intent.mode` → apply if set
3. Check `session_intent.flow_mode` → notify if true: "⚡ Flow mode is ON from last session"
4. Classify intent from user's first message (see INTENT ROUTING below)
5. IF intent requires FULL CONTEXT → load `.antigravity/runtime/memory-guard.md` + memory_core + memory_issues + last 5 decisions.log entries
6. Confirm boot:
   - PASS:  "✅ Antigravity loaded — [project] | Task: [task] | Mode: [mode] | Progress: [n]%"
   - WARN:  "⚠️ Antigravity loaded with warnings — [details]"
   - BLOCK: "❌ Memory corrupt — action required."

> memory_core is NOT loaded at boot unless intent requires FULL CONTEXT.
> If any memory file is missing → notify user, do NOT crash.

---

## INTENT ROUTING

Classify intent → load runtime file → follow its instructions.


| Intent | Triggers | Runtime file | Memory tier |
|---|---|---|---|
| STATUS | "status", "tiến độ", "what's next" | `runtime/intent-rules.md` § STATUS | **MINIMAL** |
| STATUS-TODAY | "hôm nay làm gì", "today", "summary hôm nay" | `runtime/intent-rules.md` § TODAY | **MINIMAL** |
| IDEA | "ghi lại ý tưởng", "idea:", "note:", "nhớ là" | `runtime/idea-log.md` | **NONE** |
| HOTFIX | paste error, "fix nhanh", hotfix keywords | `runtime/intent-rules.md` § HOTFIX | **HOTFIX** |
| EXECUTE (fast) | "run T005 --fast", small task | `workflows/task.workflow.md` | **STANDARD** |
| REVIEW | "review T005", "check this code" | `agents/reviewer.agent.md` | **REVIEW** |
| PREVIEW | "preview T005", "T005 làm gì" | `runtime/preview.md` | **STANDARD** |
| EXPERIMENT | "thử xem", "experiment" | `workflows/experiment.workflow.md` | **STANDARD** |
| EXECUTE (full) | "run T005", medium/large task | `workflows/task.workflow.md` | **FULL** |
| DEBUG | "debug", "tại sao X", complex trace | `workflows/debug.workflow.md` | **REVIEW** → auto **FULL** nếu major |
| PLAN | "plan X", "break down", "tạo task list" | `workflows/plan.workflow.md` | **FULL** |
| AUGMENT | "thêm X vào", "augment T005" | `workflows/augment.workflow.md` | **FULL** |
| CONSULT | "hỏi architect", "nên dùng pattern nào" | direct agent call | **FULL** |
| PIVOT | "pivot sang X", "đổi approach" | `workflows/pivot.workflow.md` | **FULL** |
| UNCLEAR | cannot classify | Ask ONE clarifying question | — |
| ADHOC | "viết README", "generate changelog", "tóm tắt task", bất kỳ lệnh một lần không fit intent khác | direct LLM call, không workflow, không agent | MINIMAL |

For full intent recognition rules (keyword tables, edge cases, hotfix vs debug decision tree):
→ Read `.antigravity/runtime/intent-rules.md`

---

## MEMORY CONTEXT LEVELS

| Level  | Load what                                                                                                    | Used for                                    |
|--------|--------------------------------------------------------------------------------------------------------------|---------------------------------------------|
| NONE   | nothing                                                                                                      | IDEA                                        |
| MINIMAL| `memory_state.json` + decisions.log (last 1 entry only)                                                      | STATUS, STATUS-TODAY                        |
| HOTFIX | `constraints.md` + `coding_rules.md` + affected file from stack trace                                        | HOTFIX                                      |
| STANDARD| `memory_state.json` + `constraints.md` + `coding_rules.md`                                                  | EXECUTE FAST, PREVIEW                       |
| REVIEW | `constraints.md` + `coding_rules.md` + architecture rules from memory_core + task context                    | REVIEW, DEBUG                               |
| FULL   | `memory_core.json` + `memory_state.json` + last 3 decisions + `constraints.md` + `coding_rules.md` + `PROJECT_INTENT.md` | EXECUTE FULL, PLAN, AUGMENT, CONSULT, PIVOT       |

RULE: Never ask user to paste memory manually.
RULE: Always load context from files before executing.
RULE: STATUS và STATUS-TODAY KHÔNG inject constraints.md — chỉ cần memory_state.
RULE: HOTFIX KHÔNG inject memory_state.json — không liên quan đến task context.
RULE: DEBUG tự upgrade từ STANDARD → FULL nếu severity = major.
---

## SESSION MODES & MODIFIERS

→ Full details: `.antigravity/runtime/session-modes.md`

Modes: `ship` (default) | `explore` | `refactor`
Store in: `memory_state.session_intent.mode`

Common modifiers: --fast, --full, --skip-review, --patch, --flow-mode, --flow-mode-off
→ Full modifier table: `.antigravity/runtime/intent-rules.md` § MODIFIERS

---

## STATUS & TODAY OUTPUT FORMAT

→ Full format specs: `.antigravity/runtime/status-format.md`

---

## SESSION PRINCIPLES

1. One task at a time — never parallelize execution
2. Always review output — human stays in the loop
3. Memory is truth — never proceed without loading it
4. Intent over syntax — understand what the user means
5. Minimal friction — the system adapts to the user, not vice versa