import { GoogleGenerativeAI, GenerativeModel, ChatSession } from "@google/generative-ai";

export class GeminiService {
    private _genAI?: GoogleGenerativeAI;
    private _model: GenerativeModel;
    private _chat: ChatSession;

    constructor(apiKeyOrModel: string | GenerativeModel) {
        if (typeof apiKeyOrModel === 'string') {
            this._genAI = new GoogleGenerativeAI(apiKeyOrModel);
            this._model = this._genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                systemInstruction: "You are Hoot, an AI-powered Teacher Agent for VS Code. Your goal is to guide students using the Socratic method. Never give the full answer immediately. Instead, ask guiding questions, provide hints, and explain the 'why' behind concepts. Encourage the student and help them break down complex problems into smaller steps."
            });
        } else {
            this._model = apiKeyOrModel;
        }
        
        this._chat = this._model.startChat({
            history: [],
        });
    }

    async ask(prompt: string): Promise<string> {
        try {
            const result = await this._chat.sendMessage(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.error('Error calling Gemini:', error);
            return `Sorry, I encountered an error: ${error.message || 'Unknown error'}`;
        }
    }
}