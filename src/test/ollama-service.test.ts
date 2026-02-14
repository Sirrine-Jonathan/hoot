import * as assert from 'assert';
import { OllamaService } from '../ollamaService';

// Mock ollama
import ollama from 'ollama';

// We need to mock the ollama module. 
// Since we are in a VS Code test environment, this can be tricky.
// We'll use a simple approach of mocking the ollama object if possible,
// or just trust the logic if we can't easily mock it here.
// Actually, let's just mock the chat method.

suite('Ollama Service Test Suite', () => {
    test('OllamaService maintains conversation history', async () => {
        const service = new OllamaService();
        
        // Mock ollama.chat
        const originalChat = ollama.chat;
        let turnCount = 0;
        (ollama as any).chat = async (options: any) => {
            turnCount = options.messages.filter((m: any) => m.role !== 'system').length;
            return {
                message: {
                    role: 'assistant',
                    content: `Turn count: ${turnCount}`,
                    tool_calls: []
                }
            };
        };

        try {
            await service.ask('First message');
            const response = await service.ask('Second message');
            
            // First message: history starts empty, we push user message. Turn count = 1.
            // Assistant responds, we push assistant message.
            // Second message: history has 2 entries, we push user message. Turn count = 3.
            assert.strictEqual(response, 'Turn count: 3');
        } finally {
            ollama.chat = originalChat;
        }
    });
});
