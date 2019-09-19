import * as fs from 'fs'
import * as tmp from 'tmp'
import { Disposable } from 'vscode'

export type TemporaryFile = { filePath: string } & Disposable

export function createTemporaryFile(extension: string): Promise<TemporaryFile> {
  return new Promise<TemporaryFile>((resolve, reject) => {
    tmp.file({ postfix: extension }, (err, tmpFile, _, cleanupCallback) => {
      if (err) {
        return reject(err)
      }
      resolve({ filePath: tmpFile, dispose: cleanupCallback })
    })
  })
}

export async function writeFile(filePath: string, text: string) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, text, { encoding: 'utf8' }, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

export async function removeFile(filePath: string) {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}