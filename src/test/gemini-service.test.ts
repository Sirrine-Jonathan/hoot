import * as assert from 'assert';
import { GeminiService } from '../geminiService';

suite('Gemini Service Test Suite', () => {
	test('GeminiService maintains conversation history', async () => {
        const mockModel: any = {
            startChat: (config: any) => {
                const history = config.history || [];
                return {
                    sendMessage: async (prompt: string) => {
                        const turnCount = history.length;
                        history.push({ role: 'user', parts: [{ text: prompt }] });
                        history.push({ role: 'model', parts: [{ text: 'Response' }] });
                        return {
                            response: { 
                                text: () => `Turn count before: ${turnCount}`,
                                functionCalls: () => [] 
                            }
                        };
                    }
                };
            }
        };

        const service = new GeminiService(mockModel);

        await service.ask('First message');
        const response = await service.ask('Second message');
        
        assert.ok(response.includes('Turn count before: 2'), `Expected history to have 2 entries before second message, got: ${response}`);
    });

    test('GeminiService handles function calls', async () => {
        let functionCalled = false;
        const mockModel: any = {
            startChat: () => {
                return {
                    sendMessage: async (msg: any) => {
                        // Check if this is the initial user prompt or the function response
                        if (typeof msg === 'string') {
                            // Initial prompt, return function call
                            return {
                                response: {
                                    text: () => "",
                                    functionCalls: () => [{
                                        name: 'check_url',
                                        args: { url: 'https://example.com' }
                                    }]
                                }
                            };
                        } else {
                            // Function response received
                            functionCalled = true;
                            // Check content of the message being sent back (the function response)
                             if (msg[0].functionResponse && msg[0].functionResponse.name === 'check_url') {
                                 // pass
                             }

                            return {
                                response: {
                                    text: () => "Function executed",
                                    functionCalls: () => []
                                }
                            };
                        }
                    }
                };
            }
        };

        const service = new GeminiService(mockModel);
        const response = await service.ask('Check this url');
        
        assert.strictEqual(response, 'Function executed');
        assert.strictEqual(functionCalled, true, 'Service should have sent back the function response');
    });
});
