import { useContext } from "react";
import { OpenAIApiContext, openaiApiKeyContext } from "./OpenAIApiKeyContext";

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function useChatGPTCompletion() {
    const context = useContext(openaiApiKeyContext);
    return chatGPTCompletion.bind(undefined, context);
}
export async function* chatGPTCompletion(context: OpenAIApiContext, messages: Message[]): AsyncGenerator<string> {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Authorization': `Bearer ${context.key}`,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    ...messages,
                ],
                model: "gpt-3.5-turbo",
                stream: true
            })
        });

        if (response.status !== 200) {
            const { error } = await response.json();
            if (!context.handleError(error)) {
                throw new Error(error);
            }

            return;
        }

        if (!response.body) {return;}

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
                if (!line.startsWith('data: ')) {continue;}
                line = line.slice(6);
                if (line === '[DONE]') {return;}
                const data = JSON.parse(line);

                const content = data.choices[0]?.delta?.content;
                if (!content) {continue;}
                yield content;
            }
        } while (true);

    } catch (e) {
        debugger;
        console.log(e);
    }
}
