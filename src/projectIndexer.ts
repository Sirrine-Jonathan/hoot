import * as vscode from 'vscode';

export class ProjectIndexer {
    /**
     * Generates a high-level summary of the project structure and key files.
     */
    public static async getProjectMap(): Promise<string> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) { return "No workspace open."; }

        try {
            // 1. Get file list (limited to 100 files for high-level view)
            const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**', 100);
            const fileList = files.map(f => vscode.workspace.asRelativePath(f)).join('\n');

            // 2. Look for entry points and config files
            const importantFiles = await vscode.workspace.findFiles('{package.json,README.md,tsconfig.json,requirements.txt,main.py,src/index.ts,src/main.ts,src/App.tsx}', '**/node_modules/**', 20);
            
            let contextSnippets = "";
            for (const file of importantFiles) {
                try {
                    const doc = await vscode.workspace.openTextDocument(file);
                    const text = doc.getText();
                    // Take first 50 lines of important files to understand "The Why"
                    const snippet = text.split('\n').slice(0, 50).join('\n');
                    contextSnippets += `\n--- FILE: ${vscode.workspace.asRelativePath(file)} ---\n${snippet}\n`;
                } catch (e) {
                    console.error(`Failed to read important file: ${file.fsPath}`, e);
                }
            }

            return `PROJECT STRUCTURE:\n${fileList}\n\nKEY FILE CONTEXT:\n${contextSnippets}`;
        } catch (error: any) {
            return `Failed to index project: ${error.message}`;
        }
    }
}