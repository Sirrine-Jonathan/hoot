import * as vscode from 'vscode';
import { GeminiService } from './geminiService';

export class HootChatViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'hoot.chatView';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _getGeminiService: () => Promise<GeminiService | undefined>,
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
				case 'chat':
					{
						const service = await this._getGeminiService();
						if (!service) {
							webviewView.webview.postMessage({ type: 'chatResponse', text: 'Please set your Gemini API Key first using the "Hoot: Set Gemini API Key" command.' });
							return;
						}
						const response = await service.ask(data.text);
						webviewView.webview.postMessage({ type: 'chatResponse', text: response });
						break;
					}
			}
		});
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
