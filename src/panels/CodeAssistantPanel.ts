import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";

export class CodeAssistantPanel {
  public static currentPanel: CodeAssistantPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private apiKey?: string;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._setWebviewMessageListener(this._panel.webview);

    const config = vscode.workspace.getConfiguration('codeAssistantAi');
    const apiKey = config.get<string>('openaiApiKey');
    this.apiKey = apiKey;

    vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
      if (!e.affectsConfiguration('codeAssistantAi')) {return;}
      const config = vscode.workspace.getConfiguration('codeAssistantAi');
      this.apiKey = config.get<string>('openaiApiKey');
      this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
    });

    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
  }

  public dispose() {
    CodeAssistantPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const webviewJSUri = getUri(webview, extensionUri, ["out", "webview.js"]);
    const webviewCSSUri = getUri(webview, extensionUri, ["out", "webview.css"]);
    const nonce = getNonce();
    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <!--meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}';"-->
          <title>Code Assistant</title>
          <link rel="stylesheet" nonce="${nonce}" href="${webviewCSSUri}" />
        </head>
        <body>
          <script type="application/json" id="openai-api-key">${JSON.stringify(this.apiKey)}</script>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${webviewJSUri}"></script>
        </body>
      </html>
    `;
  }

  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command;

        switch (command) {
          case "show_settings":
            const key = message.key;
            vscode.commands.executeCommand("workbench.action.openSettings", key);
            return;
        }
      },
      undefined,
      this._disposables
    );
  }

  public static render(extensionUri: vscode.Uri) {
    if (CodeAssistantPanel.currentPanel) {
      CodeAssistantPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
    } else {
      const panel = vscode.window.createWebviewPanel(
        "code-assistant",
        "Code Assistant",
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.joinPath(extensionUri, 'out')
          ]
        }
      );

      CodeAssistantPanel.currentPanel = new CodeAssistantPanel(panel, extensionUri);
    }
  }
}