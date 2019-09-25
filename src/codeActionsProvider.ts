import { exec } from 'child_process'
import * as Path from 'path'
import * as vscode from 'vscode'
import { IDENTIFIER } from './consts'
import { getWorkspaceEditFromPatch } from './helpers/editHelper'
import { getModuleExecutable, isModuleNotFoundError } from './helpers/envHelper'
import { createTemporaryFile, removeFile, writeFile } from './helpers/fsHelper'

export class CodeActionProvider implements vscode.CodeActionProvider {
  public provideCodeActions(document: vscode.TextDocument, range: vscode.Range, _context: vscode.CodeActionContext, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeAction[]> {
    const config: PyformatConfig = vscode.workspace.getConfiguration(IDENTIFIER, document.uri) as any
    if (!config.enableImportOrganization) {
      return []
    }

    const codeAction = new vscode.CodeAction(
      'PyFormat: Sort imports',
      vscode.CodeActionKind.SourceOrganizeImports.append('pyformat')
    )
    codeAction.command = {
      title: 'PyFormat: Sort imports',
      command: 'pyformat.sortImports'
    }
    return [codeAction]
  }

  public async sortImports(document: vscode.TextDocument) {
    console.log('pyformat: sort imports')
    // await new Promise((resolve) => { setTimeout(() => { resolve() }, 50) })

    const config: PyformatConfig = vscode.workspace.getConfiguration(IDENTIFIER, document.uri) as any
    const { isortArgs = [] } = config
    // console.log({ isortArgs })

    const tmpFile = document.isDirty ? await createTemporaryFile(Path.extname(document.uri.fsPath)) : undefined
    if (tmpFile) {
      await writeFile(tmpFile.filePath, document.getText())
    }

    const args = ['--diff', ...isortArgs, tmpFile ? tmpFile.filePath : document.uri.fsPath]

    const stdout = await new Promise<string>((resolve, reject) => {
      const command = `${getModuleExecutable('isort', document.uri)} ${args.join(' ')}`
      // console.log({ command })
      exec(command, (err, stdout, stderr) => {
        // console.log('isort exec complete', { command, err, stdout, stderr })
        if (err) {
          reject(err || stderr)
          let msg = 'Format with "isort" failed.'
          if (isModuleNotFoundError(err)) {
            msg += '\nPlease install "isort" in your python environment'
          }
          vscode.window.showErrorMessage(msg)
          return
        }
        resolve(stdout)
      })
    })
    const workspaceEdit = getWorkspaceEditFromPatch(document.getText(), stdout, document.uri)
    vscode.workspace.applyEdit(workspaceEdit)
    if (tmpFile) {
      await removeFile(tmpFile.filePath)
      tmpFile.dispose()
    }
  }
}
