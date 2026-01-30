import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';

export interface LoreFile {
    name: string;
    path: string;
    content: string;
}

export class LoreManager {
    private projectRoot: string;
    private loreDir: string;

    constructor(projectRoot: string) {
        this.projectRoot = projectRoot;
        this.loreDir = path.join(projectRoot, '.sumerian', 'lore');
    }

    /**
     * Scans the .sumerian/lore directory for markdown files.
     */
    public async scanLore(): Promise<LoreFile[]> {
        if (!existsSync(this.loreDir)) {
            return [];
        }

        try {
            const files = await fs.readdir(this.loreDir);
            const markdownFiles = files.filter(file => file.endsWith('.md'));

            const loreFiles: LoreFile[] = [];
            for (const file of markdownFiles) {
                const filePath = path.join(this.loreDir, file);
                const content = await fs.readFile(filePath, 'utf-8');
                loreFiles.push({
                    name: file,
                    path: filePath,
                    content
                });
            }
            return loreFiles;
        } catch (error) {
            console.error('Error scanning lore files:', error);
            return [];
        }
    }

    /**
     * Formats lore files into a single system instruction string.
     */
    public formatLoreForInjection(loreFiles: LoreFile[]): string {
        if (loreFiles.length === 0) return '';

        let injection = "IMPORTANT: Follow these project-specific design principles and guidelines:\n\n";
        for (const file of loreFiles) {
            injection += `--- BEGIN LORE: ${file.name} ---\n`;
            injection += file.content;
            injection += `\n--- END LORE: ${file.name} ---\n\n`;
        }
        return injection;
    }
}
