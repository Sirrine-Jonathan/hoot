import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import ollama from 'ollama';

const execPromise = promisify(exec);

export class OllamaInstaller {
    public static async ensureOllamaReady(): Promise<boolean> {
        const isRunning = await this.checkOllamaRunning();
        
        if (!isRunning) {
            const isInstalled = await this.checkOllamaInstalled();
            if (!isInstalled) {
                const download = await vscode.window.showInformationMessage(
                    "Ollama is not installed or running. Would you like to download it?",
                    "Download Ollama", "Cancel"
                );
                if (download === "Download Ollama") {
                    vscode.env.openExternal(vscode.Uri.parse("https://ollama.com/download"));
                    vscode.window.showInformationMessage("Please install Ollama, start it, and try again.");
                }
                return false;
            } else {
                vscode.window.showWarningMessage("Ollama is installed but doesn't seem to be running. Please start the Ollama app.");
                return false;
            }
        }

        // If we reach here, it's running!
        // Ensure we have at least one model
        const models = await ollama.list();
        if (models.models.length === 0) {
            const pull = await vscode.window.showInformationMessage(
                "No Ollama models found. Should I pull 'qwen2.5-coder:7b' for you?",
                "Pull qwen2.5-coder:7b", "Cancel"
            );
            if (pull === "Pull qwen2.5-coder:7b") {
                await this.pullModel('qwen2.5-coder:7b');
                return true;
            }
            return false;
        }

        return true;
    }

    private static async checkOllamaInstalled(): Promise<boolean> {
        try {
            await execPromise('ollama --version');
            return true;
        } catch {
            // If not in PATH, try to find it in default Windows location
            if (process.platform === 'win32') {
                const localAppData = process.env.LOCALAPPDATA;
                if (localAppData) {
                    const defaultPath = require('path').join(localAppData, 'Ollama', 'ollama.exe');
                    const fs = require('node:fs');
                    if (fs.existsSync(defaultPath)) {
                        const fix = await vscode.window.showInformationMessage(
                            "Ollama was found but isn't in your system PATH. Would you like to add it?",
                            "Fix PATH", "Cancel"
                        );
                        if (fix === "Fix PATH") {
                            return await this.addOllamaToPath(require('path').dirname(defaultPath));
                        }
                    }
                }
            }
            return false;
        }
    }

    private static async addOllamaToPath(dirPath: string): Promise<boolean> {
        try {
            // Using PowerShell to safely append to the User PATH environment variable
            const command = `powershell -Command "[Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path', [EnvironmentVariableTarget]::User) + ';${dirPath}', [EnvironmentVariableTarget]::User)"`;
            await execPromise(command);
            vscode.window.showInformationMessage("Ollama added to PATH. You may need to restart VS Code for changes to take effect.");
            return true;
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to update PATH: ${error.message}`);
            return false;
        }
    }

    private static async checkOllamaRunning(): Promise<boolean> {
        try {
            await ollama.list();
            return true;
        } catch {
            return false;
        }
    }

    public static async pullModel(modelName: string): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Pulling ${modelName}...`,
            cancellable: false
        }, async (progress) => {
            try {
                // ollama.pull is async and provides progress updates
                const response = await ollama.pull({ model: modelName, stream: true });
                for await (const part of response) {
                    if (part.total) {
                        const percent = Math.round((part.completed / part.total) * 100);
                        progress.report({ message: `${percent}%`, increment: 0 });
                    }
                }
                vscode.window.showInformationMessage(`${modelName} pulled successfully!`);
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to pull ${modelName}: ${error.message}`);
            }
        });
    }
}
