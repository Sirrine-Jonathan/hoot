import * as vscode from 'vscode';
import { IAIService } from './aiService';

export class HootChatViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'hoot.chatView';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _getAIService: () => Promise<IAIService | undefined>,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(async data => {
			switch (data.command) {
				case 'ready':
					this._checkServiceStatus();
					break;
				case 'getModels':
					{
						const service = await this._getAIService();
						if (service) {
							const models = await service.getAvailableModels();
							webviewView.webview.postMessage({ type: 'modelsList', models });
						}
						break;
					}
				case 'switchModel':
					{
						const service = await this._getAIService();
						if (service) {
							await service.switchModel(data.modelName);
							webviewView.webview.postMessage({ type: 'chatResponse', text: `Switched to model: ${data.modelName}. Conversation history cleared.` });
						}
						break;
					}
				case 'chat':
					{
						const service = await this._getAIService();
						if (!service) {
							const provider = vscode.workspace.getConfiguration('hoot').get('provider', 'Gemini');
							const message = provider === 'Gemini' 
								? 'Please set your Gemini API Key first.'
								: 'Please ensure Ollama is running and accessible.';
							webviewView.webview.postMessage({ type: 'chatResponse', text: message });
							this._checkServiceStatus();
							return;
						}
						const response = await service.ask(data.text);
						webviewView.webview.postMessage({ type: 'chatResponse', text: response });
						break;
					}
				case 'setApiKey':
					{
						await vscode.commands.executeCommand('hoot.setApiKey');
						this._checkServiceStatus();
						break;
					}
				case 'removeApiKey':
					{
						await vscode.commands.executeCommand('hoot.removeApiKey');
						this._checkServiceStatus();
						break;
					}
				case 'switchProvider':
					{
						await vscode.commands.executeCommand('hoot.switchProvider');
						break;
					}
				case 'setupOllama':
					{
						await vscode.commands.executeCommand('hoot.setupOllama');
						break;
					}
			}
		});

		this._checkServiceStatus();
	}

	public refresh() {
		if (this._view) {
			this._view.webview.html = this._getHtmlForWebview(this._view.webview);
			this._checkServiceStatus();
		}
	}

	public showLesson(answer: string) {
		if (this._view) {
			this._view.show?.(true); // Ensure sidebar is visible
			this._view.webview.postMessage({ type: 'showLesson', text: answer });
		}
	}

	private async _checkServiceStatus() {
		const service = await this._getAIService();
		const isConnected = service ? await service.checkConnection() : false;
		
		this._view?.webview.postMessage({ 
			type: 'serviceStatus', 
			hasService: !!service,
			isConnected: isConnected,
			provider: service?.provider || 'Unknown'
		});
		
		// Compatibility for old UI
		this._view?.webview.postMessage({ type: 'apiKeyStatus', hasKey: !!service && isConnected });
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js'));

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Hoot Chat</title>
				<style>
					body { padding: 0; margin: 0; overflow: hidden; }
				</style>
			</head>
			<body>
				<div id="root"></div>
				<script src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}