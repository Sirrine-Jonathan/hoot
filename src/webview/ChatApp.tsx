import * as React from 'react';
import { Send, User, Bot, Key, Settings, Brain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
    const [hasApiKey, setHasApiKey] = React.useState<boolean | null>(null);
    const [models, setModels] = React.useState<{name: string, displayName: string}[]>([]);
    const [selectedModel, setSelectedModel] = React.useState('models/gemini-2.0-flash');

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
            switch (message.type) {
                case 'chatResponse':
                    setMessages(prev => [...prev, { role: 'model', text: message.text }]);
                    setIsLoading(false);
                    break;
                case 'apiKeyStatus':
                    setHasApiKey(message.hasKey);
                    if (message.hasKey) {
                        vscode?.postMessage({ command: 'getModels' });
                    }
                    break;
                case 'modelsList':
                    setModels(message.models);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        vscode?.postMessage({ command: 'ready' });
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

    const setApiKey = () => {
        vscode?.postMessage({ command: 'setApiKey' });
    };

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newModel = e.target.value;
        setSelectedModel(newModel);
        vscode?.postMessage({ command: 'switchModel', modelName: newModel });
    };

    if (hasApiKey === false) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100vh', 
                padding: '20px',
                textAlign: 'center',
                gap: '15px'
            }}>
                <Key size={48} style={{ opacity: 0.5 }} />
                <h3>Welcome to Hoot!</h3>
                <p>To start learning, you'll need a Gemini API Key.</p>
                <button 
                    onClick={setApiKey}
                    style={{ 
                        padding: '8px 16px', 
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: 'var(--vscode-button-background)',
                        color: 'var(--vscode-button-foreground)',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Set API Key
                </button>
                <p style={{ fontSize: '0.8em', opacity: 0.7 }}>
                    You can get a free key from the <a href="https://aistudio.google.com/app/apikey" style={{ color: 'var(--vscode-textLink-foreground)' }}>Google AI Studio</a>.
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '10px', boxSizing: 'border-box', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1, minWidth: 0 }}>
                    <Brain size={14} style={{ opacity: 0.7, flexShrink: 0 }} />
                    <select 
                        value={selectedModel}
                        onChange={handleModelChange}
                        style={{ 
                            fontSize: '0.85em',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            border: '1px solid var(--vscode-input-border)',
                            backgroundColor: 'var(--vscode-input-background)',
                            color: 'var(--vscode-input-foreground)',
                            width: '100%',
                            outline: 'none'
                        }}
                    >
                        {models.length > 0 ? (
                            models.map(m => (
                                <option key={m.name} value={m.name}>{m.displayName}</option>
                            ))
                        ) : (
                            <option value="models/gemini-2.0-flash">Gemini 2.0 Flash</option>
                        )}
                    </select>
                </div>
                <button 
                    onClick={setApiKey}
                    title="Change API Key"
                    style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--vscode-foreground)', 
                        cursor: 'pointer',
                        opacity: 0.6,
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <Settings size={16} />
                </button>
            </div>

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
                            maxWidth: '95%',
                            wordBreak: 'break-word',
                            lineHeight: '1.4',
                            fontSize: '0.9em'
                        }}>
                            {msg.role === 'model' ? (
                                <ReactMarkdown
                                    components={{
                                        code({ node, inline, className, children, ...props }: any) {
                                            const match = /language-(\w+)/.exec(className || '');
                                            return !inline && match ? (
                                                <SyntaxHighlighter
                                                    style={vscDarkPlus}
                                                    language={match[1]}
                                                    PreTag="div"
                                                    customStyle={{ margin: '0.5em 0', borderRadius: '4px', fontSize: '0.9em' }}
                                                    {...props}
                                                >
                                                    {String(children).replace(/\n$/, '')}
                                                </SyntaxHighlighter>
                                            ) : (
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            );
                                        }
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            ) : (
                                msg.text
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div style={{ opacity: 0.6, fontSize: '0.8em', padding: '5px' }}>Hoot is thinking...</div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <div style={{ display: 'flex', gap: '5px', paddingBottom: '10px' }}>
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