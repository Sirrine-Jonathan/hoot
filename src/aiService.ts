export type AIProvider = 'Gemini' | 'Ollama';

export interface AIModel {
    name: string;
    displayName: string;
}

export interface IAIService {
    readonly name: string;
    readonly provider: AIProvider;
    ask(prompt: string): Promise<string>;
    getAvailableModels(): Promise<AIModel[]>;
    switchModel(modelName: string): Promise<void>;
    checkConnection(): Promise<boolean>;
}
