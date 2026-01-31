export interface ProjectEntry {
    path: string;           // Absolute path to project root
    name: string;           // Display name (folder name by default)
    lastOpened: number;     // Unix timestamp
    lastSessionId?: string; // Reference to last active session
    configOverrides?: ProjectConfigOverrides;
}

export interface ProjectConfigOverrides {
    braveMode?: boolean;
    model?: string;
    mcpConfigPath?: string;
    additionalDirs?: string[];
    allowedTools?: string[];
    disallowedTools?: string[];
}

export interface ProjectRegistry {
    version: 1;
    projects: ProjectEntry[];
}

export interface ProjectConfig {
    version: 1;
    name?: string;              // Override display name
    braveMode?: boolean;        // Default brave mode state
    model?: string;             // Default model
    mcpConfigPath?: string;     // Project-specific MCP config
    additionalDirs?: string[];  // Extra directories to include
    allowedTools?: string[];    // Tool whitelist
    disallowedTools?: string[]; // Tool blacklist
}
