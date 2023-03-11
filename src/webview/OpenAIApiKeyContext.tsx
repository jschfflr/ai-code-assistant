import { createContext, MouseEvent, useEffect, useState } from "react";
import { showSettings } from "./vscode";

export interface OpenAIApiContext {
    key: string;
    handleError: (error: any) => boolean;
}

export const openaiApiKeyContext = createContext<OpenAIApiContext>({ key: '', handleError: () => false });
export const ApiKeyProvider = openaiApiKeyContext.Provider;

export const OpenAIApiKeyProvider = ({ children }: any) => {
    const [openaiApiKey, setOpenAIApiKey] = useState(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const element = document.getElementById("openai-api-key");
        if (!element) return;
        const initialOpenAIApiKey = JSON.parse(element.textContent || '');
        setOpenAIApiKey(initialOpenAIApiKey);
    }, []);

    function handleClickOpenSettings(e: MouseEvent) {
        e.preventDefault();
        showSettings('codeAssistantAi.openaiApiKey');
    }

    function handleError(error: any): boolean {
        if (error.code == 'invalid_api_key') {
            setError('invalid_api_key');
            return true;
        }
        return false;
    }

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.event) {
            case 'openaiApiKey:changed':
                setOpenAIApiKey(message.data);
                break;
        }
    });

    if (!openaiApiKey) {
        return <div>
            <h1>Welcome to Code Assistant AI</h1>
            <p>
                This tool currently relies on OpenAI's ChatGPT to assist you.<br />
                You can signup and create an API key on <a href="https://platform.openai.com/" target="_blank">OpenAI's website</a>.
            </p>
            <p>
                After signin up, you can provide your OpenAI API key in the <a onClick={handleClickOpenSettings} href="#">settings</a>.
            </p>
        </div>
    }

    if (error == 'invalid_api_key') {
        return <div className="error">
            <h1>Invalid API Key</h1>
            <p>
                Incorrect API key provided. You can find your API key at <a href="https://platform.openai.com/account/api-keys">https://platform.openai.com/account/api-keys</a>.
            </p>
            <p>
                You can change your API key in the <a onClick={handleClickOpenSettings} href="#">settings</a>.
            </p>
            <style>{`
                .error {
                    color: var(--vscode-errorForeground);
                }
            `}</style>
        </div>
    }

    return (
        <ApiKeyProvider value={{
            key: openaiApiKey,
            handleError,
        }}>

            {children}
        </ApiKeyProvider>
    )
}
