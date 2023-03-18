import { createContext, MouseEvent, ReactNode, useContext, useEffect, useState } from "react";
import { VSCodeLink } from "@vscode/webview-ui-toolkit/react";
import { useConfig } from "./ConfigContext";
import { showSettings } from "./vscode";

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export interface OpenAIAPIContext {
    complete: (messages: Message[]) => AsyncGenerator<string>;
}

interface OpenAIAPIError {
    message: string;
    type: string;
    param: any;
    code: any;
}

export const OpenaiContext = createContext<OpenAIAPIContext>({
    complete: async function* () { }
});
export const Provider = OpenaiContext.Provider;

export const OpenAIProvider = ({ children }: { children: ReactNode }) => {
    const [error, setError] = useState<OpenAIAPIError | null>(null);
    const config = useConfig();
    const openaiApiKey = config.openaiApiKey;

    function handleClickOpenSettings(e: MouseEvent) {
        e.preventDefault();
        showSettings('codeAssistantAi.openaiApiKey');
    }

    async function* complete(messages: Message[]) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Authorization': `Bearer ${config.openaiApiKey}`,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    ...messages,
                ],
                model: config.openaiModel,
                stream: true
            })
        });

        if (response.status !== 200) {
            const { error } = await response.json();
            setError(error);
            return;
        }

        if (!response.body) { return; }

        const decoder = new TextDecoder('utf8');
        const reader = response.body.getReader();

        do {
            const { value, done } = await reader.read();

            if (done) {
                return;
            }
            const delta = decoder.decode(value);
            const lines = delta.split('\n').filter((line: string) => line.trim() !== '');
            for (let line of lines) {
                if (!line.startsWith('data: ')) { continue; }
                line = line.slice(6);
                if (line === '[DONE]') { return; }
                const data = JSON.parse(line);

                const content = data.choices[0]?.delta?.content;
                if (!content) { continue; }
                yield content;
            }
        } while (true);
    }

    if (!openaiApiKey) {
        return (
            <div>
                <h1>Welcome to Code Assistant AI</h1>
                <p>
                    This tool currently relies on OpenAI's ChatGPT to assist you.<br />
                    You can signup and create an API key on <VSCodeLink href="https://platform.openai.com/" target="_blank">OpenAI's website</VSCodeLink>.
                </p>
                <p>
                    After signin up, you can provide your OpenAI API key in the <VSCodeLink onClick={handleClickOpenSettings} href="#">settings</VSCodeLink>.
                </p>
            </div>
        );
    }

    if (error?.type === 'invalid_api_key') {
        return (
            <div className="error">
                <h1>Invalid API Key</h1>
                <p>
                    Incorrect API key provided. You can find your API key at <VSCodeLink href="https://platform.openai.com/account/api-keys">https://platform.openai.com/account/api-keys</VSCodeLink>.
                </p>
                <p>
                    You can change your API key in the <VSCodeLink onClick={handleClickOpenSettings} href="#">settings</VSCodeLink>.
                </p>
                <style>{`
                .error {
                    color: var(--vscode-errorForeground);
                }
            `}</style>
            </div>
        );
    } else if (error?.type === 'invalid_request_error') {
        return (
            <div className="error">
                <h1>Invalid Model</h1>
                <p>
                    The model version you specified could not be found. See OpenAI's <VSCodeLink href="https://platform.openai.com/docs/models/overview">Model Overview</VSCodeLink> for available models.
                </p>
                <p style={{ borderLeft: '3px solid var(--vscode-errorForeground)', paddingLeft: '.5em' }}>
                    GPT 4 is in limited beta and only accessible to those who have been granted access. Please join the <VSCodeLink href="https://openai.com/waitlist/gpt-4">waitlist</VSCodeLink> to get access when capacity is available.
                </p>
                <p>
                    You can change the model version (or your API key) in the <VSCodeLink onClick={handleClickOpenSettings} href="#">settings</VSCodeLink>.
                </p>
                <style>{`
                .error {
                    color: var(--vscode-errorForeground);
                }
            `}</style>
            </div>
        );
    }

    return (
        <Provider value={{
            complete
        }}>
            {children}
        </Provider>
    );
};

export const useOpenAI = () => useContext(OpenaiContext);
