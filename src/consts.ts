import { DocumentFilter } from 'vscode'

export const IDENTIFIER = 'pyformat'

export const PYTHON_LANGUAGE = 'python'
export const PYTHON: DocumentFilter[] = [
  { scheme: 'file', language: PYTHON_LANGUAGE },
  { scheme: 'untitled', language: PYTHON_LANGUAGE }
]

