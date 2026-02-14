import * as React from 'react';
import { Send, User, Bot, Trash2, Sparkles, Brain, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
// @ts-ignore
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-ignore
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';

// Register only needed languages to reduce bundle size
// @ts-ignore
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
// @ts-ignore
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
// @ts-ignore
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
// @ts-ignore
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';

SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('markdown', markdown);

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
    const [view, setView] = React.useState<'chat' | 'settings'>('chat');
    const [messages, setMessages] = React.useState<Message[]>([
        { role: 'model', text: "Hoot! I'm Hoot, your coding teacher. What are we exploring today?" }
    ]);
    const [input, setInput] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [hasService, setHasService] = React.useState<boolean | null>(null);
    const [isConnected, setIsConnected] = React.useState<boolean>(false);
    const [provider, setProvider] = React.useState<string>('Gemini');
    const [models, setModels] = React.useState<{ name: string, displayName: string }[]>([]);
    const [selectedModel, setSelectedModel] = React.useState('');
    const [customModel, setCustomModel] = React.useState('');
    const [pullModelSelection, setPullModelSelection] = React.useState('qwen2.5-coder:7b');

    const recommendedModels = [
        { id: 'qwen2.5-coder:7b', name: 'Qwen 2.5 Coder 7B (Best Balanced)' },
        { id: 'qwen2.5-coder:1.5b', name: 'Qwen 2.5 Coder 1.5B (Lightweight)' },
        { id: 'llama3.1:8b', name: 'Llama 3.1 8B (General Purpose)' },
        { id: 'mistral:7b', name: 'Mistral 7B' },
        { id: 'codellama:7b', name: 'CodeLlama 7B' },
        { id: 'phi3:latest', name: 'Phi-3 3.8B (Fast)' },
        { id: 'other', name: 'Other... (Enter custom name)' }
    ];

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
                case 'serviceStatus':
                    setHasService(message.hasService);
                    setIsConnected(message.isConnected);
                    setProvider(prev => {
                        if (prev !== message.provider) {
                            setModels([]); // Clear models if provider changed
                        }
                        return message.provider;
                    });
                    if (message.hasService) {
                        vscode?.postMessage({ command: 'getModels' });
                    }
                    break;
                case 'apiKeyStatus':
                    // Keep for backward compatibility if needed, but serviceStatus is primary
                    if (hasService === null) {
                        setHasService(message.hasKey);
                    }
                    break;
                case 'modelsList':
                    setModels(message.models);
                    if (message.models.length > 0 && !message.models.find((m: any) => m.name === selectedModel)) {
                        setSelectedModel(message.models[0].name);
                    }
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

    const switchProvider = () => {
        vscode?.postMessage({ command: 'switchProvider' });
    };

    const setupOllama = () => {
        vscode?.postMessage({ command: 'setupOllama' });
    };

    const pullCustomModel = () => {
        const modelToPull = pullModelSelection === 'other' ? customModel : pullModelSelection;
        if (modelToPull.trim()) {
            vscode?.postMessage({ command: 'hoot.pullModel', modelName: modelToPull.trim() });
            if (pullModelSelection === 'other') {
                setCustomModel('');
            }
        }
    };

    const removeApiKey = () => {
        vscode?.postMessage({ command: 'removeApiKey' });
    };

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newModel = e.target.value;
        setSelectedModel(newModel);
        vscode?.postMessage({ command: 'switchModel', modelName: newModel });
    };

    if (hasService === false) {
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
                <Brain size={48} style={{ opacity: 0.5 }} />
                <h3>Welcome to Hoot!</h3>
                <p>To start learning, please set up an AI provider.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                    <div style={{ padding: '10px', border: '1px solid var(--vscode-sideBar-border)', borderRadius: '4px', textAlign: 'left' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Option 1: Google Gemini</div>
                        <p style={{ fontSize: '0.85em', margin: '0 0 10px 0' }}>Cloud-based, fast, and powerful. Requires an API key.</p>
                        <button
                            onClick={setApiKey}
                            style={buttonStyle}
                        >
                            Set Gemini API Key
                        </button>
                    </div>

                    <div style={{ padding: '10px', border: '1px solid var(--vscode-sideBar-border)', borderRadius: '4px', textAlign: 'left' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Option 2: Local Ollama</div>
                        <p style={{ fontSize: '0.85em', margin: '0 0 10px 0' }}>Private and local. No API key needed, but requires Ollama to be installed.</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={setupOllama} style={buttonStyle}>Setup Ollama</button>
                            <button onClick={switchProvider} style={{...buttonStyle, backgroundColor: 'transparent', border: '1px solid var(--vscode-button-background)'}}>Switch to Ollama</button>
                        </div>
                    </div>
                </div>

                <p style={{ fontSize: '0.8em', opacity: 0.7 }}>
                    Current Provider: <strong>{provider}</strong>
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
                <button onClick={() => setView('chat')} title="Chat" style={{...iconButtonStyle, opacity: view === 'chat' ? 1 : 0.5}}>
                    <Bot size={14} />
                </button>
                {view === 'chat' && (
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
                            <option value="">No models found</option>
                        )}
                    </select>
                )}
                {view === 'settings' && <div style={{ flex: 1, fontSize: '0.8em', fontWeight: 'bold' }}>Settings</div>}
                
                {view === 'chat' && <button onClick={clearChat} title="Clear Chat" style={iconButtonStyle}><Trash2 size={14} /></button>}
                <button onClick={() => setView(view === 'chat' ? 'settings' : 'chat')} title="Settings" style={{...iconButtonStyle, opacity: view === 'settings' ? 1 : 0.5}}>
                    <Settings size={14} />
                </button>
            </div>

            {view === 'chat' ? (
                <>
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
                                                {msg.text.replace(/\[PULL_MODEL_ACTION:.*?\]/g, '')}
                                            </ReactMarkdown>
                                            
                                            {msg.text.includes('[PULL_MODEL_ACTION') && (
                                                <div style={{ marginTop: '10px' }}>
                                                    <button 
                                                        onClick={setupOllama}
                                                        style={{...buttonStyle, width: 'auto', display: 'flex', alignItems: 'center', gap: '6px'}}
                                                    >
                                                        <Brain size={14} /> Pull Model Now
                                                    </button>
                                                </div>
                                            )}
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
                </>
            ) : (
                /* Settings View */
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    <div style={{ borderBottom: '1px solid var(--vscode-sideBar-border)', paddingBottom: '10px' }}>
                        <h4 style={{ margin: '0 0 10px 0' }}>AI Provider</h4>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ 
                                    width: '8px', 
                                    height: '8px', 
                                    borderRadius: '50%', 
                                    backgroundColor: isConnected ? '#4caf50' : '#f44336',
                                    boxShadow: isConnected ? '0 0 5px #4caf50' : 'none'
                                }} />
                                <span style={{ fontSize: '0.9em' }}><strong>{provider}</strong> ({isConnected ? 'Connected' : 'Disconnected'})</span>
                            </div>
                            <button onClick={switchProvider} style={buttonStyle}>Switch Provider</button>
                        </div>
                    </div>

                    <div style={{ borderBottom: '1px solid var(--vscode-sideBar-border)', paddingBottom: '10px' }}>
                        <h4 style={{ margin: '0 0 10px 0' }}>Google Gemini</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button onClick={setApiKey} style={buttonStyle}>Set API Key</button>
                            <button onClick={removeApiKey} style={{...buttonStyle, backgroundColor: 'var(--vscode-errorForeground)', color: 'white'}}>Remove API Key</button>
                        </div>
                    </div>

                    <div style={{ borderBottom: '1px solid var(--vscode-sideBar-border)', paddingBottom: '10px' }}>
                        <h4 style={{ margin: '0 0 10px 0' }}>Local Ollama</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.85em', fontWeight: 'bold' }}>Pull Featured Model:</label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <select
                                        value={pullModelSelection}
                                        onChange={(e) => setPullModelSelection(e.target.value)}
                                        style={{
                                            flex: 1,
                                            padding: '4px 8px',
                                            borderRadius: '2px',
                                            border: '1px solid var(--vscode-dropdown-border)',
                                            backgroundColor: 'var(--vscode-dropdown-background)',
                                            color: 'var(--vscode-dropdown-foreground)',
                                            fontSize: '0.85em'
                                        }}
                                    >
                                        {recommendedModels.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                    <button onClick={pullCustomModel} style={buttonStyle}>Pull</button>
                                </div>
                                <p style={{ fontSize: '0.75em', opacity: 0.6, margin: '0' }}>
                                    These models are specifically recommended for Hoot's Socratic teaching style.
                                </p>

                                {pullModelSelection === 'other' && (
                                    <input 
                                        value={customModel}
                                        onChange={(e) => setCustomModel(e.target.value)}
                                        placeholder="Enter model name (e.g., stablediffusion-llama)"
                                        style={{
                                            padding: '4px 8px',
                                            borderRadius: '2px',
                                            border: '1px solid var(--vscode-input-border)',
                                            backgroundColor: 'var(--vscode-input-background)',
                                            color: 'var(--vscode-input-foreground)',
                                            fontSize: '0.85em',
                                            marginTop: '4px'
                                        }}
                                    />
                                )}
                            </div>
                            
                            <p style={{ fontSize: '0.8em', opacity: 0.7, margin: 0 }}>
                                Models are pulled from the <a href="https://ollama.com/library" style={{ color: 'var(--vscode-textLink-foreground)' }}>Ollama Library</a>.
                            </p>
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto', textAlign: 'center' }}>
                        <button onClick={() => setView('chat')} style={{...buttonStyle, width: '100%'}}>Back to Chat</button>
                    </div>
                </div>
            )}

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

const buttonStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9em'
};
