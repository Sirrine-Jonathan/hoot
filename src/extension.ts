// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { HootChatViewProvider } from './chatViewProvider';
import { GeminiService } from './geminiService';
import { ShadowTeacher } from './shadowTeacher';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let geminiService: GeminiService | undefined;
	let shadowTeacher: ShadowTeacher | undefined;

	const getGeminiService = async () => {
		if (geminiService) {
			return geminiService;
		}
		const apiKey = await getApiKey(context);
		if (apiKey) {
			geminiService = new GeminiService(apiKey);
			
			// Initialize shadow teacher once we have a service
			if (!shadowTeacher) {
				shadowTeacher = new ShadowTeacher(geminiService);
				context.subscriptions.push(shadowTeacher);
			}
			
			return geminiService;
		}
		return undefined;
	};

	// Try to init service early if key exists
	getGeminiService();

	const provider = new HootChatViewProvider(context.extensionUri, getGeminiService);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(HootChatViewProvider.viewType, provider)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('hoot.setApiKey', async () => {
			const apiKey = await vscode.window.showInputBox({
				prompt: 'Enter your Gemini API Key',
				password: true,
				ignoreFocusOut: true
			});

			if (apiKey) {
				const trimmedKey = apiKey.trim();
				await context.secrets.store('gemini-api-key', trimmedKey);
				
				// Reset services
				geminiService = undefined;
				if (shadowTeacher) {
					shadowTeacher.dispose();
					shadowTeacher = undefined;
				}
				
				// Re-init
				getGeminiService();
				
				console.log(`API Key updated. Length: ${trimmedKey.length}, Starts with: ${trimmedKey.substring(0, 3)}...`);
				vscode.window.showInformationMessage('Gemini API Key saved securely.');
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('hoot.checkApiKey', async () => {
			const apiKey = await getApiKey(context);
			if (apiKey) {
				vscode.window.showInformationMessage(`API Key is set (Length: ${apiKey.length}).`);
			} else {
				vscode.window.showWarningMessage('API Key is NOT set.');
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('hoot.testGemini', async () => {
			const service = await getGeminiService();
			if (!service) {
				vscode.window.showErrorMessage('Gemini Service not initialized. Please set API Key.');
				return;
			}

			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Testing Gemini Connection...",
				cancellable: false
			}, async () => {
				const response = await service.ask('Hello, are you there? Respond with "Yes, I am Hoot!" if you can hear me.');
				vscode.window.showInformationMessage(`Gemini Response: ${response}`);
			});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('hoot.clearHints', () => {
			if (shadowTeacher) {
				shadowTeacher.clearHints();
			}
		})
	);
}

export async function getApiKey(context: vscode.ExtensionContext): Promise<string | undefined> {
	return await context.secrets.get('gemini-api-key');
}

// This method is called when your extension is deactivated
export function deactivate() {}