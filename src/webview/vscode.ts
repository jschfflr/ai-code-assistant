export const vscode = acquireVsCodeApi();

export function showSettings(key: string) {
    vscode.postMessage({
        command: 'show_settings',
        key,
    });
}
