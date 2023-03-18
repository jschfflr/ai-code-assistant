import { createRoot } from 'react-dom/client';
import { OpenAIProvider } from "./OpenAIContext";

import CodeAssistant from './CodeAssistant';
import { ConfigProvider } from './ConfigContext';

window.addEventListener("load", main);

function main() {
    const rootNode = document.getElementById("root") as HTMLElement;
    const root = createRoot(rootNode);
    root.render(
        <ConfigProvider>
            <OpenAIProvider>
                <CodeAssistant />
            </OpenAIProvider>
        </ConfigProvider>
    );
}
