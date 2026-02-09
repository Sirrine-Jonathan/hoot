import { GoogleGenerativeAI, GenerativeModel, ChatSession } from "@google/generative-ai";
import { tutorialTools, toolFunctions } from "./tools/tutorialTools";
import { contextTools, contextFunctions } from "./tools/contextTools";

export class GeminiService {
    private _genAI?: GoogleGenerativeAI;
    private _model: GenerativeModel;
    private _chat: ChatSession;
    private _apiKey: string;
    private _currentModelName: string = "models/gemini-2.0-flash";

    // Combined tool implementations
    private _toolRegistry: Record<string, Function> = {
        ...toolFunctions,
        ...contextFunctions
    };

    constructor(apiKeyOrModel: string | GenerativeModel) {
        if (typeof apiKeyOrModel === 'string') {
            this._apiKey = apiKeyOrModel;
            this._genAI = new GoogleGenerativeAI(apiKeyOrModel);
            this._model = this._createModel(this._currentModelName);
        } else {
            this._apiKey = '';
            this._model = apiKeyOrModel;
        }
        
        this._chat = this._model.startChat({
            history: [],
        });
    }

    private _createModel(modelName: string): GenerativeModel {
        if (!this._genAI) { throw new Error("GenAI not initialized"); }
        
        // Combine all tools
        const allTools = [...tutorialTools, ...contextTools];

        return this._genAI.getGenerativeModel({ 
            model: modelName,
            systemInstruction: {
                role: "system",
                parts: [{ text: "You are Hoot, an AI-powered Teacher Agent for VS Code. Your goal is to guide students using the Socratic method. Never give the full answer immediately. Instead, ask guiding questions, provide hints, and explain the 'why' behind concepts. Encourage the student and help them break down complex problems into smaller steps. Use the 'create_tutorial' tool when a comprehensive guide is needed. Use the context tools ('read_active_file', 'read_selected_code', 'list_files') to understand what the user is working on so you can provide specific, contextual help." }]
            },
            tools: allTools
        }, { apiVersion: 'v1beta' });
    }

    async getAvailableModels(): Promise<{ name: string, displayName: string }[]> {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${this._apiKey}`;
            const response = await fetch(url);
            const data: any = await response.json();
            
            return data.models
                .filter((m: any) => 
                    m.supportedGenerationMethods.includes('generateContent') && 
                    !m.name.includes('vision') && 
                    !m.name.includes('image') &&
                    !m.name.includes('embedding')
                )
                .map((m: any) => ({
                    name: m.name,
                    displayName: m.displayName
                }));
        } catch (error) {
            console.error('Error fetching models:', error);
            return [{ name: "models/gemini-2.0-flash", displayName: "Gemini 2.0 Flash" }];
        }
    }

    async switchModel(modelName: string) {
        this._currentModelName = modelName;
        this._model = this._createModel(modelName);
        this._chat = this._model.startChat({
            history: [],
        });
    }

    async ask(prompt: string): Promise<string> {
        try {
            let result = await this._chat.sendMessage(prompt);
            let response = await result.response;
            let calls = response.functionCalls();

            while (calls && calls.length > 0) {
                const functionResponses = [];

                for (const call of calls) {
                    const name = call.name;
                    const args = call.args;

                    console.log(`Hoot calling tool: ${name}`, args);

                    if (this._toolRegistry[name]) {
                        const toolResult = await this._toolRegistry[name](args);
                        functionResponses.push({
                            functionResponse: {
                                name: name,
                                response: toolResult
                            }
                        });
                    } else {
                        functionResponses.push({
                            functionResponse: {
                                name: name,
                                response: { error: `Tool ${name} not found.` }
                            }
                        });
                    }
                }

                // Send all tool results back to model
                result = await this._chat.sendMessage(functionResponses);
                response = await result.response;
                calls = response.functionCalls();
            }

            return response.text();
        } catch (error: any) {
            console.error('Error calling Gemini:', error);
            return `Sorry, I encountered an error: ${error.message || 'Unknown error'}`;
        }
    }
}