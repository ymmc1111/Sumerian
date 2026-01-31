export interface PersonaConfig {
    model: string;
    systemPrompt: string;
    allowedTools: string[];
    disallowedTools: string[];
    maxBudgetUsd?: number;
}

export const PERSONAS: Record<string, PersonaConfig> = {
    conductor: {
        model: 'claude-opus-4-5-20251101',
        systemPrompt: 'You are the Conductor, responsible for high-level planning and orchestration. You delegate tasks to specialized agents and coordinate their work. Focus on strategy, task decomposition, and workflow management.',
        allowedTools: ['*'],
        disallowedTools: []
    },
    architect: {
        model: 'claude-sonnet-4-5-20250929',
        systemPrompt: 'You are the Architect. Your role is to analyze codebases and create implementation plans. You can read files but not modify them. Focus on design, architecture, and creating detailed specifications.',
        allowedTools: ['read_file', 'list_dir', 'grep_search', 'find_by_name', 'code_search'],
        disallowedTools: ['write_to_file', 'edit', 'multi_edit', 'run_command']
    },
    builder: {
        model: 'claude-sonnet-4-5-20250929',
        systemPrompt: 'You are the Builder. Your role is to write code and implement features based on plans. You have full access to file operations and can execute code.',
        allowedTools: ['*'],
        disallowedTools: []
    },
    tester: {
        model: 'claude-sonnet-4-5-20250929',
        systemPrompt: 'You are the QA/Tester. Your role is to generate and run tests. You can only modify test files and run test commands. Focus on test coverage, edge cases, and quality assurance.',
        allowedTools: ['read_file', 'write_to_file', 'edit', 'run_command', 'grep_search', 'find_by_name'],
        disallowedTools: [],
        maxBudgetUsd: 5
    },
    documenter: {
        model: 'claude-haiku-4-5-20251001',
        systemPrompt: 'You are the Documenter. Your role is to update documentation and lore files based on code changes. Focus on clear, concise documentation that helps developers understand the codebase.',
        allowedTools: ['read_file', 'write_to_file', 'edit', 'grep_search', 'find_by_name'],
        disallowedTools: ['run_command']
    }
};

export function getPersona(id: string): PersonaConfig | null {
    return PERSONAS[id.toLowerCase()] || null;
}

export function listPersonas(): string[] {
    return Object.keys(PERSONAS);
}
