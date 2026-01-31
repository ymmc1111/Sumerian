PRD: Sumerian Multi-Agent Workforce (v1.1)
1. Product Objective
To enable users to orchestrate a team of specialized Claude instances that work in parallel. This feature optimizes context usage by offloading specific sub-tasks (e.g., testing, documentation, or frontend styling) to secondary agents, increasing development velocity and reducing the "context bloating" of a single session.

2. Workforce Architecture
Sumerian will implement a Lead Conductor pattern:

The Conductor (Main Agent): The primary Sonnet 4.5/Opus agent that manages the high-level plan and delegates tasks.

The Workforce (Sub-Agents): Ephemeral Claude instances (typically using Claude Haiku for speed/cost or Sonnet for logic) spawned to complete isolated technical tickets.

3. Functional Requirements
FR-1: Sub-Agent Spawning (/spawn)
Capability: The Conductor or User can spawn a sub-agent with a specific "Role" and "Objective."

Context Isolation: Sub-agents only receive the relevant files and instructions needed for their specific ticket, preserving the global token limit.

Lifecycle: Sub-agents auto-terminate upon task completion, returning a "Completion Report" to the Conductor.

FR-2: The Workforce Dashboard
UI Component: A new "Workforce" tab in the Glass Sidebar showing active agents.

Real-time Monitoring: Visual indicators (spinners/progress bars) for each agent's current activity (e.g., "Agent-2: Writing Unit Tests...").

Manual Intervention: The user can click into any sub-agent to view its specific logs or "Kill" a rogue process.

FR-3: Parallel Execution & "Teammate" Communication
Task Broadcasting: The Conductor can broadcast a shared objective (e.g., "Refactor API") and assign sub-components to different agents.

Inter-Agent Sync: A shared .sumerian/workforce/state.json file allows agents to acknowledge each other's work and avoid merge conflicts.

FR-4: Agent Specialization Profiles
The system will provide pre-defined "Personas" for spawned agents:

The Architect: Scans the codebase and creates implementation plans (Haiku-powered).

The Builder: Writes the core logic and handles file operations.

The QA/Tester: Generates test suites and runs them in a loop until they pass.

The Documenter: Scans new code and updates README.md or lore files.

4. Technical Implementation
4.1 CLI Orchestration
The CLIManager.ts must be updated to manage a Pool of ptyProcess instances instead of a single reference.

Process ID (AID): Each agent is assigned a unique Agent ID (e.g., sumerian-agent-123).

Stream Routing: IPC must route stdout/stderr from each sub-process to a specific UI buffer in the AgentPanel.tsx.

4.2 State Management (useAppStore.ts)
The Zustand store will be updated to include:

TypeScript

interface WorkforceState {
  activeAgents: Map<string, AgentInstance>;
  taskQueue: Task[];
  spawnAgent: (role: Persona) => void;
  terminateAgent: (aid: string) => void;
}
5. User Experience (UX)
5.1 The "Conductor" Chat
The main AgentPanel remains the primary interface. When the Conductor decides to delegate, the UI displays a "Workforce Delegation" card:

🤖 Conductor: I am spawning The Tester to handle the Vitest suite while I refactor the controller.

[Agent-1: Active] -> tests/unit/CLIManager.test.ts

[Me: Active] -> src/main/cli/CLIManager.ts

5.2 Split-View Terminal
The TerminalPanel will support tabs or a "Grid View" to show the simultaneous output of multiple agents running terminal commands in Brave Mode.

6. Guardrails & Multi-Agent Safety
Conflict Prevention: If two agents attempt to write to the same file, the FileService must implement a file-lock mechanism.

Recursive Spawning Limit: To prevent runaway costs or infinite loops, sub-agents cannot spawn their own sub-agents.

Workforce Kill Switch: A global "Halt All Agents" button in the header that kills all background node-pty processes immediately.

7. Success Metrics
Parallelism: Ability to run at least 3 concurrent agents without UI lag.

Token Efficiency: 30% reduction in Conductor context size by offloading "heavy" file reads to sub-agents.

Throughput: 50% reduction in time-to-complete for multi-file features.

1. Workforce "Glass" Sidebar Tab
A new activity icon in the sidebar will open the Workforce Monitor. Following the Nexus principles of minimalism and high contrast:

Agent Status Cards: Each background agent is represented by a monochromatic card showing its ID, Persona (e.g., Builder, QA), and a real-time Activity String (e.g., npm test --watch).

Context Scoping Badge: Each card displays a badge showing exactly which subdirectory that agent is locked into, visually reinforcing the Security Boundaries rule that agents cannot access files outside the project without explicit confirmation.

Resource Usage: A small sparkline showing CPU/Memory for that specific node-pty process to ensure the NFR-2 Performance cap of 512MB is being respecd.

2. Multi-Process Terminal Grid
To maintain the Shadow Terminal requirement while running multiple agents, the TerminalPanel must evolve into a grid or tabbed view:

Automatic Focus Switching: Clicking an agent card in the sidebar instantly focuses that agent's specific terminal stream in the bottom panel.

Brave Mode Indicators: Any terminal running with --dangerously-skip-permissions is bordered with a subtle, pulsing amber glow (#f59e0b) to signal high-autonomy mode is active.

The "Halt All" Kill Switch: A persistent, high-contrast Red button in the terminal header that triggers a global kill() across all ptyProcess instances in the CLIManager.

3. Delegation UX & Conflict Guardrails
When the Conductor decides to delegate, the UI must facilitate "Rule 3: Propose Before Executing":

Delegation Proposal Card: Before spawning a worker, the Conductor must present a card in the AgentPanel detailing:

Target Agent: (e.g., Haiku-4.5).

Scope: Specific files to be modified.

Task: The exact command or logic to be run.

File Locking Visualization: In the File Tree, any file currently being edited by a background agent is marked with a "locked" icon and the Agent ID. This prevents the user or another agent from violating Rule 5 (Preserving existing functionality) by creating race conditions.

4. Verification & Hand-off (DoD)
To satisfy the Definition of Done (DoD) and Rule 4 (Verify Before Moving On):

Completion Reports: When a background task finishes, the agent card transforms into a "Report" state.

Snapshot Review: Users can click "Review Changes" to see an Inline Diff of all file modifications made by that specific agent before they are "Integrated" (L3) or "Verified" (L4).

Rollback Shortcut: A "Revert Agent" button is placed directly on the completion report, utilizing the UndoManager to restore the project to the pre-task snapshot.

5. Security Boundary Modals
For actions that hit the Security Boundaries (like requesting network access or files outside the project):

Isolated Confirmation: A dedicated modal that interrupts the background process. It must clearly state: "Agent [ID] is requesting access to [External Path]. This violates default project sandboxing. Allow?".

Audit Logging: The UI will include a "Security Log" view that streams from ~/.sumerian/audit.log, ensuring every background command is indexed and reviewable.

https://code.claude.com/docs/en/cli-reference

1. Missing Core Flags (Advanced Orchestration)
The current implementation misses several flags that are critical for a "Pro" IDE experience:

--agents: This allows you to define custom subagents dynamically via JSON. Since your PRD specifically mentions a "Multi-Agent Workforce," using this flag to define specialized roles (e.g., "The Tester" or "The Architect") at runtime is more native than manual orchestration.

--mcp-config: Crucial for your FR-4 (Extension Support). It allows you to load MCP servers from specific JSON files, which is necessary if you want to offer project-specific tools like "Sequential Thinking" or "Google Search".

--allow-dangerously-skip-permissions: This is a safer "prep" flag compared to your currently used --dangerously-skip-permissions. It enables permission bypassing as an option without immediately activating it, which could be used for a more granular "Brave Mode".

--add-dir: Your IDE currently lacks a way to handle monorepos. This flag allows Claude to access additional working directories outside the immediate project root, satisfying your Security Boundary requirements for approved external paths.

--max-budget-usd: A vital safety feature for users. Even with a Max subscription, adding a safety cap for any API-based fallback or high-token subagent tasks protects the user from unexpected usage.

2. Missing Slash Commands (UI/UX)
Your AgentPanel.tsx should eventually provide shortcuts or UI triggers for these commands:

/compact: Essential for your context management strategy. It summarizes history to clear the context window for complex tasks without losing the thread.

/review: Directly supports your DoD (Definition of Done). It requests a code review of current changes, perfect for the "Conductor" to run after a subagent finishes.

/context: Provides a "fuel gauge" for context usage. Your TokenUsageDisplay.tsx could pull visual data from this command to show the user when the agent is getting "full".

3. Authentication & Credential Refinements
The PRD mentions an OAuth Bridge, but technically:

Credential Path: The official CLI stores tokens in ~/.claude/.credentials.json.

Direct API Option: While Sumerian targets Max users, you should support the ANTHROPIC_API_KEY environment variable as a fallback. The CLI automatically looks for this before checking the .credentials.json file.

4. Thinking Mode Refinement
In your CLIManager.ts, you detect thinking by string matching, but the CLI has updated levels:

Extended Thinking Levels: You can use --think, but the CLI also understands graduated phrases in natural language: "think" < "think hard" < "think harder" < "ultrathink".

Beta Headers: For API-key users, the --betas interleaved-thinking flag is often required for the latest reasoning models.

5. Multi-Agent Conflict Guardrails
To satisfy Rule 5 (Preserve existing functionality) in a multi-agent environment:

--disallowedTools: When spawning a "The Tester" subagent, you should use this flag to explicitly block its ability to Write or Edit source code, ensuring it only generates test files.

--allowedTools: Conversely, use this to pre-approve specific tools for specialized workers, reducing the overhead of "Brave Mode" while maintaining tight security.