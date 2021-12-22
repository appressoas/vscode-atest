import { readFileSync } from 'fs';
import * as vscode from 'vscode';

const METHOD_REGEX = /(\s*)def\s+(test_\w+)\s?\(/i;
const CLASS_REGEX = /(\s*)class\s+(\w+)/i;

export default class PythonFileParser {
    lineNumber: number;
    closestTestClassName?: string;
    closestTestMethodName?: string;
    fileFsUri: vscode.Uri;

    constructor (fileFsUri: vscode.Uri, lineNumber: number) {
        this.fileFsUri = fileFsUri;
        this.lineNumber = lineNumber;
        this.parse();
    }

    parse () {
        const fileLines = readFileSync(this.fileFsUri.fsPath, 'utf-8').split(/\r?\n/);
        let lineNumber = 0;
        for (const line of fileLines) {
            if (!line.trim().startsWith('#')) {
                const classMatch = line.match(CLASS_REGEX);
                if (classMatch && line.toLocaleLowerCase().indexOf('test') !== -1) {
                    this.closestTestClassName = classMatch[2];
                }
                if (this.closestTestClassName) {
                    // We must have found a test class to even try to match a test method.
                    const methodMatch = line.match(METHOD_REGEX);
                    if (methodMatch) {
                        this.closestTestMethodName = methodMatch[2];
                    }
                }
                if (lineNumber >= this.lineNumber && this.closestTestClassName && this.closestTestMethodName) {
                    // No need to parse further. We are done parsing the provided lineNumber,
                    // and we have a test class and method. If we have not found it above the line number,
                    // this will return with the first below.
                    break;
                }
            }
            lineNumber += 1;
        }
        // console.log('DONE:', this.closestTestClassName, '::', this.closestTestMethodName);
    }
}