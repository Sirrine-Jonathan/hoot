import ollama from 'ollama';
import { IAIService, AIModel, AIProvider } from './aiService';
import { toolFunctions, tutorialTools } from './tools/tutorialTools';
import { contextFunctions, contextTools } from './tools/contextTools';

export class OllamaService implements IAIService {
    public readonly name = "Ollama";
    public readonly provider: AIProvider = 'Ollama';
    private _currentModelName: string = "qwen2.5-coder:7b";
    private _history: { role: string, content: string, tool_calls?: any[] }[] = [];

    // Combined tool implementations
    private _toolRegistry: Record<string, Function> = {
        ...toolFunctions,
        ...contextFunctions
    };

    constructor() {}

    async getAvailableModels(): Promise<AIModel[]> {
        try {
            const response = await ollama.list();
            return response.models.map(m => ({
                name: m.name,
                displayName: m.name
            }));
        } catch (error) {
            console.error('Error fetching Ollama models:', error);
            return [];
        }
    }

    async switchModel(modelName: string): Promise<void> {
        this._currentModelName = modelName;
        this._history = [];
    }

    async checkConnection(): Promise<boolean> {
        try {
            await ollama.list();
            return true;
        } catch {
            return false;
        }
    }

    async ask(prompt: string): Promise<string> {
        try {
            this._history.push({ role: 'user', content: prompt });

            const systemInstruction = "You are Hoot, an AI-powered Teacher Agent for VS Code. Your goal is to guide students using the Socratic method. Never give the full answer immediately. Instead, ask guiding questions, provide hints, and explain the 'why' behind concepts. Encourage the student and help them break down complex problems into smaller steps. Use the 'create_tutorial' tool when a comprehensive guide is needed. Use the context tools ('read_active_file', 'read_selected_code', 'list_files') to understand what the user is working on so you can provide specific, contextual help.";

            const tools = this._getTools();

            let response = await ollama.chat({
                model: this._currentModelName,
                messages: [{ role: 'system', content: systemInstruction }, ...this._history],
                tools: tools
            });

            while (response.message.tool_calls && response.message.tool_calls.length > 0) {
                console.log(`Ollama requested ${response.message.tool_calls.length} tool calls`);
                this._history.push(response.message);
                
                for (const call of response.message.tool_calls) {
                    const name = call.function.name;
                    const args = call.function.arguments;

                    console.log(`Hoot (Ollama) calling tool: ${name}`, args);

                    if (this._toolRegistry[name]) {
                        try {
                            const toolResult = await this._toolRegistry[name](args);
                            this._history.push({
                                role: 'tool',
                                content: JSON.stringify(toolResult)
                            });
                        } catch (e: any) {
                            this._history.push({
                                role: 'tool',
                                content: JSON.stringify({ error: `Tool execution failed: ${e.message}` })
                            });
                        }
                    } else {
                        this._history.push({
                            role: 'tool',
                            content: JSON.stringify({ error: `Tool ${name} not found.` })
                        });
                    }
                }

                response = await ollama.chat({
                    model: this._currentModelName,
                    messages: [{ role: 'system', content: systemInstruction }, ...this._history],
                    tools: tools
                });
            }

            this._history.push(response.message);
            return response.message.content;
        } catch (error: any) {
            console.error('Error calling Ollama:', error);
            const errorMessage = error.message || '';
            
            if (errorMessage.includes('fetch failed')) {
                return "I couldn't connect to Ollama. Is it running on localhost:11434?\n\nIf you haven't set it up yet, please click the Settings icon above and select 'Setup Ollama'.";
            }
            
            if (errorMessage.includes('not found')) {
                return `The model '${this._currentModelName}' is not installed in your Ollama. Would you like me to pull it for you?\n\n[PULL_MODEL_ACTION:${this._currentModelName}]`;
            }

            return `Sorry, I encountered an error with Ollama: ${errorMessage || 'Unknown error'}`;
        }
    }

    private _getTools() {
        const allGeminiTools = [...tutorialTools, ...contextTools];
        const ollamaTools: any[] = [];

        for (const tool of allGeminiTools) {
            const anyTool = tool as any;
            if (anyTool.functionDeclarations) {
                for (const declaration of anyTool.functionDeclarations) {
                    ollamaTools.push({
                        type: 'function',
                        function: {
                            name: declaration.name,
                            description: declaration.description,
                            parameters: declaration.parameters
                        }
                    });
                }
            }
        }

        return ollamaTools.length > 0 ? ollamaTools : undefined;
    }
}
