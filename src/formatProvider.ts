// Copied some codes from https://github.com/Microsoft/vscode
import { exec } from 'child_process'
import * as Path from 'path'
import * as vscode from 'vscode'
import { TextEdit } from 'vscode'
import { IDENTIFIER } from './consts'
import { getTextEditsFromPatch } from './helpers/editHelper'
import { getModuleExecutable, isModuleNotFoundError } from './helpers/envHelper'
import { createTemporaryFile as createTempFile, removeFile, writeFile } from './helpers/fsHelper'


export class FormattingEditProvider implements vscode.DocumentFormattingEditProvider, vscode.DocumentRangeFormattingEditProvider, vscode.Disposable {
  private disposables: vscode.Disposable[] = []
  // Workaround for https://github.com/Microsoft/vscode/issues/41194
  private documentVersionBeforeFormatting = -1
  private formatterMadeChanges = false
  private saving = false

  public constructor(_context: vscode.ExtensionContext) {

    this.disposables.push(vscode.workspace.onDidSaveTextDocument(async document => this.onSaveDocument(document)))
  }

  public provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<TextEdit[]> {
    return this.provideDocumentRangeFormattingEdits(document, undefined, options, token)
  }

  public async provideDocumentRangeFormattingEdits(document: vscode.TextDocument, range: vscode.Range | undefined, options: vscode.FormattingOptions, token: vscode.CancellationToken): Promise<TextEdit[]> {
    // Workaround for https://github.com/Microsoft/vscode/issues/41194
    // VSC rejects 'format on save' promise in 750 ms. Python formatting may take quite a bit longer.
    // Workaround is to resolve promise to nothing here, then execute format document and force new save.
    // However, we need to know if this is 'format document' or formatting on save.

    if (this.saving) {
      // We are saving after formatting (see onSaveDocument below)
      // so we do not want to format again.
      return []
    }

    // console.log('document uri', document.uri)

    // Remember content before formatting so we can detect if
    // formatting edits have been really applied
    const editorConfig = vscode.workspace.getConfiguration('editor', document.uri)
    if (editorConfig.get('formatOnSave') === true) {
      this.documentVersionBeforeFormatting = document.version
    }
    const config: PyformatConfig = vscode.workspace.getConfiguration(IDENTIFIER, document.uri) as any
    const { formatProvider, blackArgs, autopep8Args = [] } = config
    if (formatProvider === 'black') {
      return await this.formatWithBlack(document, range, blackArgs)
    } else {
      return await this.formatWithAutoPep8(document, range, autopep8Args)
    }
  }

  private async formatWithBlack(document: vscode.TextDocument, range: vscode.Range | undefined, blackArgs: string[]): Promise<TextEdit[]> {
    console.log('pyformat: format with black')
    // black and have the ability to read from the process input stream and return the formatted code out of the output stream.
    // However they don't support returning the diff of the formatted text when reading data from the input stream.
    // Yet getting text formatted that way avoids having to create a temporary file, however the diffing will have
    // to be done here in node (extension), i.e. extension CPU, i.e. less responsive solution.
    const tmpFile = document.isDirty ? await createTempFile(Path.extname(document.uri.fsPath)) : undefined
    if (tmpFile) {
      await writeFile(tmpFile.filePath, document.getText())
    }

    const args = ['--diff', '--quiet', ...blackArgs, tmpFile ? tmpFile.filePath : document.uri.fsPath]

    if (range && !range.isEmpty) {
      // NOTE: black does not support range formatting
      vscode.window.showErrorMessage('Format in range is not supported by black.')
      return []
    }

    const stdout = await new Promise<string | null>((resolve, reject) => {
      const command = `${getModuleExecutable('black', document.uri)} ${args.join(' ')}`
      // console.log({ command })
      exec(command, (err, stdout, stderr) => {
        // console.log('autopep8 exec complete', { command, err, stdout, stderr })
        if (err) {
          reject(err || stderr)
          let msg = 'Format with "black" failed.'
          if (isModuleNotFoundError(err)) {
            msg += '\nPlease install "black" in your python environment'
          }
          vscode.window.showErrorMessage(msg)
          resolve(null)
          return
        }
        resolve(stdout)
      })
    })

    if (stdout === null) {
      return []
    }

    const edits = getTextEditsFromPatch(document.getText(), stdout)
    // console.log({ edits })
    this.formatterMadeChanges = edits.length > 0
    if (tmpFile) {
      await removeFile(tmpFile.filePath)
      tmpFile.dispose()
    }
    return edits
  }

  private async formatWithAutoPep8(document: vscode.TextDocument, range: vscode.Range | undefined, autopep8Args: string[]): Promise<TextEdit[]> {
    console.log('pyformat: format with autopep8')
    // autopep8 and have the ability to read from the process input stream and return the formatted code out of the output stream.
    // However they don't support returning the diff of the formatted text when reading data from the input stream.
    // Yet getting text formatted that way avoids having to create a temporary file, however the diffing will have
    // to be done here in node (extension), i.e. extension CPU, i.e. less responsive solution.
    const tmpFile = document.isDirty ? await createTempFile(Path.extname(document.uri.fsPath)) : undefined
    if (tmpFile) {
      await writeFile(tmpFile.filePath, document.getText())
    }

    const args = ['--diff', ...autopep8Args, tmpFile ? tmpFile.filePath : document.uri.fsPath]

    if (range && !range.isEmpty) {
      args.push(...['--line-range', (range!.start.line + 1).toString(), (range!.end.line + 1).toString()])
    }

    const stdout = await new Promise<string | null>((resolve, reject) => {
      const command = `${getModuleExecutable('autopep8', document.uri)} ${args.join(' ')}`
      // console.log({ command })
      exec(command, (err, stdout, stderr) => {
        // console.log('autopep8 exec complete', { command, err, stdout, stderr })
        if (err) {
          reject(err || stderr)
          let msg = 'Format with "autopep8" failed.'
          if (isModuleNotFoundError(err)) {
            msg += '\nPlease install "autopep8" in your python environment'
          }
          vscode.window.showErrorMessage(msg)
          resolve(null)
          return
        }
        resolve(stdout)
      })
    })

    if (stdout === null) {
      return []
    }

    const edits = getTextEditsFromPatch(document.getText(), stdout)
    // console.log({ edits })
    this.formatterMadeChanges = edits.length > 0
    if (tmpFile) {
      await removeFile(tmpFile.filePath)
      tmpFile.dispose()
    }
    return edits
  }

  public dispose() {
    this.disposables.forEach(d => d.dispose())
  }

  private async onSaveDocument(document: vscode.TextDocument): Promise<void> {
    // Promise was rejected = formatting took too long.
    // Don't format inside the event handler, do it on timeout
    setTimeout(() => {
      try {
        if (this.formatterMadeChanges
          && !document.isDirty
          && document.version === this.documentVersionBeforeFormatting) {
          // Formatter changes were not actually applied due to the timeout on save.
          // Force formatting now and then save the document.
          vscode.commands.executeCommand('editor.action.formatDocument').then(async () => {
            this.saving = true
            await document.save()
            this.saving = false
          })
        }
      } finally {
        this.documentVersionBeforeFormatting = -1
        this.saving = false
        this.formatterMadeChanges = false
      }
    }, 50)
  }
}

