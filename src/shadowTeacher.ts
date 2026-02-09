import * as vscode from 'vscode';
import { GeminiService } from './geminiService';
import { ContextEngine } from './contextEngine';

export class ShadowTeacher {
    private _decorationType: vscode.TextEditorDecorationType;
    private _disposables: vscode.Disposable[] = [];
    private _timeout: NodeJS.Timeout | undefined;

    constructor(private _geminiService: GeminiService) {
        this._decorationType = vscode.window.createTextEditorDecorationType({
            after: {
                margin: '0 0 0 3em',
                fontStyle: 'italic',
                color: new vscode.ThemeColor('editorGhostText.foreground')
            }
        });

        // Listen for selection changes (cursor movement)
        vscode.window.onDidChangeTextEditorSelection(e => {
            this._scheduleUpdate(e.textEditor);
        }, null, this._disposables);

        // Listen for content changes
        vscode.workspace.onDidChangeTextDocument(e => {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && e.document === activeEditor.document) {
                this._scheduleUpdate(activeEditor);
            }
        }, null, this._disposables);
    }

    private _scheduleUpdate(editor: vscode.TextEditor) {
        if (this._timeout) {
            clearTimeout(this._timeout);
        }
        
        // Clear existing decorations immediately when user starts moving/typing
        editor.setDecorations(this._decorationType, []);

        this._timeout = setTimeout(() => {
            this._provideShadowHint(editor);
        }, 2000); // Wait 2 seconds of inactivity
    }

    private async _provideShadowHint(editor: vscode.TextEditor) {
        const context = await ContextEngine.getContext(editor);
        
        // Use a more robust prompt format
        const prompt = "You are Hoot's 'Shadow Teacher'. You provide short, Socratic hints or questions directly in the code.\n" +
            "CONTEXT:\n" +
            "File: " + context.filename + "\n" +
            "Relevant Scope:\n" +
            "```" + context.languageId + "\n" +
            context.relevantScope + "\n" +
            "```\n" +
            "Current Line Number: " + context.currentLine + "\n\n" +
            "TASK:\n" +
            "Analyze the code at line " + context.currentLine + ". \n" +
            "If there is a learning opportunity (e.g., a complex block that could be explained, a non-idiomatic pattern, or a chance to ask 'why' a specific choice was made), provide a ONE-SENTENCE Socratic question or hint.\n" +
            "The hint will be shown at the end of the line.\n\n" +
            "RULES:\n" +
            "1. KEEP IT SHORT. Max 15 words.\n" +
            "2. DO NOT GIVE ANSWERS. Ask a question or provide a nudge.\n" +
            "3. If the code is simple/trivial, return exactly \"NONE\".\n" +
            "4. Focus on teaching concepts related to the language or logic.\n\n" +
            "HINT:";

        try {
            const response = await this._geminiService.ask(prompt);
            
            if (response && response.trim() !== "NONE" && !response.includes("error")) {
                this._applyHint(editor, context.currentLine, response.trim());
            }
        } catch (e) {
            console.error("Shadow hint failed", e);
        }
    }

    private _applyHint(editor: vscode.TextEditor, line: number, text: string) {
        const range = new vscode.Range(line, 0, line, 1000);
        const decoration: vscode.DecorationOptions = {
            range,
            renderOptions: {
                after: {
                    contentText: "🦉 Hoot: " + text
                }
            }
        };

        editor.setDecorations(this._decorationType, [decoration]);
    }

    public dispose() {
        this._disposables.forEach(d => d.dispose());
        this._decorationType.dispose();
    }
}