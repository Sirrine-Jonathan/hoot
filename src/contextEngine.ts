import * as vscode from 'vscode';

export interface CodeContext {
    fullContent: string;
    relevantScope: string;
    currentLine: number;
    languageId: string;
    filename: string;
}

export class ContextEngine {
    /**
     * Extracts the most relevant code scope based on the cursor position.
     * Cascades from current symbol -> parent symbol -> full page if necessary.
     */
    public static async getContext(editor: vscode.TextEditor): Promise<CodeContext> {
        const document = editor.document;
        const position = editor.selection.active;
        const currentLine = position.line;

        let relevantScope = "";
        
        try {
            // Get symbol hierarchy (requires a language server to be active for that file)
            const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                document.uri
            );

            if (symbols && symbols.length > 0) {
                const targetSymbol = this._findDeepestSymbol(symbols, position);
                if (targetSymbol) {
                    relevantScope = document.getText(targetSymbol.range);
                }
            }
        } catch (e) {
            console.error("Symbol provider failed, falling back to line-based context", e);
        }

        // If no scope found via symbols, or scope is too small, take surrounding lines
        if (!relevantScope || relevantScope.length < 50) {
            const startLine = Math.max(0, currentLine - 20);
            const endLine = Math.min(document.lineCount - 1, currentLine + 20);
            relevantScope = document.getText(new vscode.Range(startLine, 0, endLine, 1000));
        }

        return {
            fullContent: document.getText(), // We have it if tokens allow
            relevantScope: relevantScope,
            currentLine: currentLine,
            languageId: document.languageId,
            filename: document.fileName
        };
    }

    private static _findDeepestSymbol(symbols: vscode.DocumentSymbol[], position: vscode.Position): vscode.DocumentSymbol | undefined {
        for (const symbol of symbols) {
            if (symbol.range.contains(position)) {
                // Check children
                if (symbol.children && symbol.children.length > 0) {
                    const child = this._findDeepestSymbol(symbol.children, position);
                    if (child) { return child; }
                }
                return symbol;
            }
        }
        return undefined;
    }
}
