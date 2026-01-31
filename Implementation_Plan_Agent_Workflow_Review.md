# Sumerian Multi-Agent Workforce Implementation Plan

## Executive Summary
The proposed "Multi-Agent Workforce" workflow radically expands Sumerian from a single-threaded chat interface to a parallelized agent orchestration platform. The current codebase (v1) is built around a singleton `CLIManager` and a linear `useAppStore` agent state. To achieve the PRD's vision, we must refactor the backend to support multiple concurrent CLI processes and update the frontend to visualize and control this workforce.

## 1. Backend Architecture Refactoring (`CLIManager.ts`)

### Current State
- **Singleton Pattern**: A single `ptyProcess` instance handles all interactions.
- **Sequential Execution**: `sendMessage` often kills/respawns the process or relies on a single persistent stream.
- **Global Context**: State is tied to one "thread".

### Proposed Architecture: `AgentPool`
We need to transition from a single manager to a Pool/Session architecture.

```typescript
// Proposed Structure

interface AgentSession {
    id: string;            // e.g., "agent-tester-1"
    role: Persona;         // "architect" | "builder" | "tester"
    process: pty.IPty;     // Dedicated process
    parser: CLIOutputParser;
    status: ConnectionStatus;
    task: string;          // Current high-level objective
    workingDirectory: string; // Could be a sub-repo or separate dir
}

export class CLIManager {
    // Map of active agents
    private sessions: Map<string, AgentSession> = new Map();
    
    // The "Conductor" is just the default session
    private conductorId: string = 'conductor-default';

    public spawnAgent(role: Persona, task: string, options: AgentOptions): string {
        // Spawns a NEW ptyProcess with specific flags
        // Returns agentId
    }

    public killAgent(agentId: string): void {
        // Kills specific process
    }

    public delegate(fromAgentId: string, toAgentId: string, instruction: string): void {
        // Handles inter-agent messaging if needed, or just routing user commands
    }
}
```

### Critical CLI Updates
The PRD correctly identifies missing flags. `CLIManager` needs to dynamically construct args based on the agent's role:

1.  **`--agents`**: Pass a JSON config defining the sub-agent's persona.
2.  **`--add-dir`**: Essential for the **Scope Isolation** requirement. A "Tester" agent might only need access to `tests/` and `src/`, preventing it from messing with `config/` files.
3.  **`--disallowedTools` / `--allowedTools`**:
    *   *Tester Persona*: Allow `run_command`, `read_file`. Disallow `write_to_file` (maybe).
    *   *Architect Persona*: Allow `read_file`, `list_files`. Disallow `run_command`.

## 2. State Management Updates (`useAppStore.ts`)

The `agent` slice in Zustand is currently monolithic. We need to split "Global/Conductor" state from "Workforce" state.

```typescript
interface AgentState {
    id: string;
    role: string;
    messages: Message[];
    status: 'idle' | 'running' | 'error';
    currentTool: string | null;
}

interface WorkforceState {
    // The main chat (Conductor)
    conductor: AgentState; 
    
    // The sub-agents
    workforce: Record<string, AgentState>;
    
    // Actions
    spawnWorker: (role: string) => void;
    killWorker: (id: string) => void;
    focusAgent: (id: string) => void; // Which agent is shown in the AgentPanel
}
```

## 3. UI Implementation Strategy

### A. The "Glass" Sidebar (Workforce Tab)
*   **Location**: Add a new Sidebar Panel (alongside Files and Search).
*   **Content**: A list of "Agent Cards".
    *   **Visuals**: Use the `ConnectionStatus` (green/yellow/red) dots for each card.
    *   **Sparklines**: If possible, track CPU usage (requires separate IPC call to main process to monitor PID usage).
    *   **Actions**: "Kill" (Trash icon), "Focus" (Eye icon).

### B. Split-View Terminal
The `TerminalPanel.tsx` currently supports tabs. We should map Agent IDs to Terminal Tabs.
*   When Agent "Tester" is spawned -> Create Terminal Tab "Tester".
*   Pipe `stdout` from that agent's `ptyProcess` to that XTerm instance.
*   **Grid View**: Use a library like `react-grid-layout` or CSS Grid to allow side-by-side terminal views (Conductor vs. Tester).

### C. Delegation UI (`AgentPanel.tsx`)
Currently, `sendMessage` just sends text. We need a "Delegate" Action.
*   **Slash Command**: `/delegate [role] [task]` implementation.
*   **UI Parser**: When the user types `/delegate`, show a specialized form (Role selector, Task textarea).
*   **Effect**: Calls `spawnAgent` -> Switches view to the new agent -> Streams initial prompt.

## 4. Security & Guardrails

### Locking Mechanism
To satisfy **FR-6 (Conflict Prevention)**, `CLIManager` needs a file-lock registry.
*   When `write_to_file` is called by Agent A on `file.ts`, lock `file.ts`.
*   If Agent B tries to write to `file.ts`, the IPC handler intercepts and rejects/queues the request.
*   **UI**: Show a "Lock" icon in the File Tree next to files being edited.

## 5. Step-by-Step Implementation Roadmap

1.  **Refactor CLIManager**: Convert the singleton `ptyProcess` to a `Map<string, IPty>`. Maintain backward compatibility by treating the first entry as the "default" session.
2.  **Update Store**: Add `workforce` slice to `useAppStore`.
3.  **Basic UI**: Add the Workforce Sidebar to list active processes.
4.  **Terminal Mapping**: Ensure new agents spawn new terminal tabs.
5.  **Slash Commands**: Implement `/delegate` to verify the end-to-end flow.

## Conclusion
The `AgentWorkFlow.md` is a solid blueprint. The current app is about 30% there (basic CLI integration exists). The major work is in **parallelization** (managing state for N agents) and **orchestration** (coordinating locks and specialized roles).
