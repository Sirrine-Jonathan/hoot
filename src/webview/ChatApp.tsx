import * as React from 'react';
import { Send, User, Bot, Key, Settings, Brain, Trash2, Sparkles } from 'lucide-react';
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
    const [models, setModels] = React.useState<{ name: string, displayName: string }[]>([]);
    const [selectedModel, setSelectedModel] = React.useState('models/gemini-2.0-flash');

    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

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
                case 'showLesson':
                    setMessages(prev => [...prev, { role: 'model', text: message.text }]);
                    setIsLoading(false);
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

    const clearChat = () => {
        setMessages([{ role: 'model', text: "Hoot! Let's start fresh. What can I help you with?" }]);
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
                gap: '15px',
                color: 'var(--vscode-foreground)'
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
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            boxSizing: 'border-box',
            backgroundColor: 'var(--vscode-sideBar-background)',
            color: 'var(--vscode-foreground)',
            fontFamily: 'var(--vscode-font-family)',
            overflow: 'hidden'
        }}>
            {/* Toolbar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                borderBottom: '1px solid var(--vscode-sideBar-border)',
                gap: '8px',
                backgroundColor: 'var(--vscode-sideBarSectionHeader-background)'
            }}>
                <Brain size={14} style={{ opacity: 0.8 }} />
                <select
                    value={selectedModel}
                    onChange={handleModelChange}
                    style={{
                        fontSize: '0.8em',
                        flex: 1,
                        padding: '2px 4px',
                        borderRadius: '2px',
                        border: '1px solid var(--vscode-dropdown-border)',
                        backgroundColor: 'var(--vscode-dropdown-background)',
                        color: 'var(--vscode-dropdown-foreground)',
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
                <button onClick={clearChat} title="Clear Chat" style={iconButtonStyle}><Trash2 size={14} /></button>
                <button onClick={setApiKey} title="Settings" style={iconButtonStyle}><Settings size={14} /></button>
            </div>

            {/* Messages Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                {messages.map((msg, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '100%'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '6px',
                            opacity: 0.7,
                            fontSize: '0.75em',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            {msg.role === 'user' ? <><User size={12} /> You</> : <><Bot size={12} /> Hoot</>}
                        </div>
                        <div style={{
                            padding: '10px 14px',
                            borderRadius: '12px',
                            borderBottomRightRadius: msg.role === 'user' ? '2px' : '12px',
                            borderBottomLeftRadius: msg.role === 'model' ? '2px' : '12px',
                            backgroundColor: msg.role === 'user' ? 'var(--vscode-button-background)' : 'var(--vscode-editor-inactiveSelectionBackground)',
                            color: msg.role === 'user' ? 'var(--vscode-button-foreground)' : 'var(--vscode-editor-foreground)',
                            maxWidth: '92%',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            {msg.role === 'model' ? (
                                <div className="markdown-container" style={{ fontSize: '0.95em', lineHeight: '1.5' }}>
                                    <ReactMarkdown
                                        components={{
                                            code({ node, inline, className, children, ...props }: any) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                return !inline && match ? (
                                                    <div style={{ margin: '8px 0', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <SyntaxHighlighter
                                                            style={vscDarkPlus}
                                                            language={match[1]}
                                                            PreTag="div"
                                                            customStyle={{ margin: 0, padding: '12px', fontSize: '0.85em' }}
                                                            {...props}
                                                        >
                                                            {String(children).replace(/\n$/, '')}
                                                        </SyntaxHighlighter>
                                                    </div>
                                                ) : (
                                                    <code style={{
                                                        backgroundColor: 'rgba(0,0,0,0.2)',
                                                        padding: '2px 4px',
                                                        borderRadius: '3px',
                                                        fontFamily: 'var(--vscode-editor-font-family)'
                                                    }} {...props}>
                                                        {children}
                                                    </code>
                                                );
                                            },
                                            p: ({ children }) => <p style={{ margin: '0 0 8px 0' }}>{children}</p>,
                                            ul: ({ children }) => <ul style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>{children}</ul>,
                                            ol: ({ children }) => <ol style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>{children}</ol>
                                        }}
                                    >
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.95em' }}>{msg.text}</div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6, fontSize: '0.8em', padding: '4px' }}>
                        <Sparkles size={14} className="animate-pulse" />
                        <span>Hoot is thinking...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
                padding: '12px',
                borderTop: '1px solid var(--vscode-sideBar-border)',
                backgroundColor: 'var(--vscode-sideBar-background)'
            }}>
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    backgroundColor: 'var(--vscode-input-background)',
                    border: '1px solid var(--vscode-input-border)',
                    borderRadius: '4px',
                    padding: '4px'
                }}>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                        placeholder="Ask Hoot a question..."
                        rows={1}
                        style={{
                            flex: 1,
                            padding: '8px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: 'var(--vscode-input-foreground)',
                            outline: 'none',
                            resize: 'none',
                            fontFamily: 'inherit',
                            fontSize: '0.9em',
                            maxHeight: '150px'
                        }}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={isLoading || !input.trim()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: input.trim() ? 'var(--vscode-button-background)' : 'transparent',
                            color: 'var(--vscode-button-foreground)',
                            cursor: (isLoading || !input.trim()) ? 'default' : 'pointer',
                            opacity: (isLoading || !input.trim()) ? 0.5 : 1,
                            transition: 'background-color 0.2s'
                        }}
                    >
                        <Send size={16} />
                    </button>
                </div>
                <div style={{ fontSize: '0.7em', opacity: 0.5, textAlign: 'center', marginTop: '6px' }}>
                    Shift + Enter for new line
                </div>
            </div>

            <style>{`
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .3; }
                }
                ::-webkit-scrollbar { width: 10px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: var(--vscode-scrollbarSlider-background); }
                ::-webkit-scrollbar-thumb:hover { background: var(--vscode-scrollbarSlider-hoverBackground); }
            `}</style>
        </div>
    );
};

const iconButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--vscode-foreground)',
    cursor: 'pointer',
    opacity: 0.7,
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
    borderRadius: '4px'
};
