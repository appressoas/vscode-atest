import AbstractRunner from "./AbstractRunner";
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
// @ts-ignore
import * as expandHomeDir from 'expand-home-dir';
import AbstractOutputHandler from "../outputhandlers/AbstractOutputHandler";
import XunitOutputHandler from "../outputhandlers/XunitOutputHandler";
import { TExecutable } from "../types";


export default class PyTestRunner extends AbstractRunner {
    static getRunnerName () {
        return 'pytest';
    }

    protected getExecutable(): TExecutable|null {
        let pythonPath: string|undefined = vscode.workspace.getConfiguration('python', this.workspaceFolder).get('pythonPath');
        if (!pythonPath) {
            return null;
        }
        pythonPath = expandHomeDir(pythonPath);
        const pythonBinPath = path.dirname(<string>pythonPath);
        const pytestPath = path.join(pythonBinPath, 'pytest')
        let pathToRun;
        if (this.result.fileFsUri) {
            pathToRun = this.result.fileFsUri.fsPath;
            if (this.result.testCasePath) {
                const testCaseClassName = this.result.testCasePath[this.result.testCasePath.length - 1];
                pathToRun = `${pathToRun}::${testCaseClassName}`
            }
            if (this.result.testPath) {
                pathToRun = `${pathToRun}::${this.result.testPath[0]}`
            }
        } else if (this.result.folderFsUri) {
            pathToRun = this.result.folderFsUri.fsPath;
        } else {
            // throw new Error('Can not run - no folder or file provided.');
            vscode.window.showErrorMessage('ATest: PyTestRunner did not receive any runnable options. See the output log for more details.');
            this.outputChannel.appendLine(`PyTestRunner can not run: ${this.result.toJson()}`);
            return null;
        }
        let args = [
            '-v',
            `--junit-xml=${this.workspaceFolderHelper.getTempDirectoryFilePath('tests.xml', true)}`
        ];
        if (pathToRun) {
            args.push(this.workspaceFolderHelper.relativeFsPath(pathToRun))
        }
        return {
            command: pytestPath,
            args: args
        };
    }

    protected getOutputHandler(): AbstractOutputHandler {
        return new XunitOutputHandler(this.result, this.outputChannel);
    }

    static canRunUri(uri: vscode.Uri): boolean {
        const stat = fs.lstatSync(uri.fsPath);
        if (stat.isDirectory()) {
            return true;
        }
        if (stat.isFile() && uri.fsPath.endsWith('.py')) {
            return true;
        }
        return false;
    }
}
