# PRD: Sumerian Agent Workflow System (v2.0)

## Executive Summary

Sumerian's Agent Workflow System transforms the IDE into a high-autonomy development environment powered by multi-agent orchestration, autonomous iteration loops (Ralph Wiggum), and intelligent context management. This system enables users to delegate complex tasks to specialized AI agents that work in parallel, iterate autonomously until completion, and maintain context awareness across long development sessions.

**Key Differentiators:**
- **Conductor Pattern**: Lead agent (Opus) orchestrates specialized sub-agents
- **Ralph Wiggum Loop Mode**: Autonomous iteration with promise-based completion
- **Brave Mode**: Minimal approval friction for maximum velocity
- **Multi-Agent Workforce**: Parallel execution with conflict prevention

---

## 1. Core Architecture

### 1.1 Conductor Pattern

The system implements a hierarchical agent structure:

**The Conductor (Lead Agent)**
- Model: Claude Opus 4.5
- Role: High-level planning, task delegation, orchestration
- Capabilities: Multi-step reasoning, complex decision-making, sub-agent management

**The Workforce (Sub-Agents)**
- Ephemeral Claude instances spawned for specific tasks
- Context-isolated to preserve token efficiency
- Auto-terminate on completion with status reports

### 1.2 Agent Pool Architecture

**CLIManager Refactor**
```typescript
interface AgentProcess {
  id: string;
  persona: Persona;
  status: 'idle' | 'active' | 'complete' | 'error';
  pty: IPty;
  messageHistory: Message[];
}

private agentPool: Map<string, AgentProcess>;
```

**WorkforceState in Zustand**
```typescript
interface WorkforceState {
  activeAgents: Map<string, AgentInstance>;
  taskQueue: Task[];
  spawnAgent: (role: Persona, task: string) => Promise<string>;
  terminateAgent: (aid: string) => void;
  getAgent: (aid: string) => AgentInstance | null;
}
```

### 1.3 Inter-Agent Sync

**Shared State File**: `.sumerian/workforce/state.json`
- Tracks active agents and their assigned files
- Prevents merge conflicts through file locking
- Enables agents to acknowledge each other's work

---

## 2. Agent Personas

| Persona | Model | Capabilities | Tool Restrictions |
|---------|-------|--------------|-------------------|
| **Conductor** | Opus 4.5 | Orchestration, planning, delegation | Full access |
| **Architect** | Sonnet 4.5 | Codebase analysis, implementation plans | Read-only |
| **Builder** | Sonnet 4.5 | Write code, file operations | Full access |
| **QA/Tester** | Sonnet 4.5 | Generate/run tests, iterative debugging | Test files only |
| **Documenter** | Haiku 4.5 | Update docs, lore files | Docs only |
| **Loop Agent** | Sonnet 4.5 / Opus | Autonomous iteration (Ralph Wiggum) | Configurable |

**Persona Configuration** (`personas.ts`):
```typescript
export const PERSONAS: Record<string, PersonaConfig> = {
  conductor: {
    model: 'claude-opus-4-5-20251101',
    systemPrompt: 'You are the Conductor...',
    allowedTools: ['*'],
    disallowedTools: []
  },
  architect: {
    model: 'claude-sonnet-4-5-20250929',
    systemPrompt: 'You are the Architect...',
    allowedTools: ['read_file', 'list_dir', 'grep_search'],
    disallowedTools: ['write_to_file', 'edit']
  },
  // ...
};
```

---

## 3. Ralph Wiggum Loop Mode

### 3.1 Concept

Autonomous iteration loops inspired by the Ralph Wiggum technique:
- Agent receives a task with clear completion criteria
- Iterates until it outputs a **completion promise** or hits max iterations
- Self-corrects on failures, treating errors as data

### 3.2 Promise Detection

**Pattern Matching**:
```
<promise>COMPLETE</promise>
```
or bare word:
```
DONE
```

**Implementation** (`CLIOutputParser.ts`):
```typescript
private promisePattern: RegExp | null = null;

public setPromisePattern(promise: string | null): void {
  this.promisePattern = promise 
    ? new RegExp(`<promise>${promise}</promise>|\\b${promise}\\b`, 'i')
    : null;
}
```

### 3.3 Loop Control

**Commands**:
- `/loop "prompt" --promise "DONE" --max 20`
- `/cancel-loop`

**Safety**:
- Max iterations cap (default: 20)
- Cancel button in UI
- 1-second delay between iterations

### 3.4 Use Cases

| Use Case | Prompt Template | Max Iterations |
|----------|-----------------|----------------|
| **TDD Development** | Implement feature using TDD. Write tests, implement, iterate until all green. | 50 |
| **Bug Fixing** | Fix bug: [description]. Reproduce, identify root cause, implement fix, verify. | 20 |
| **Refactoring** | Refactor [component] for [goal]. All tests must pass. Incremental commits. | 25 |
| **Feature Implementation** | Build [feature]. Requirements: [list]. Tests >80% coverage. | 30 |

### 3.5 Prompt Templates

**File**: `loop-templates.json`
```json
{
  "tdd": {
    "name": "TDD Development",
    "prompt": "Implement {feature} using TDD.\n\nProcess:\n1. Write failing test\n2. Implement minimal code\n3. Run tests\n4. If failing, fix and retry\n5. Refactor if needed\n6. Repeat\n\nOutput <promise>DONE</promise> when all tests green.",
    "promise": "DONE",
    "maxIterations": 50
  }
}
```

---

## 4. Functional Requirements

### FR-1: Sub-Agent Spawning

**Command**: `/spawn <persona> "<task>" [--model <model>]`

**Example**:
```
/spawn Tester "Run unit tests for CLIManager" --model sonnet
```

**Behavior**:
1. Create new `AgentProcess` with unique ID
2. Isolate context (only relevant files)
3. Spawn pty process with persona config
4. Route output to dedicated UI buffer
5. Auto-terminate on completion

### FR-2: Workforce Dashboard

**UI Component**: New "Workforce" tab in Glass Sidebar

**Features**:
- Agent status cards (ID, persona, activity, status)
- Real-time progress indicators
- Context scoping badge (locked directory)
- Resource usage sparklines (CPU/Memory)
- Click to focus agent
- Kill button per agent

### FR-3: Parallel Execution

**Task Broadcasting**: Conductor assigns sub-tasks to multiple agents

**Inter-Agent Sync**: `.sumerian/workforce/state.json`
```json
{
  "agents": {
    "agent-123": {
      "persona": "Builder",
      "lockedFiles": ["src/main/cli/CLIManager.ts"],
      "status": "active"
    }
  }
}
```

### FR-4: Loop Mode

**Command**: `/loop "<prompt>" --promise "<text>" --max <n>`

**UI**: `LoopIndicator` component with:
- Progress bar
- Iteration count (current/max)
- Promise display
- Cancel button

### FR-5: Detached Agent Window

**Feature**: Pop-out agent panel to separate window

**Benefits**:
- Multi-monitor workflows
- Focus mode
- Parallel observation

### FR-6: Autopilot Mode

**Toggle**: In agent header

**Behavior**: Chain actions without per-step approval (still respects security boundaries)

---

## 5. CLI Enhancements

### 5.1 Missing Flags

| Flag | Purpose | Implementation |
|------|---------|----------------|
| `--agents` | Custom subagent definitions via JSON | Sprint 15 |
| `--mcp-config` | Load MCP servers from config | Sprint 14 |
| `--max-budget-usd` | Cost safety cap | Sprint 14 |
| `--add-dir` | Monorepo support | Sprint 14 |
| `--disallowedTools` | Restrict sub-agent tools | Sprint 14 |
| `--allowedTools` | Pre-approve tools | Sprint 14 |

### 5.2 Slash Commands

| Command | Purpose | Implementation |
|---------|---------|----------------|
| `/compact` | Summarize context, prune history | Sprint 14 |
| `/review` | Request code review | Sprint 14 |
| `/context` | Context usage gauge | Sprint 14 |
| `/loop` | Start autonomous loop | Sprint 13 |
| `/spawn` | Spawn sub-agent | Sprint 15 |
| `/checkpoint` | Create named snapshot | Sprint 18 |
| `/template` | Insert loop template | Sprint 13 |

### 5.3 Thinking Levels

**Graduated Levels**: `think` < `think hard` < `think harder` < `ultrathink`

**Implementation**: Parse from model selector or prompt prefix, map to `--think` flag

---

## 6. UI/UX Specifications

### 6.1 Workforce Sidebar Tab

**Design**: Nexus minimalist aesthetic
- Monochromatic cards (#0a0a0a base, #3b82f6 accent)
- Agent ID, persona icon, status badge
- Real-time activity string
- Context scoping badge
- Resource sparklines

### 6.2 Multi-Process Terminal Grid

**Layout**: Tabbed or grid view
- Auto-focus on agent card click
- Brave Mode amber glow (#f59e0b)
- "Halt All" kill switch (red button)

### 6.3 Loop Indicator

**Design**: Blue accent (vs red for self-healing)
- Progress bar
- Iteration count badge
- Promise display
- Cancel button

### 6.4 Delegation Proposal Card

**Content**:
- Target agent (model + persona)
- Scope (files to modify)
- Task description
- Approve/Reject buttons

### 6.5 File Locking Visualization

**File Tree**: Lock icon on files being edited
- Hover shows Agent ID
- Prevents user edits to locked files

### 6.6 Inline Diff Preview

**Monaco Diff View**: Before applying changes
- Accept/Reject/Edit buttons
- Side-by-side or unified diff

### 6.7 Completion Reports

**Agent Card Transform**: "Report" state on completion
- Summary of changes
- Review Changes button (inline diff)
- Revert Agent button (rollback)

---

## 7. Safety & Guardrails

### 7.1 File Locking

**Mechanism**: `FileService` tracks locked files
```typescript
private lockedFiles: Map<string, string>; // path -> agentId

public lockFile(path: string, agentId: string): boolean {
  if (this.lockedFiles.has(path)) return false;
  this.lockedFiles.set(path, agentId);
  return true;
}
```

### 7.2 Recursive Spawning Limit

**Rule**: Sub-agents cannot spawn their own sub-agents

**Enforcement**: Check agent depth before allowing `/spawn`

### 7.3 Workforce Kill Switch

**UI**: Red "Halt All" button in terminal header

**Action**: `CLIManager.killAll()` terminates all pty processes

### 7.4 Loop Safety

**Max Iterations**: Default 20, configurable

**Cancel Button**: User can interrupt at any time

**Delay**: 1-second pause between iterations

### 7.5 Security Boundaries

**Modal**: Interrupt for external path access
- Clear message: "Agent [ID] requesting [path]"
- Allow/Deny buttons

**Audit Log**: `~/.sumerian/audit.log`
- All agent commands logged
- Viewer in UI

---

## 8. Advanced Features

### 8.1 Named Checkpoints

**Command**: `/checkpoint "before auth refactor"`

**UI**: Checkpoint timeline in sidebar
- Visual timeline of labeled snapshots
- One-click rollback

### 8.2 Agent Memory

**File**: `.sumerian/memory.md`
- Agent-writable persistent context
- Survives session clears
- Injected like lore

**Use Cases**:
- Decisions made
- Patterns discovered
- User preferences learned

### 8.3 Task Queue

**UI**: Task Queue Panel
- Queue up tasks for sequential processing
- Drag-drop reordering
- Auto-start next on completion

**Overnight Batch Mode**:
- Queue multiple loop tasks
- Run sequentially while user away
- Morning summary

---

## 9. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Parallelism** | 3+ concurrent agents | No UI lag |
| **Token Efficiency** | 30% reduction | Conductor context size |
| **Throughput** | 50% reduction | Time-to-complete multi-file features |
| **Loop Completion** | >80% | Within max iterations |
| **Resource Usage** | <512MB per agent | Memory monitoring |

---

## 10. Implementation Roadmap

See individual sprint documents in `docs/sprints/`:

| Sprint | Name | Duration | Status |
|--------|------|----------|--------|
| **13** | Loop Mode (Ralph Wiggum) | 1 week | Pending |
| **14** | CLI Enhancements | 1 week | Pending |
| **15** | Multi-Agent Core | 2 weeks | Pending |
| **16** | Workforce UI | 1 week | Pending |
| **17** | Orchestration UX | 1 week | Pending |
| **18** | Advanced Features | 1 week | Pending |

**Total Duration**: ~8 weeks

---

*Last Updated: January 2026*