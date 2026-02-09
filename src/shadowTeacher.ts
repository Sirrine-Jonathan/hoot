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
        this.clearHints(editor);

        this._timeout = setTimeout(() => {
            this._provideShadowHint(editor);
        }, 2000); // Wait 2 seconds of inactivity
    }

    public clearHints(editor?: vscode.TextEditor) {
        const targetEditor = editor || vscode.window.activeTextEditor;
        if (targetEditor) {
            targetEditor.setDecorations(this._decorationType, []);
            vscode.commands.executeCommand('setContext', 'hoot.hintsVisible', false);
        }
    }

    private async _provideShadowHint(editor: vscode.TextEditor) {
        const context = await ContextEngine.getContext(editor);
        
        // Get diagnostics at the current line
        const diagnostics = vscode.languages.getDiagnostics(editor.document.uri)
            .filter(d => d.range.start.line <= context.currentLine && d.range.end.line >= context.currentLine);
        
        const diagContext = diagnostics.length > 0 
            ? "DIAGNOSTICS (Errors/Warnings):\n" + diagnostics.map(d => `- [${vscode.DiagnosticSeverity[d.severity]}] ${d.message}`).join("\n")
            : "No active errors on this line.";

        const prompt = "You are Hoot's 'Shadow Teacher'. You provide Socratic mentoring directly in the code.\n" +
            "CONTEXT:\n" +
            "File: " + context.filename + "\n" +
            diagContext + "\n" +
            "Relevant Scope:\n" +
            "```" + context.languageId + "\n" +
            context.relevantScope + "\n" +
            "```\n" +
            "Current Line Number: " + context.currentLine + "\n\n" +
            "TASK:\n" +
            "Analyze the code at line " + context.currentLine + ".\n" +
            "If there is a diagnostic error, EXPLAIN IT SOCRATICALLY. Ask why the compiler is unhappy and nudge them toward the fix.\n" +
            "Otherwise, look for general learning opportunities.\n" +
            "Provide a response in exactly this JSON format:\n" +
            "{\n" +
            "  \"tease\": \"[A short insight + a Socratic question]\",\n" +
            "  \"answer\": \"[The detailed explanation/answer to the question]\"\n" +
            "}\n\n" +
            "RULES:\n" +
            "1. TEASE MUST BE SHORT (max 12 words). It appears at the end of the line.\n" +
            "2. IF THERE IS AN ERROR, prioritize teaching how to resolve it.\n" +
            "3. ANSWER is shown when the user hovers. It should be clear and helpful.\n" +
            "4. If the code is trivial and error-free, return {\"tease\": \"NONE\", \"answer\": \"\"}.\n" +
            "5. NEVER give the answer in the tease.\n\n" +
            "RESPONSE:";

        try {
            const response = await this._geminiService.ask(prompt);
            
            // Try to parse JSON from the response (Gemini might wrap it in code blocks)
            const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr);
            
            if (data.tease && data.tease !== "NONE" && !response.includes("error")) {
                this._applyHint(editor, context.currentLine, data.tease, data.answer, diagnostics.length > 0);
            }
        } catch (e) {
            console.error("Shadow hint failed", e);
        }
    }

    private _applyHint(editor: vscode.TextEditor, line: number, tease: string, answer: string, hasError: boolean = false) {
        const range = new vscode.Range(line, 0, line, 1000);
        
        const hoverMessage = new vscode.MarkdownString();
        hoverMessage.appendMarkdown(`### 🦉 Hoot's ${hasError ? 'Error Guide' : 'Lesson'}\n\n`);
        hoverMessage.appendMarkdown(`${answer}\n\n`);
        hoverMessage.appendMarkdown(`--- \n*Press Escape to clear this hint*`);
        hoverMessage.isTrusted = true;

        const decoration: vscode.DecorationOptions = {
            range,
            hoverMessage,
            renderOptions: {
                after: {
                    contentText: (hasError ? " 🦉 ERROR: " : " 🦉 ") + tease,
                    color: hasError ? new vscode.ThemeColor('errorForeground') : new vscode.ThemeColor('editorGhostText.foreground')
                }
            }
        };

        editor.setDecorations(this._decorationType, [decoration]);
        vscode.commands.executeCommand('setContext', 'hoot.hintsVisible', true);
    }

    public dispose() {
        this._disposables.forEach(d => d.dispose());
        this._decorationType.dispose();
    }
}