import * as path from 'path';

export class SandboxValidator {
    private projectRoot: string;

    constructor(projectRoot: string) {
        this.projectRoot = path.resolve(projectRoot);
    }

    public isPathInSandbox(targetPath: string): boolean {
        const absolutePath = path.resolve(targetPath);
        return absolutePath.startsWith(this.projectRoot);
    }

    public validateAccess(targetPath: string): { allowed: boolean; reason?: string } {
        if (!this.isPathInSandbox(targetPath)) {
            return {
                allowed: false,
                reason: `Access denied: Path is outside the project sandbox (${this.projectRoot})`
            };
        }
        return { allowed: true };
    }
}
