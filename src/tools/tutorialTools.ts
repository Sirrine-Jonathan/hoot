import * as vscode from 'vscode';
import * as path from 'path';
import { SchemaType, Tool } from '@google/generative-ai';

export const tutorialTools: Tool[] = [
    {
        functionDeclarations: [
            {
                name: "create_tutorial",
                description: "Creates a markdown tutorial file in the user's workspace and opens it. Use this when the user asks for a tutorial or comprehensive guide.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        filename: {
                            type: SchemaType.STRING,
                            description: "The name of the file to create, e.g., 'intro_to_python.md'. Must end in .md"
                        },
                        content: {
                            type: SchemaType.STRING,
                            description: "The full markdown content of the tutorial."
                        }
                    },
                    required: ["filename", "content"]
                }
            },
            {
                name: "check_url",
                description: "Validates if a URL is reachable (returns 200 OK). Use this before including links in tutorials to ensure they are valid.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        url: {
                            type: SchemaType.STRING,
                            description: "The URL to validate."
                        }
                    },
                    required: ["url"]
                }
            }
        ]
    }
];

export const toolFunctions = {
    create_tutorial: async (args: { filename: string, content: string }) => {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                return { success: false, message: "No workspace folder open. Please open a folder to save the tutorial." };
            }

            const rootPath = workspaceFolders[0].uri.fsPath;
            const fullPath = path.join(rootPath, args.filename);
            const uri = vscode.Uri.file(fullPath);

            await vscode.workspace.fs.writeFile(uri, Buffer.from(args.content, 'utf8'));
            
            // Open the document
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc);

            return { success: true, message: `Tutorial created at ${args.filename} and opened.` };
        } catch (error: any) {
            return { success: false, message: `Failed to create file: ${error.message}` };
        }
    },

    check_url: async (args: { url: string }) => {
        try {
            const response = await fetch(args.url, { method: 'HEAD' });
            return { 
                valid: response.ok, 
                status: response.status,
                message: response.ok ? "URL is valid" : `URL returned status ${response.status}`
            };
        } catch (error: any) {
            return { valid: false, message: `Network error: ${error.message}` };
        }
    }
};
