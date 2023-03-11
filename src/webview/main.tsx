import { createRoot } from 'react-dom/client';
import { OpenAIApiKeyProvider } from "./OpenAIApiKeyContext";

import CodeAssistant from './CodeAssistant';

window.addEventListener("load", main);

function main() {
    const rootNode = document.getElementById("root") as HTMLElement;
    const root = createRoot(rootNode);
    root.render(
        <OpenAIApiKeyProvider>
            <CodeAssistant />
        </OpenAIApiKeyProvider>
    );
}
