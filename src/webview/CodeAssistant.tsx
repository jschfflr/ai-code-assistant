import { useState, KeyboardEvent, useRef, useLayoutEffect } from "react";
import { VSCodeTextArea } from "@vscode/webview-ui-toolkit/react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import 'highlight.js/styles/github-dark.css';
import { Message, useOpenAI } from "./OpenAIContext";

const CodeAssistant = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setIsLoading] = useState(false);
    const messagesRef = useRef<HTMLDivElement>(null);
    const promptRef = useRef<HTMLElement>(null);
    const { complete } = useOpenAI();

    useLayoutEffect(() => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [messages]);

    useLayoutEffect(() => {
        if (!promptRef.current) {
            return;
        }
        const shadowRoot = promptRef.current.shadowRoot;
        if (!shadowRoot) {
            return;
        }
        window.setTimeout(() => {
            shadowRoot.querySelector('textarea')?.focus();
        }, 100);
    }, [promptRef.current, loading]);

    function handlePromptKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const element = e.target as HTMLTextAreaElement;
            sendPrompt(element.value);
            element.value = '';
        }
    }

    function appendMessage(message: Message, previousMessages?: Message[]) {
        const next = [
            ...(previousMessages || messages),
            message,
        ];
        setMessages(next);
        return next;
    }

    async function sendPrompt(prompt: string) {
        setIsLoading(true);
        const messagesWithPrompt = appendMessage({
            role: 'user',
            content: prompt
        });
        let response = '';
        for await (const chunk of complete(messagesWithPrompt)) {
            response += chunk;
            setMessages([
                ...messagesWithPrompt,
                {
                    role: 'assistant',
                    content: response,
                }
            ]);
        }
        setIsLoading(false);
    }

    return (
        <div className="wrapper">
            <div className="messages" ref={messagesRef}>
                {messages.map((message, i) => (
                    <div
                        className={["message", message.role, loading && i === messages.length - 1 ? 'loading' : ''].join(' ')}
                        key={message.content}
                    >
                        <div className="role">{message.role === 'user' ? 'You' : 'Code Assistant'}</div>
                        <div className="content">
                            <ReactMarkdown
                                rehypePlugins={[[rehypeHighlight, { detect: true }]]}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                ))}
            </div>
            <div className="input">
                <VSCodeTextArea
                    className="prompt"
                    autofocus
                    placeholder="Type here"
                    disabled={loading}
                    onKeyDown={handlePromptKeydown}
                    ref={promptRef as any}
                />
            </div>
            <style>{`
                body {
                    padding: 0;
                }

                #root {
                    height: 100vh;
                }

                .wrapper {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .messages {
                    flex: 1;
                    overflow-y: scroll;
                }

                .message {
                    padding: 1em;
                }

                .role {
                    font-weight: bold;
                    margin-bottom: 0.5em;
                }

                .message.assistant {
                    background: rgba(0,0,0,0.3);
                }

                .message.assistant.loading .content > *:last-child:after {
                    content: ' ▋';
                    animation: blink 1s step-end infinite;
                }

                .input {
                    padding: 1em;
                }

                .prompt {
                    width: 100%;
                }

                @keyframes blink {
                    50% {
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
};

export default CodeAssistant;
