import * as assert from 'assert';
import * as vscode from 'vscode';
import { HootChatViewProvider } from '../chatViewProvider';
import { GeminiService } from '../geminiService';

suite('Chat View Provider Test Suite', () => {
	vscode.window.showInformationMessage('Start Chat View tests.');

	test('HootChatViewProvider handles chat message', async () => {
		const provider = new HootChatViewProvider(vscode.Uri.file('/'), async () => undefined);
		
		let messageReceived = false;
		// Mock webviewView
		const mockWebviewView: any = {
			webview: {
				onDidReceiveMessage: (callback: any) => {
					mockWebviewView._messageCallback = callback;
					return { dispose: () => {} };
				},
				options: {},
				html: '',
                postMessage: async (message: any) => {
                    if (message.type === 'chatResponse') {
                        messageReceived = true;
                    }
                }
			}
		};

		provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);
		
		assert.ok(mockWebviewView._messageCallback, 'Message callback should be registered');

        // Simulate a chat message from webview
        await mockWebviewView._messageCallback({ command: 'chat', text: 'Hello' });

        assert.strictEqual(messageReceived, true, 'Should have received a chat response');
	});

    test('HootChatViewProvider uses GeminiService', async () => {
        const mockGeminiService = {
            ask: async (text: string) => `Response to: ${text}`
        } as GeminiService;

        const provider = new HootChatViewProvider(vscode.Uri.file('/'), async () => mockGeminiService);
        
        let lastResponse = '';
        const mockWebviewView: any = {
			webview: {
				onDidReceiveMessage: (callback: any) => {
					mockWebviewView._messageCallback = callback;
					return { dispose: () => {} };
				},
				options: {},
				html: '',
                postMessage: async (message: any) => {
                    if (message.type === 'chatResponse') {
                        lastResponse = message.text;
                    }
                }
			}
		};

		provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);
        await mockWebviewView._messageCallback({ command: 'chat', text: 'How do I code?' });

        assert.strictEqual(lastResponse, 'Response to: How do I code?');
    });
});
