# The "Test-Driven Loop" (The TDD Agent)

What about this just being a script written by LLM or Human like `checks.sh` or `checks.js` and then including in `~/.gemini/GEMINI.md`
a note about using this tool before calling a task finished, or even a hook (if those exist with gemini)?

# The "Background Sentinel" (Async Collaboration)

This would be great as a vscode extension. It gives me another idea for an agent that teaches coding concepts.

# Teacher

It's job is to facilitate a learner on completing a project that touches on all the fundamentals of a language, framework, or library. They can ask for hints, suggestions on what to do next, advice on how to proceed, and material (or just guided learning sessions meant to teach/inform, like the bulk material found in common course work that would proceed a project/text/quiz). Also, optional tests & quizzes.

This could be a vscode extension or even a IDE based on vscode

# MCP

Come up with some more ideas that better fit an MCP model,
or, if you want, we could tackle one of the ideas I mentioned here.

---

# The "Test-Driven Loop" (The TDD Agent)

What about this just being a script written by LLM or Human like `checks.sh` or `checks.js` and then including in `~/.gemini/GEMINI.md`
a note about using this tool before calling a task finished, or even a hook (if those exist with gemini)?

# The "Background Sentinel" (Async Collaboration)

This would be great as a vscode extension. It gives me another idea for an agent that teaches coding concepts. It's job is to facilitate a learner on completing a project that touches on all the fundamentals of a language, framework, or library. They can ask for hints, suggestions on what to do next, advice on how to proceed, and material (or just guided learning sessions meant to teach/inform, like the bulk material found in common course work that would proceed a project/text/quiz). Also, optional tests & quizzes.

This could be a vscode extension or even a IDE based on vscode

# MCP

## New MCP & Workflow Ideas

### 1. The "Context-Distiller" MCP

- **Problem:** Projects get huge, and LLMs lose focus or drown in irrelevant code.
- **Solution:** An MCP that indexes the codebase into "Mental Models."
- **Tools:**
  - `get_architectural_summary()`: Returns a high-level graph of data flow and component relationships.
  - `prune_context(target_task)`: Automatically identifies the minimal set of files relevant to a specific task to optimize context window usage.

### 2. The "Decision-Log" MCP (ADR Automation)

- **Problem:** The "why" behind code changes is often lost over time or across different LLM sessions.
- **Solution:** An MCP that manages Architecture Decision Records (ADRs).
- **Workflow:** The agent must call `record_decision(rationale, alternatives)` for non-trivial changes, building a searchable project memory.

### 3. The "Multi-Model-Validator" MCP

- **Problem:** Single-model bias or "confident hallucinations."
- **Solution:** An MCP acting as a bridge to other models (local via Ollama or other cloud APIs).
- **Tool:** `cross_validate(draft_code)`: Sends code to a secondary model specifically tasked with finding flaws or logic gaps.

### 4. The "Verification Protocol" (Test-Driven Loop)

- **Concept:** Use a dedicated script (`check.js`/`verify.sh`) to validate code changes.
- **Enforcement:** Codify in `.gemini/GEMINI.md` that no task is "done" until the verification script passes.
- **Safety:** Explicitly forbid auto-committing, pushing, or deploying without human confirmation.
