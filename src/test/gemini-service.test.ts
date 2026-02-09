import * as assert from 'assert';
import { GeminiService } from '../geminiService';

suite('Gemini Service Test Suite', () => {
	test('GeminiService maintains conversation history', async () => {
        const mockModel: any = {
            startChat: (config: any) => {
                const history = config.history || [];
                return {
                    sendMessage: async (prompt: string) => {
                        // In actual Gemini API, history reflects the state BEFORE this message is processed + the current message
                        // For simplicity in this mock, we check that history is accumulating.
                        const turnCount = history.length;
                        history.push({ role: 'user', parts: [{ text: prompt }] });
                        history.push({ role: 'model', parts: [{ text: 'Response' }] });
                        return {
                            response: { text: () => `Turn count before: ${turnCount}` }
                        };
                    }
                };
            }
        };

        const service = new GeminiService(mockModel);

        await service.ask('First message');
        const response = await service.ask('Second message');
        
        // After first message, history has 2 entries.
        // So before second message, it should have 2 entries.
        assert.ok(response.includes('Turn count before: 2'), `Expected history to have 2 entries before second message, got: ${response}`);
    });
});