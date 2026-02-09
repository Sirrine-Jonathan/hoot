import * as React from 'react';
import { Send, User, Bot } from 'lucide-react';

interface Message {
    role: 'user' | 'model';
    text: string;
}

declare const acquireVsCodeApi: () => {
    postMessage: (message: any) => void;
    getState: () => any;
    setState: (state: any) => void;
};

const vscode = typeof acquireVsCodeApi !== 'undefined' ? acquireVsCodeApi() : null;

export const ChatApp: React.FC = () => {
    const [messages, setMessages] = React.useState<Message[]>([
        { role: 'model', text: "Hoot! I'm Hoot, your coding teacher. What are we exploring today?" }
    ]);
    const [input, setInput] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);

    React.useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'chatResponse') {
                setMessages(prev => [...prev, { role: 'model', text: message.text }]);
                setIsLoading(false);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const sendMessage = () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        vscode?.postMessage({ command: 'chat', text: input });
        
        setInput('');
        setIsLoading(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '10px', boxSizing: 'border-box' }}>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px', paddingRight: '5px' }}>
                {messages.map((msg, i) => (
                    <div key={i} style={{ 
                        marginBottom: '12px', 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '5px', 
                            marginBottom: '4px',
                            opacity: 0.8,
                            fontSize: '0.8em'
                        }}>
                            {msg.role === 'user' ? <><User size={14} /> You</> : <><Bot size={14} /> Hoot</>}
                        </div>
                        <div style={{ 
                            padding: '8px 12px', 
                            borderRadius: '8px',
                            backgroundColor: msg.role === 'user' ? 'var(--vscode-button-background)' : 'var(--vscode-editor-inactiveSelectionBackground)',
                            color: msg.role === 'user' ? 'var(--vscode-button-foreground)' : 'var(--vscode-editor-foreground)',
                            maxWidth: '90%',
                            wordBreak: 'break-word',
                            lineHeight: '1.4'
                        }}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div style={{ opacity: 0.6, fontSize: '0.8em', padding: '5px' }}>Hoot is thinking...</div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <div style={{ display: 'flex', gap: '5px' }}>
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask Hoot a question..."
                    style={{ 
                        flex: 1, 
                        padding: '8px', 
                        borderRadius: '4px',
                        border: '1px solid var(--vscode-input-border)',
                        backgroundColor: 'var(--vscode-input-background)',
                        color: 'var(--vscode-input-foreground)',
                        outline: 'none'
                    }}
                />
                <button 
                    onClick={sendMessage}
                    disabled={isLoading}
                    style={{ 
                        padding: '8px', 
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: 'var(--vscode-button-background)',
                        color: 'var(--vscode-button-foreground)',
                        cursor: isLoading ? 'default' : 'pointer',
                        opacity: isLoading ? 0.5 : 1
                    }}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};
