import { ExecException } from 'child_process'
import * as Path from 'path'
import * as vscode from 'vscode'

export function getModuleExecutable(moduleName: string, documentUri: vscode.Uri): string {
  const pythonConfig = vscode.workspace.getConfiguration('python', documentUri)
  const venvPath: string = pythonConfig.get('venvPath') || ''
  const pythonPath: string = pythonConfig.get('pythonPath') || ''
  const workspacePath = vscode.workspace.getWorkspaceFolder(documentUri)!.uri.fsPath
  if (venvPath) {
    if (isAbsolutePath(venvPath)) {
      // absolute path
      return Path.join(venvPath, 'bin', moduleName)
    } else {
      return Path.normalize(Path.join(workspacePath, venvPath, 'bin', moduleName))
    }
  } else if (pythonPath) {
    if (pythonPath.startsWith('python' || isAbsolutePath(pythonPath))) {
      // absolute path or global inteperator
      return `${pythonPath} -m ${moduleName}`
    } else {
      // relative path
      return `${Path.join(workspacePath, pythonPath)} -m ${moduleName}`
    }
  } else {
    return moduleName
  }
}

export function isModuleNotFoundError(err: ExecException): boolean {
  if (
    (err.code as any) === 'ENOENT' ||
    err.code === 127 ||
    err.message.indexOf('No module named') >= 0
  ) {
    return true
  }
  return false
}

function isAbsolutePath(path: string) {
  if (path.startsWith('/') || path.indexOf(':\\') >= 0) {
    return true
  } else {
    return false
  }
}