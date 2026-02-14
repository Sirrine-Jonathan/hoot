// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { HootChatViewProvider } from './chatViewProvider';
import { GeminiService } from './geminiService';
import { OllamaService } from './ollamaService';
import { ShadowTeacher } from './shadowTeacher';
import { IAIService, AIProvider } from './aiService';
import { OllamaInstaller } from './ollamaInstaller';

export function activate(context: vscode.ExtensionContext) {
	let aiService: IAIService | undefined;
	let shadowTeacher: ShadowTeacher | undefined;

	const getAIService = async () => {
		if (aiService) {
			return aiService;
		}

		const provider = context.globalState.get<AIProvider>('hoot.provider', 'Gemini');
		
		if (provider === 'Gemini') {
			const apiKey = await getApiKey(context);
			if (apiKey) {
				aiService = new GeminiService(apiKey);
			}
		} else {
			aiService = new OllamaService();
		}

		if (aiService && !shadowTeacher) {
			shadowTeacher = new ShadowTeacher(aiService);
			context.subscriptions.push(shadowTeacher);
		}
		
		return aiService;
	};

	// Try to init service early
	getAIService();

	const provider = new HootChatViewProvider(context.extensionUri, getAIService);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(HootChatViewProvider.viewType, provider)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('hoot.setupOllama', async () => {
			await OllamaInstaller.ensureOllamaReady();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('hoot.pullModel', async (modelName: string) => {
			if (modelName) {
				await OllamaInstaller.pullModel(modelName);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('hoot.switchProvider', async () => {
			const choice = await vscode.window.showQuickPick(['Gemini', 'Ollama'], {
				placeHolder: 'Select AI Provider'
			});

			if (choice) {
				await context.globalState.update('hoot.provider', choice);
				aiService = undefined;
				if (shadowTeacher) {
					shadowTeacher.dispose();
					shadowTeacher = undefined;
				}
				const newService = await getAIService();
				vscode.window.showInformationMessage(`Switched to ${choice} provider.`);
				provider.refresh(); // Refresh webview
			}
		})
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
				
				// Reset services if currently using Gemini
				const currentProvider = context.globalState.get<AIProvider>('hoot.provider', 'Gemini');
				if (currentProvider === 'Gemini') {
					aiService = undefined;
					if (shadowTeacher) {
						shadowTeacher.dispose();
						shadowTeacher = undefined;
					}
					getAIService();
				}
				
				vscode.window.showInformationMessage('Gemini API Key saved securely.');
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('hoot.removeApiKey', async () => {
			await context.secrets.delete('gemini-api-key');
			
			// Reset services if currently using Gemini
			const currentProvider = context.globalState.get<AIProvider>('hoot.provider', 'Gemini');
			if (currentProvider === 'Gemini') {
				aiService = undefined;
				if (shadowTeacher) {
					shadowTeacher.dispose();
					shadowTeacher = undefined;
				}
			}
			
			vscode.window.showInformationMessage('Gemini API Key removed.');
			provider.refresh(); // Update the UI status
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('hoot.testConnection', async () => {
			const service = await getAIService();
			if (!service) {
				vscode.window.showErrorMessage('AI Service not initialized. Please check your settings.');
				return;
			}

			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Testing ${service.name} Connection...`,
				cancellable: false
			}, async () => {
				const response = await service.ask('Hello, are you there? Respond with "Yes, I am Hoot!" if you can hear me.');
				vscode.window.showInformationMessage(`${service.name} Response: ${response}`);
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

	context.subscriptions.push(
		vscode.commands.registerCommand('hoot.openLesson', (answer: string) => {
			provider.showLesson(answer);
		})
	);
}

export async function getApiKey(context: vscode.ExtensionContext): Promise<string | undefined> {
	return await context.secrets.get('gemini-api-key');
}

// This method is called when your extension is deactivated
export function deactivate() {}