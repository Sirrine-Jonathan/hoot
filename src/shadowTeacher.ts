import * as vscode from 'vscode';
import { IAIService } from './aiService';
import { ContextEngine } from './contextEngine';

export class ShadowTeacher implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    private _currentHint: { line: number, tease: string, answer: string, hasError: boolean } | undefined;
    private _decorationType: vscode.TextEditorDecorationType;
    private _disposables: vscode.Disposable[] = [];
    private _timeout: NodeJS.Timeout | undefined;

    constructor(private _aiService: IAIService) {
        // Gutter icon decoration (Hoot icon)
        this._decorationType = vscode.window.createTextEditorDecorationType({
            gutterIconPath: vscode.Uri.parse('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI4IiBjeT0iOCIgcj0iNyIgZmlsbD0iIzRmNDZlNSIvPjxwYXRoIGQ9Ik01IDV2Nm02LTZ2Nm0tNi0zaDYiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMS41Ii8+PC9zdmc+'),
            gutterIconSize: 'contain'
        });

        // Register events
        vscode.window.onDidChangeTextEditorSelection(e => this._scheduleUpdate(e.textEditor), null, this._disposables);
        vscode.workspace.onDidChangeTextDocument(e => {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && e.document === activeEditor.document) {
                this._scheduleUpdate(activeEditor);
            }
        }, null, this._disposables);

        // Register this class as a CodeLens provider
        this._disposables.push(vscode.languages.registerCodeLensProvider({ pattern: '**/*' }, this));
    }

    private _scheduleUpdate(editor: vscode.TextEditor) {
        if (this._timeout) { clearTimeout(this._timeout); }
        
        // If user is typing/moving, clear the CURRENT hint to keep it responsive
        if (this._currentHint) {
            this.clearHints(editor);
        }

        this._timeout = setTimeout(() => {
            this._provideShadowHint(editor);
        }, 2000);
    }

    public clearHints(editor?: vscode.TextEditor) {
        this._currentHint = undefined;
        const targetEditor = editor || vscode.window.activeTextEditor;
        if (targetEditor) {
            targetEditor.setDecorations(this._decorationType, []);
        }
        this._onDidChangeCodeLenses.fire();
        vscode.commands.executeCommand('setContext', 'hoot.hintsVisible', false);
    }

    private async _provideShadowHint(editor: vscode.TextEditor) {
        if (!this._aiService) { return; }
        
        // Don't spam if not connected
        const isConnected = await this._aiService.checkConnection();
        if (!isConnected) { return; }

        const context = await ContextEngine.getContext(editor);
        
        // Get diagnostics at the current line
        const diagnostics = vscode.languages.getDiagnostics(editor.document.uri)
            .filter(d => d.range.start.line <= context.currentLine && d.range.end.line >= context.currentLine);
        
        const diagContext = diagnostics.length > 0 
            ? "DIAGNOSTICS (Errors/Warnings):\n" + diagnostics.map(d => `- [${vscode.DiagnosticSeverity[d.severity]}] ${d.message}`).join("\n")
            : "No active errors on this line.";

        const prompt = "You are Hoot's 'Shadow Teacher'. You provide Socratic mentoring above the code using CodeLens.\n" +
            "CONTEXT:\n" +
            "File: " + context.filename + "\n" +
            diagContext + "\n" +
            "Relevant Scope:\n" +
            "```" + context.languageId + "\n" +
            context.relevantScope + "\n" +
            "```\n" +
            "Current Line Number: " + context.currentLine + "\n\n" +
            "TASK:\n" +
            "Analyze line " + context.currentLine + ".\n" +
            "Provide exactly this JSON format:\n" +
            "{\n" +
            "  \"tease\": \"[One short Socratic nudge, max 10 words]\",\n" +
            "  \"answer\": \"[Detailed explanation]\"\n" +
            "}\n\n" +
            "RULES:\n" +
            "1. IF THERE IS AN ERROR, prioritize explaining it.\n" +
            "2. If trivial, return {\"tease\": \"NONE\", \"answer\": \"\"}.\n" +
            "RESPONSE:";

        try {
            const response = await this._aiService.ask(prompt);
            const data = this._extractJson(response);
            
            if (data && data.tease && data.tease !== "NONE" && !response.includes("error")) {
                this._currentHint = {
                    line: context.currentLine,
                    tease: data.tease,
                    answer: data.answer,
                    hasError: diagnostics.length > 0
                };

                // Apply gutter icon for visual feedback
                const range = new vscode.Range(context.currentLine, 0, context.currentLine, 0);
                editor.setDecorations(this._decorationType, [{
                    range,
                    hoverMessage: this._getHoverMessage(data.answer, diagnostics.length > 0)
                }]);

                this._onDidChangeCodeLenses.fire();
                vscode.commands.executeCommand('setContext', 'hoot.hintsVisible', true);
            }
        } catch (e) {
            console.error("Shadow hint failed", e);
        }
    }

    private _extractJson(text: string): any {
        try {
            // 1. Try direct parse
            return JSON.parse(text);
        } catch {
            try {
                // 2. Try to find JSON block
                const match = text.match(/\{[\s\S]*\}/);
                if (match) {
                    return JSON.parse(match[0]);
                }
            } catch (e) {
                console.error("Failed to extract JSON from response", text);
            }
        }
        return null;
    }

    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] {
        if (!this._currentHint || document.uri.fsPath !== vscode.window.activeTextEditor?.document.uri.fsPath) {
            return [];
        }

        const range = new vscode.Range(this._currentHint.line, 0, this._currentHint.line, 0);
        const lens = new vscode.CodeLens(range);
        
        lens.command = {
            title: (this._currentHint.hasError ? "🦉 ERROR: " : "🦉 ") + this._currentHint.tease,
            command: "hoot.openLesson",
            arguments: [this._currentHint.answer]
        };

        return [lens];
    }

    private _getHoverMessage(answer: string, hasError: boolean): vscode.MarkdownString {
        const hoverMessage = new vscode.MarkdownString();
        hoverMessage.appendMarkdown(`### 🦉 Hoot's ${hasError ? 'Error Guide' : 'Lesson'}\n\n`);
        hoverMessage.appendMarkdown(`${answer}\n\n`);
        hoverMessage.appendMarkdown(`--- \n*Click the hint above to open in chat*`);
        hoverMessage.isTrusted = true;
        return hoverMessage;
    }

    public dispose() {
        this._disposables.forEach(d => d.dispose());
        this._decorationType.dispose();
    }
}
