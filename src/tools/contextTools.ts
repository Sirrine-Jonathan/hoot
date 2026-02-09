import * as vscode from 'vscode';
import { SchemaType, Tool } from '@google/generative-ai';

export const contextTools: Tool[] = [
    {
        functionDeclarations: [
            {
                name: "read_active_file",
                description: "Reads the content of the file currently open in the active editor. Use this to understand the code the user is working on.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {},
                    required: []
                }
            },
            {
                name: "read_selected_code",
                description: "Reads the code currently selected (highlighted) by the user in the active editor.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {},
                    required: []
                }
            },
            {
                name: "list_files",
                description: "Lists files in the current workspace to understand the project structure.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        pattern: {
                            type: SchemaType.STRING,
                            description: "Optional glob pattern to filter files, e.g., '**/*.ts'"
                        }
                    },
                    required: []
                }
            },
            {
                name: "read_diagnostics",
                description: "Reads linting errors, warnings, or other diagnostics at the current cursor position. Use this to help explain bugs.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {},
                    required: []
                }
            }
        ]
    }
];

export const contextFunctions = {
    read_diagnostics: async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return { error: "No active editor found." };
        }
        const position = editor.selection.active;
        const diagnostics = vscode.languages.getDiagnostics(editor.document.uri)
            .filter(d => d.range.contains(position));
        
        return {
            diagnostics: diagnostics.map(d => ({
                message: d.message,
                severity: vscode.DiagnosticSeverity[d.severity],
                source: d.source
            }))
        };
    },
    read_active_file: async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return { error: "No active editor found." };
        }
        return {
            filename: editor.document.fileName,
            language: editor.document.languageId,
            content: editor.document.getText()
        };
    },

    read_selected_code: async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return { error: "No active editor found." };
        }
        const selection = editor.selection;
        const text = editor.document.getText(selection);
        return {
            filename: editor.document.fileName,
            selection: text || "Nothing selected."
        };
    },

    list_files: async (args: { pattern?: string }) => {
        try {
            const files = await vscode.workspace.findFiles(args.pattern || '**/*', '**/node_modules/**', 100);
            return {
                files: files.map(f => vscode.workspace.asRelativePath(f))
            };
        } catch (error: any) {
            return { error: `Failed to list files: ${error.message}` };
        }
    }
};
