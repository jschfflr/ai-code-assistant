import * as vscode from 'vscode';
import { CodeAssistantPanel } from "./panels/CodeAssistantPanel";


export function activate(context: vscode.ExtensionContext) {
	const helloCommand = vscode.commands.registerCommand("ai-code-assistant.show-code-assistant", () => {
		CodeAssistantPanel.render(context.extensionUri);
	});

	context.subscriptions.push(helloCommand);
}