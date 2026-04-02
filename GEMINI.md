# 🧠 ANTIGRAVITY v2.6 — AI DEVELOPMENT OPERATING SYSTEM
# GEMINI CLI LOADER

---

## BOOT SEQUENCE

On every session start, automatically:

1. Read `.antigravity/memory/memory_core.json`
2. Read `.antigravity/memory/memory_state.json`
3. Read `.antigravity/memory/memory_issues.json`
4. Read `.antigravity/memory/decisions.log.jsonl` (last 5 entries)
5. Call runtime/memory-guard.md → validate all 4 memory files
6. Read session_intent from memory_state:
   - IF session_intent.mode exists → apply mode behavior (see SESSION MODES below)
   - IF session_intent.flow_mode = true → notify: "⚡ Flow mode is ON from last session"
7. Confirm boot:
   - If PASS:  "✅ Antigravity v2.6 loaded — [project] | Task: [task] | Mode: [mode] | Progress: [n]%"
   - If WARN:  "⚠️ Antigravity v2.6 loaded with warnings — [recovery details]"
   - If BLOCK: "❌ Memory corrupt — action required before continuing."

If any memory file is missing → notify user, do NOT crash.

---

## CORE PHILOSOPHY

```
You do not prompt AI.
You run a system.

You do not memorize commands.
You express intent.
```

The system interprets what you mean — not what you type.

---

## INTENT ENGINE

NEVER require exact command syntax.
ALWAYS infer intent from natural language input.

Read the user's message and classify into one of these intents:

---

### INTENT: EXECUTE
Triggers: any task execution request in any form
Examples:
- "run T005"
- "làm T005 đi"
- "execute auth task"
- "tiếp tục task hiện tại"
- "build the login form"
- "T005"

→ Route to: `workflows/task.workflow.md`
→ Extract: task_id or task_description from input
→ Extract: modifiers (see MODIFIERS section)

---

### INTENT: HOTFIX
Triggers: lỗi nhanh, đơn giản, không cần phân tích kiến trúc

**Nhận diện theo keyword trong error message:**
| Keyword | hotfix_type |
|---|---|
| `Cannot find module`, `Module not found`, `ERR_MODULE_NOT_FOUND`, `has no exported member` | import |
| `SyntaxError`, `Unexpected token`, `Unexpected identifier`, `Unterminated` | syntax |
| `is not a function`, `deprecated`, `does not provide an export` | library |
| `is not assignable to type`, `Property does not exist on type` (1 file) | type |
| `process.env` undefined, `NEXT_PUBLIC_` missing, `environment variable` | env |
| `tsconfig`, `eslint parse error`, `next.config` misconfiguration | config |

**Nhận diện theo cách user diễn đạt:**
- "fix nhanh", "sửa nhanh", "quick fix", "hotfix"
- "lỗi import", "lỗi syntax", "lỗi thư viện", "lỗi type"
- "sửa cái lỗi này thôi"
- paste error message thuần túy không có mô tả thêm

**KHÔNG dùng hotfix nếu:**
- Lỗi liên quan DB, auth, RLS, session
- Lỗi xuất hiện ở nhiều file (> 3)
- Root cause chưa rõ sau khi đọc error message
- User mô tả lỗi logic nghiệp vụ

→ Route to: `workflows/hotfix.workflow.md`
→ Extract: error_message + file path nếu có trong stack trace
→ classifier.md xác định hotfix_type chính xác

---

### INTENT: DEBUG
Triggers: lỗi phức tạp, logic sai, cần phân tích sâu

**Dùng DEBUG (không phải hotfix) khi:**
- Lỗi logic nghiệp vụ (sai flow, sai điều kiện, sai kết quả)
- Lỗi liên quan DB / auth / RLS / session
- Lỗi xuất hiện ở nhiều file hoặc nhiều layer
- Root cause chưa rõ, cần điều tra
- User dùng từ: "tại sao", "không hiểu tại sao", "lạ lắm", "bug này kỳ"

Examples:
- "debug"
- "bị lỗi này" + paste stack trace phức tạp
- "tại sao X không chạy"
- "something is broken"
- "login flow bị lỗi weird"

→ Route to: `workflows/debug.workflow.md`
→ Extract: error_message or code snippet if provided

**Khi không chắc hotfix hay debug:**
→ classifier.md (`runtime/classifier.md`) quyết định dựa trên error text
→ Không tự route — luôn delegate sang classifier

---

### INTENT: PLAN
Triggers: feature breakdown or task planning
Examples:
- "plan auth"
- "break down feature X"
- "tạo task list cho Y"
- "tôi muốn build Z, plan đi"

→ Route to: `workflows/plan.workflow.md`
→ Extract: feature_name from input

---

### INTENT: AUGMENT
Triggers: modification or extension of existing work
Examples:
- "augment T005 add zod validation"
- "thêm pagination vào feature hiện tại"
- "current task cần thêm error handling"
- "add soft delete to this feature"

→ Route to: `workflows/augment.workflow.md`
→ Extract: target (task_id | "current" | "feature") + instruction

---

### INTENT: CONSULT
Triggers: question or opinion request directed at a specific agent role
Examples:
- "hỏi architect xem nên dùng server actions không"
- "ask planner if T005 should be split"
- "what does product agent think about this feature"
- "architect, should I use repository pattern here?"
- "nên dùng pattern nào cho cái này"

→ Route to: direct agent call (NO workflow trigger)
→ Inject: memory_core + memory_state + constraints
→ Do NOT update memory after consult
→ Infer which agent from context:
  - architecture/pattern/structure questions → architect
  - task breakdown questions → planner
  - user/UX/MVP questions → product
  - code quality questions → reviewer

---

### INTENT: STATUS
Triggers: progress or state check
Examples:
- "status"
- "đang làm gì vậy"
- "tiến độ thế nào"
- "what's next"
- "next"
- "show me where we are"

→ Read memory files
→ Output structured summary (see STATUS FORMAT below)

---

### INTENT: STATUS-TODAY
Triggers: muốn xem tóm tắt những gì đã làm hôm nay
Examples:
- "hôm nay làm được gì"
- "status hôm nay"
- "today"
- "summary hôm nay"
- "đã xong gì rồi"

→ Read memory_state.daily_log — filter by today's date
→ Output TODAY FORMAT (see STATUS FORMAT section)

---

### INTENT: REVIEW
Triggers: explicit review request on existing code
Examples:
- "review T005"
- "review current code"
- "check this code"
- "review --security" / "chỉ check security thôi"
- "review --arch" / "check layer violations"

→ Route to: `agents/reviewer.agent.md`
→ Inject: code + constraints + architecture rules
→ Extract: review scope from modifier if present

---

### INTENT: PREVIEW
Triggers: muốn hiểu task sẽ làm gì trước khi chạy
Examples:
- "preview T005"
- "T005 làm gì vậy"
- "giải thích T005 trước khi chạy"
- "explain T005"
- "T005 sẽ đụng đến file nào"
- "trước khi run T005, cho tôi biết..."

→ Route to: `runtime/preview.md`
→ Read-only — KHÔNG gọi builder, KHÔNG write file, KHÔNG tạo git stash
→ architect.agent chạy ở chế độ analysis-only (không produce handoff block)
→ Hiển thị: files dự kiến, layers, dependencies, complexity, câu hỏi cần quyết định

---

### INTENT: UNCLEAR
If intent cannot be determined with reasonable confidence:
→ Ask ONE clarifying question
→ Offer 2-3 most likely interpretations as options
→ Do NOT proceed without confirmation

---

### INTENT: IDEA
Triggers: capturing a thought without executing anything
Examples:
- "ghi lại ý tưởng: thử Redis thay vì memory cache"
- "idea: dùng edge runtime cho auth"
- "note: cần refactor login flow sau"
- "nhớ là cần thêm rate limiting"
- "jot down: consider optimistic updates"

→ Route to: runtime/idea-log.md
→ Do NOT trigger any workflow
→ Do NOT update task memory
→ Do NOT call any agent

---

### INTENT: PIVOT
Triggers: changing implementation direction for current task
Examples:
- "thay REST API bằng server action"
- "pivot sang approach khác"
- "dùng pattern khác đi"
- "cách này không ổn, đổi sang X"
- "actually, let's use Y instead"

→ Route to: workflows/pivot.workflow.md
→ Extract: pivot_to direction from input
→ Use current_task as pivot target

---

### INTENT: EXPERIMENT
Triggers: wanting to try something without committing
Examples:
- "thử xem nếu dùng X thì sao"
- "experiment: what if we used Y"
- "--experiment"
- "sandbox: test this approach"
- "thử approach này không cần commit"
- "let me just see what happens if..."

→ Route to: workflows/experiment.workflow.md
→ Extract: idea/approach to experiment with
→ NEVER write to main memory during experiment

---

## ROUTING PRIORITY: DEBUG vs HOTFIX

Khi user paste error hoặc nói về lỗi, engine phân loại theo thứ tự này:

```
1. Đọc error message / mô tả của user
2. Có keyword hotfix? (xem bảng trong INTENT: HOTFIX)
   VÀ không có dấu hiệu phức tạp (DB, auth, nhiều file)?
   → HOTFIX → workflows/hotfix.workflow.md

3. Không chắc?
   → Delegate sang classifier.md để quyết định
   → classifier.md trả về: { route: "hotfix" | "debug", ... }
   → route theo kết quả

4. Rõ ràng là lỗi phức tạp / logic?
   → DEBUG → workflows/debug.workflow.md
```

**RULE: Không được tự route sang debug.workflow khi error message chứa hotfix keyword.**
**RULE: Khi nghi ngờ → classifier.md, không tự đoán.**

---

## MODIFIERS

Modifiers adjust workflow behavior. They can be expressed naturally — no exact syntax required.

| Natural expression | Modifier | Effect |
|---|---|---|
| "nhanh thôi", "just quickly", "fast" | --fast | Force FAST mode, skip architect |
| "kỹ vào", "thoroughly", "full" | --full | Force FULL mode, include architect |
| "không cần review", "skip review", "trust it" | --skip-review | Skip reviewer agent |
| "chỉ patch thôi", "just a small fix", "minor change" | --patch | Force patch mode in augment |
| "tạo task mới", "new task for this" | --new-task | Force new task creation in augment |
| "chỉ check security", "security only" | --security | Review: security checklist only |
| "chỉ check architecture", "arch only" | --arch | Review: architecture check only |
| "đừng hỏi nhiều", "cứ chạy đi", "just go" | --flow-mode | Activate flow mode for session |
| "flow mode off", "hỏi tôi như bình thường" | --flow-mode-off | Deactivate flow mode |
| "thử xem", "experiment", "không cần commit" | --experiment | Route to experiment workflow |
| "thay đổi approach", "pivot" | --pivot | Route to pivot workflow |
| "chế độ explore", "tôi đang explore" | --explore | Set session mode = explore |
| "chế độ ship", "cần deliver" | --ship | Set session mode = ship |
| "chế độ refactor", "đang clean up" | --refactor | Set session mode = refactor |

---

## STATUS FORMAT

When STATUS intent is detected, output:

```
📊 ANTIGRAVITY STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏗️  Feature:   [current_feature]
📌  Task:      [current_task] — [tên task ngắn gọn]
📈  Progress:  [progress]% ([completed]/[total] tasks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏭️  Tiếp theo:
    [T006] Tên task — ready ✅
    [T007] Tên task — chờ T006 ⏸️
    [T008] Tên task — chờ T006, T007 ⏸️

⚠️  Issues:    [count] open
🔧  Tech debt: [count] items
📅  Quyết định gần nhất: [decision text ngắn — from decisions.log]
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Quy tắc hiển thị next_tasks:
- Task không có dependency chưa xong → hiển thị "ready ✅"
- Task có dependency chưa xong → hiển thị "chờ [T00x] ⏸️"
- Chỉ hiển thị tối đa 5 task tiếp theo
- Nếu có task bị block: thêm dòng gợi ý "💡 Gõ `preview [task_id]` để xem chi tiết"

---

## TODAY FORMAT

When STATUS-TODAY intent is detected, output:

```
📅 HÔM NAY — [YYYY-MM-DD]
━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Đã hoàn thành ([count]):
   T004 — DB Schema migration
   T005 — Supabase Auth setup

⚡ Hotfix đã xử lý ([count]):
   [import] Cannot find module '@/lib/supabase'  → fixed

🔀 Escalate ([count]):
   T006 — Builder conflict: tách thành T006a, T006b

📌 Đang dở:
   T007 — Inbox UI (chưa chạy)
━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Ngày mai bắt đầu với: run T007
```

Nếu daily_log không có entry cho hôm nay:
→ output: "Hôm nay chưa có task nào được chạy. Gõ 'status' để xem toàn bộ tiến độ."

---

## MEMORY INJECTION RULES

FULL CONTEXT (use for: EXECUTE FULL, PLAN, AUGMENT, CONSULT):
- memory_core.json
- memory_state.json
- last 3 decisions from decisions.log.jsonl
- constraints.md

FAST CONTEXT (use for: EXECUTE FAST, STATUS):
- memory_state.json
- constraints.md only

HOTFIX CONTEXT (use for: HOTFIX):
- constraints.md only
- affected file content nếu detect được từ stack trace
- KHÔNG load memory_core, memory_state, decisions
- Lý do: hotfix không thay đổi architecture hay task state

REVIEW CONTEXT (use for: REVIEW, DEBUG):
- constraints.md
- architecture rules from memory_core
- relevant task context

RULE: Never ask user to paste memory manually.
RULE: Always load context from files before executing.

---

## SESSION PRINCIPLES

1. One task at a time — never parallelize execution
2. Always review output — human stays in the loop
3. Memory is truth — never proceed without loading it
4. Intent over syntax — understand what the user means
5. Minimal friction — the system adapts to the user, not vice versa

## SESSION MODES

Set at start of session (or any time mid-session):
- "explore mode" / "chế độ explore" / "tôi đang thử ý tưởng"
- "ship mode" / "chế độ ship" / "tôi muốn deliver"
- "refactor mode" / "chế độ refactor" / "tôi đang clean up"

Store in: memory_state.session_intent.mode

### MODE: explore
Adjustments:
- architect.agent: lighter-weight — prioritize options over single answer
- reviewer.agent: WARNINGS become suggestions (not blockers)
- auto-suggest: experiment workflow when task is ambiguous
- memory write: still full — exploration should be tracked

### MODE: ship
Default behavior — no adjustments. Full workflow, full review.

### MODE: refactor
Adjustments:
- reviewer.agent: extra strict on architecture + constraint violations
- builder.agent: prioritize minimal diffs over rewrites
- architect.agent: focus on what must be preserved (no regressions)
- planner.agent: break tasks into smaller atomic units

