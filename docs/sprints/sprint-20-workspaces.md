# Sprint 20-B: Multi-Project Workspaces

**Duration:** 1-2 weeks  
**Goal:** Support multiple projects with isolated CLI sessions, enabling professional workflows across codebases.  
**Status:** 🔄 **IN PROGRESS**

---

## 📊 Sprint Overview

This sprint implements multi-project workspace support as defined in PRD Section 9. Users will be able to:
- Open multiple projects and switch between them with `Cmd+O`
- Maintain isolated CLI sessions per project
- Preserve conversation history when switching projects
- Configure per-project settings overrides

---

## Task Checklist

### Task B.1: Project Registry ✅
**Estimate:** 3 hours | **Priority:** High | **Status:** COMPLETE

Create a centralized project registry to track recent projects and their metadata.

**Subtasks:**
- [x] Create `ProjectManager.ts` in `src/main/projects/`
- [x] Define `ProjectEntry` interface with path, name, lastOpened, config
- [x] Implement `loadRegistry()` - read from `~/.sumerian/projects.json`
- [x] Implement `saveRegistry()` - persist to disk
- [x] Implement `addProject(path)` - add/update project entry
- [x] Implement `removeProject(path)` - remove from registry
- [x] Implement `getRecentProjects(limit)` - return sorted by lastOpened
- [x] Implement `getProjectByPath(path)` - lookup single project

**Files to Create:**
- `src/main/projects/ProjectManager.ts`
- `src/main/projects/types.ts`

**Files to Modify:**
- `src/main/ipc/handlers.ts` - Add project registry IPC handlers

**Registry Schema:**
```typescript
interface ProjectEntry {
    path: string;           // Absolute path to project root
    name: string;           // Display name (folder name by default)
    lastOpened: number;     // Unix timestamp
    configOverrides?: {     // Per-project settings
        braveMode?: boolean;
        model?: string;
        mcpConfigPath?: string;
    };
}

interface ProjectRegistry {
    version: 1;
    projects: ProjectEntry[];
}
```

---

### Task B.2: Project Switcher Modal ✅
**Estimate:** 4 hours | **Priority:** High | **Status:** COMPLETE

Create a modal UI for browsing and switching between recent projects.

**Subtasks:**
- [x] Create `ProjectSwitcher.tsx` component
- [x] Display recent projects list (max 10)
- [x] Show project name, path, and last opened date
- [x] Implement keyboard navigation (arrow keys, Enter to select)
- [x] Add "Browse..." button to open folder picker
- [x] Add `Cmd+O` keyboard shortcut binding
- [x] Implement project selection handler
- [x] Add search/filter functionality for project list

**Files to Create:**
- `src/renderer/components/ProjectSwitcher.tsx`

**Files to Modify:**
- `src/renderer/hooks/useKeyboardShortcuts.ts` - Add `Cmd+O` binding
- `src/renderer/stores/useAppStore.ts` - Add `showProjectSwitcher` state
- `src/renderer/App.tsx` - Render ProjectSwitcher modal
- `src/preload/types.ts` - Add project switcher IPC types
- `src/preload.ts` - Expose project switcher methods

**UI Design:**
```
┌─────────────────────────────────────────┐
│  Switch Project                    [×]  │
├─────────────────────────────────────────┤
│  🔍 Search projects...                  │
├─────────────────────────────────────────┤
│  📁 Sumerian                            │
│     ~/Dev/YMMC/Sumerian                 │
│     Last opened: 2 hours ago            │
├─────────────────────────────────────────┤
│  📁 MyWebApp                            │
│     ~/Projects/MyWebApp                 │
│     Last opened: Yesterday              │
├─────────────────────────────────────────┤
│  [Browse...]                            │
└─────────────────────────────────────────┘
```

---

### Task B.3: Isolated CLI Sessions ✅
**Estimate:** 5 hours | **Priority:** High | **Status:** COMPLETE

Refactor CLIManager to support multiple isolated instances per project.

**Subtasks:**
- [x] Create `CLISessionManager.ts` to manage multiple CLIManager instances
- [x] Track active session by project path
- [x] Implement `getOrCreateSession(projectPath)` - lazy initialization
- [x] Implement `switchSession(projectPath)` - change active session
- [x] Implement `terminateSession(projectPath)` - cleanup on project close
- [x] Preserve CLI state (brave mode, model) per session
- [x] Handle session cleanup on app quit
- [x] Update IPC handlers to route to correct session

**Files to Create:**
- `src/main/projects/CLISessionManager.ts`

**Files to Modify:**
- `src/main/ipc/handlers.ts` - Use CLISessionManager instead of single cliManager
- `src/main/cli/CLIManager.ts` - Add session isolation support

**Architecture:**
```
┌─────────────────────────────────────────────────────┐
│                  CLISessionManager                   │
├─────────────────────────────────────────────────────┤
│  sessions: Map<projectPath, CLIManager>             │
│  activeSession: string (projectPath)                │
├─────────────────────────────────────────────────────┤
│  getOrCreateSession(path) → CLIManager              │
│  switchSession(path) → void                         │
│  terminateSession(path) → void                      │
│  terminateAll() → void                              │
└─────────────────────────────────────────────────────┘
```

---

### Task B.4: Session Preservation ✅
**Estimate:** 4 hours | **Priority:** Medium | **Status:** COMPLETE

Save and restore conversation history when switching between projects.

**Subtasks:**
- [x] Extend SessionManager to support multi-project sessions
- [x] Auto-save current session before switching projects
- [x] Auto-restore last session when opening a project
- [x] Store session reference in ProjectEntry
- [x] Handle session migration for existing projects
- [x] Add session cleanup for deleted projects

**Files to Modify:**
- `src/main/sessions/SessionManager.ts` - Multi-project support
- `src/main/projects/ProjectManager.ts` - Session reference tracking
- `src/main/ipc/handlers.ts` - Auto-save/restore on switch

**Session Flow:**
1. User triggers project switch
2. Auto-save current session to `{project}/.sumerian/sessions/`
3. Update ProjectEntry with lastSessionId
4. Switch to new project
5. Load last session for new project
6. Restore conversation history in AgentPanel

---

### Task B.5: Project Config ✅
**Estimate:** 3 hours | **Priority:** Medium | **Status:** COMPLETE

Support per-project configuration overrides.

**Subtasks:**
- [x] Create `ProjectConfig.ts` for config handling
- [x] Define config schema with validation
- [x] Implement `loadConfig(projectPath)` - read `.sumerian/config.json`
- [x] Implement `saveConfig(projectPath, config)` - persist changes
- [x] Implement `mergeWithGlobal(projectConfig)` - combine with user prefs
- [x] Apply config on project open
- [x] Add UI for editing project config in Settings

**Files to Create:**
- `src/main/projects/ProjectConfig.ts`

**Files to Modify:**
- `src/renderer/components/SettingsModal.tsx` - Add project config tab
- `src/main/ipc/handlers.ts` - Config IPC handlers

**Config Schema:**
```typescript
interface ProjectConfig {
    version: 1;
    name?: string;              // Override display name
    braveMode?: boolean;        // Default brave mode state
    model?: string;             // Default model
    mcpConfigPath?: string;     // Project-specific MCP config
    additionalDirs?: string[];  // Extra directories to include
    allowedTools?: string[];    // Tool whitelist
    disallowedTools?: string[]; // Tool blacklist
}
```

---

### Task B.6: Quick Switch UI (World-Class Polish) ⬜
**Estimate:** 6 hours | **Priority:** Low

Add theme-aware project indicator and quick switch dropdown to title bar with full design system compliance.

**Subtasks:**
- [ ] Add project name display to TitleBar with theme variants
- [ ] Create dropdown menu with spring physics animation
- [ ] Implement tooltip system for project path on hover
- [ ] Add visual indicator for unsaved changes (theme-specific)
- [ ] Implement keyboard navigation (arrows, Enter, Esc)
- [ ] Add ARIA attributes for accessibility
- [ ] Create theme-specific visual treatments (NEXUS/GRID/LOVE)
- [ ] Implement reduced motion support
- [ ] Add focus trap when dropdown is open

**Files to Modify:**
- `src/renderer/components/TitleBar.tsx` - Add project indicator
- `src/renderer/components/ProjectSwitcher.tsx` - New dropdown component
- `src/renderer/components/Tooltip.tsx` - New tooltip component
- `src/renderer/stores/useAppStore.ts` - Track project metadata
- `src/renderer/styles/project-switcher.css` - Component styles

---

#### Visual Specifications

**Dropdown Container:**
```css
.project-switcher-dropdown {
  /* Base */
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 240px;
  max-width: 320px;
  max-height: 320px;
  overflow-y: auto;
  
  /* Spacing */
  padding: var(--spacing-sm); /* 8px */
  border-radius: 8px;
  border: 1px solid var(--border);
  
  /* Theme-specific (NEXUS default) */
  backdrop-filter: blur(20px);
  background: rgba(18, 18, 18, 0.95);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  
  /* Smooth scrollbar */
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
```

**Project Item:**
```css
.project-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm); /* 8px */
  padding: var(--spacing-sm) var(--spacing-md); /* 8px 16px */
  border-radius: 6px;
  cursor: pointer;
  
  /* Typography */
  font-family: var(--font-ui);
  font-size: var(--font-size-md); /* 13px */
  color: var(--text-primary);
  
  /* Touch target */
  min-height: var(--touch-target-min); /* 32px */
  
  /* Interaction */
  transition: background var(--transition-fast) var(--transition-curve);
}

.project-item:hover {
  background: var(--bg-tertiary);
}

.project-item[data-active="true"] {
  color: var(--accent);
  font-weight: 500;
}

.project-item[data-active="true"]::before {
  content: "✓";
  font-size: 14px;
  color: var(--accent);
}
```

**Unsaved Changes Indicator:**
```css
.project-name[data-unsaved="true"]::after {
  content: "●";
  margin-left: 6px;
  font-size: 8px;
  color: var(--accent);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

**Tooltip:**
```css
.project-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  
  padding: 6px 12px;
  border-radius: 6px;
  
  background: rgba(10, 10, 10, 0.95);
  border: 1px solid var(--border);
  
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
  
  pointer-events: none;
  z-index: 1000;
}
```

---

#### Interaction Specifications

**Open Animation:**
```typescript
// Spring physics: stiffness 400, damping 28
const dropdownVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.15,
      ease: [0.2, 1, 0.3, 1], // --transition-curve
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -4,
    transition: {
      duration: 0.1,
    },
  },
};
```

**Keyboard Navigation:**
- `ArrowDown` / `ArrowUp`: Navigate items (with wrap-around)
- `Enter`: Select highlighted project
- `Escape`: Close dropdown
- `Tab`: Focus trap within dropdown when open
- `/` or `Cmd+P`: Quick open from anywhere

**Mouse Interactions:**
- Click trigger: Toggle dropdown
- Click outside: Close dropdown
- Hover item: Highlight with `--bg-tertiary`
- Hover project name: Show tooltip after 500ms delay

**Focus Management:**
```typescript
// When dropdown opens:
1. Save current focus
2. Move focus to first item
3. Trap focus within dropdown
4. Add event listener for Escape

// When dropdown closes:
1. Restore previous focus
2. Remove focus trap
3. Clean up event listeners
```

---

#### Theme Variations

**NEXUS (Default):**
```css
[data-theme="nexus"] .project-switcher-dropdown {
  backdrop-filter: blur(20px);
  background: rgba(18, 18, 18, 0.95);
  border: 1px solid #2a2a2a;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

[data-theme="nexus"] .project-item:hover {
  background: #1a1a1a;
}
```

**GRID (Tron 80s):**
```css
[data-theme="grid"] .project-switcher-dropdown {
  background: rgba(0, 5, 5, 0.95);
  border: 1px solid #00E5FF;
  box-shadow: 
    0 0 10px rgba(0, 229, 255, 0.3),
    inset 0 0 5px rgba(0, 229, 255, 0.2);
}

[data-theme="grid"] .project-item {
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 12px;
}

[data-theme="grid"] .project-item:hover {
  background: rgba(0, 229, 255, 0.1);
  box-shadow: inset 0 0 8px rgba(0, 229, 255, 0.2);
}

[data-theme="grid"] .project-item[data-active="true"] {
  color: #00E5FF;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.6);
}

/* Scanline effect */
[data-theme="grid"] .project-switcher-dropdown::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
  background-size: 100% 2px;
  pointer-events: none;
  z-index: 1;
}
```

**LOVE (Ive Minimalist):**
```css
[data-theme="love"] .project-switcher-dropdown {
  backdrop-filter: blur(20px) saturate(180%);
  background: rgba(245, 245, 247, 0.9); /* Light mode */
  border: 0.5px solid #D2D2D7;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

[data-theme="love"][data-color-scheme="dark"] .project-switcher-dropdown {
  background: rgba(29, 29, 31, 0.9);
  border: 0.5px solid #3A3A3C;
}

[data-theme="love"] .project-item {
  font-family: 'SF Pro', 'Inter', -apple-system, sans-serif;
  letter-spacing: -0.01em;
  border-radius: 6px;
}

[data-theme="love"] .project-item:hover {
  background: rgba(0, 122, 255, 0.08);
}

[data-theme="love"] .project-item:focus {
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.3);
  outline: none;
}
```

---

#### Accessibility Requirements

**ARIA Attributes:**
```tsx
<button
  aria-haspopup="menu"
  aria-expanded={isOpen}
  aria-label="Switch project"
>
  {currentProject.name}
</button>

<div
  role="menu"
  aria-label="Recent projects"
  aria-activedescendant={highlightedId}
>
  <div
    role="menuitem"
    id={project.id}
    tabIndex={-1}
    aria-current={isActive ? "true" : undefined}
  >
    {project.name}
  </div>
</div>
```

**Contrast Requirements:**
- Text on background: Minimum 4.5:1 (WCAG AA)
- Active indicator: Minimum 3:1 against background
- Focus ring: Minimum 3:1 against background

**Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  .project-switcher-dropdown {
    animation: none;
    transition: opacity 0.1s ease;
  }
  
  .project-item {
    transition: background 0.05s ease;
  }
  
  .project-name[data-unsaved="true"]::after {
    animation: none;
    opacity: 1;
  }
}
```

**Keyboard Focus Indicators:**
```css
.project-item:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

/* Theme-specific focus */
[data-theme="grid"] .project-item:focus-visible {
  outline-color: #FF3C00; /* MCP red */
}

[data-theme="love"] .project-item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.3);
}
```

---

#### Component Structure

```tsx
interface ProjectSwitcherProps {
  currentProject: Project;
  recentProjects: Project[];
  onProjectSelect: (projectId: string) => void;
  onOpenProject: () => void;
  hasUnsavedChanges: boolean;
}

interface Project {
  id: string;
  name: string;
  path: string;
  lastOpened: Date;
}
```

---

#### UI Layout

```
┌──────────────────────────────────────────────────────────┐
│ ● ● ●   Sumerian● ▾   │   Sumerian IDE                   │
└──────────────────────────────────────────────────────────┘
          ↓ (animated dropdown with spring physics)
┌─────────────────────────────────────┐
│  ✓ Sumerian                         │ ← Active (accent color)
│    MyWebApp                         │ ← Hover (bg-tertiary)
│    AnotherProject                   │
│    OldProject                       │
├─────────────────────────────────────┤
│    📁 Open Project...               │
└─────────────────────────────────────┘
     ↑ Tooltip on hover: /Users/sebastian/Dev/Sumerian

● = Unsaved changes indicator (pulsing)
▾ = Dropdown chevron (rotates 180° when open)
✓ = Active project checkmark
```

---

#### Performance Requirements

- Dropdown open latency: < 50ms
- Animation frame rate: 60fps (16ms per frame)
- Keyboard navigation response: < 100ms
- Tooltip delay: 500ms
- Memory overhead: < 1MB

---

#### Testing Checklist

- [ ] Dropdown opens/closes with smooth animation
- [ ] Keyboard navigation works (arrows, Enter, Esc)
- [ ] Focus trap prevents tabbing outside dropdown
- [ ] Tooltip appears after 500ms hover
- [ ] Active project shows checkmark and accent color
- [ ] Unsaved indicator pulses correctly
- [ ] All three themes render correctly
- [ ] Reduced motion disables animations
- [ ] ARIA attributes present and correct
- [ ] Contrast ratios meet WCAG AA
- [ ] Works with screen readers
- [ ] Click outside closes dropdown
- [ ] Esc key closes dropdown and restores focus

---

### Task B.7: Testing & Documentation ⬜
**Estimate:** 3 hours | **Priority:** Medium

Create tests and documentation for multi-project support.

**Subtasks:**
- [ ] Unit tests for ProjectManager
- [ ] Unit tests for CLISessionManager
- [ ] Unit tests for ProjectConfig
- [ ] E2E test: Open project via switcher
- [ ] E2E test: Switch between projects
- [ ] E2E test: Session preservation
- [ ] Update README with multi-project usage
- [ ] Document keyboard shortcuts

**Files to Create:**
- `tests/unit/ProjectManager.test.ts`
- `tests/unit/CLISessionManager.test.ts`
- `tests/e2e/projects.spec.ts`

**Files to Modify:**
- `docs/COMMANDS.md` - Add project commands

---

## Technical Implementation

### Project Switch Flow

```
User presses Cmd+O
        │
        ▼
┌─────────────────────┐
│  ProjectSwitcher    │ ◄── Shows recent projects
│  Modal Opens        │
└─────────┬───────────┘
          │ User selects project
          ▼
┌─────────────────────┐
│  Auto-save current  │ ◄── SessionManager.saveSession()
│  session            │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Switch CLI session │ ◄── CLISessionManager.switchSession()
│                     │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Load project       │ ◄── ProjectConfig.loadConfig()
│  config             │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Restore last       │ ◄── SessionManager.loadSession()
│  session            │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Update UI state    │ ◄── useAppStore.setProject()
│                     │
└─────────────────────┘
```

### IPC Channels

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `project:list-recent` | R→M | Get recent projects |
| `project:switch` | R→M | Switch to project |
| `project:get-config` | R→M | Load project config |
| `project:set-config` | R→M | Save project config |
| `project:remove` | R→M | Remove from registry |

---

## Dependencies

**New:** None

**Existing:**
- `SessionManager` - Already handles per-project sessions
- `CLIManager` - Needs refactoring for multi-instance
- `useAppStore` - Needs project metadata state

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Memory usage with multiple CLI instances | High | Lazy initialization, terminate idle sessions |
| State sync complexity | Medium | Single source of truth in main process |
| File watcher conflicts | Low | Scope watchers to active project only |
| Session data corruption | Medium | Atomic writes, backup before switch |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Project switch time | <500ms |
| Session restore accuracy | 100% |
| Memory per idle session | <50MB |
| Recent projects limit | 10 |

---

## Sprint Definition of Done

- [ ] `Cmd+O` opens project switcher
- [ ] Recent projects displayed and selectable
- [ ] CLI sessions isolated per project
- [ ] Conversation history preserved on switch
- [ ] Per-project config supported
- [ ] Project name visible in title bar
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Documentation updated

---

## Progress Log

### January 30, 2026 - Session 1
**Completed:**
- ✅ **Task B.1: Project Registry** (Already implemented)
  - `ProjectManager.ts` with full registry functionality
  - IPC handlers for project management
  - Type definitions in `types.ts`
  
- ✅ **Task B.2: Project Switcher Modal**
  - Created `ProjectSwitcher.tsx` component
  - Implemented search/filter functionality
  - Added keyboard navigation (↑/↓/Enter/Escape)
  - Integrated `Cmd+O` keyboard shortcut
  - Added state management in `useAppStore`
  - Integrated into App.tsx for both welcome and main views
  - Follows Nexus design system

- ✅ **Task B.3: Isolated CLI Sessions** (Already implemented)
  - `CLISessionManager.ts` manages multiple CLI instances
  - Session isolation per project path
  - IPC handlers route to correct session

- ✅ **Task B.4: Session Preservation** (Already implemented)
  - Enhanced `setRootPath()` with auto-save/restore logic
  - Auto-save current session before switching projects
  - Update ProjectManager with current session ID
  - Auto-restore last session when opening a project
  - Three-tier restoration priority: lastSessionId → latestId → new session
  - Conversation history and token usage preserved per project
  - Fallback logic for fresh projects

- ✅ **Task B.5: Per-Project Config**
  - Created `ProjectConfig.ts` with validation and merge logic
  - Added "Project" tab to SettingsModal with full config UI
  - Config persistence to `.sumerian/config.json`
  - IPC handlers already implemented for load/save operations
  - Supports overrides for: brave mode, model, MCP config, additional dirs, tool whitelist/blacklist
  - Build verified successfully with `npm run package`

**Next Steps:**
- Task B.6: Quick Switch UI (optional - low priority)
- Task B.7: Testing & Documentation

---

*Sprint 20-B — Sumerian Multi-Project Workspaces*
*Started: January 30, 2026*
