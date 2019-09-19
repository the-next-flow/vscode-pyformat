import * as vscode from 'vscode'
import { CodeActionProvider } from './codeActionsProvider'
import { IDENTIFIER, PYTHON, PYTHON_LANGUAGE } from './consts'
import { FormattingEditProvider } from './formatProvider'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// console.log(`"${IDENTIFIER}" is now active`)

	const formatProvider = new FormattingEditProvider(context)
	const codeActionProvider = new CodeActionProvider()

	context.subscriptions.push(vscode.commands.registerCommand(`${IDENTIFIER}.sortImports`, () => {
		const activeEditor = vscode.window.activeTextEditor
		if (!activeEditor || activeEditor.document.languageId !== PYTHON_LANGUAGE) {
			return vscode.window.showErrorMessage('Please open a Python file to sort the imports.')
		}
		return codeActionProvider.sortImports(activeEditor.document)
	}))

	vscode.languages.registerDocumentFormattingEditProvider(PYTHON, formatProvider)
	vscode.languages.registerDocumentRangeFormattingEditProvider(PYTHON, formatProvider)
	vscode.languages.registerCodeActionsProvider(PYTHON, codeActionProvider)
}

// this method is called when your extension is deactivated
export function deactivate() { }
