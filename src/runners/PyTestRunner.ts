import AbstractRunner from "./AbstractRunner";
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
// @ts-ignore
import * as expandHomeDir from 'expand-home-dir';
import AbstractOutputHandler from "../outputhandlers/AbstractOutputHandler";
import XunitOutputHandler from "../outputhandlers/XunitOutputHandler";
import { TExecutable } from "../types";
import { ResultTreeItem } from "../ResultTreeItem";
import PythonFileParser from "../PythonFileParser";


export default class PyTestRunner extends AbstractRunner {
    static getRunnerName () {
        return 'pytest';
    }

    get resultTreeItemsToRun(): ResultTreeItem[] {
        if (this.options.failedOnly) {
            return this.result.getAllFailedTestResultItems();
        }
        return [this.result];
    }

    // _getTestMethodOrClassPath(resultTreeItem: ResultTreeItem): string[] {
    //     return [];
    // }

    makePathToRun(resultTreeItem: ResultTreeItem): string {
        if (resultTreeItem.fileFsUri) {
            let pathToRun = this.workspaceFolderHelper.relativeFsPath(resultTreeItem.fileFsUri.fsPath);
            if (resultTreeItem.runMode && resultTreeItem.line != undefined) {
                const pythonParser = new PythonFileParser(resultTreeItem.fileFsUri, resultTreeItem.line);
                if (!pythonParser.closestTestClassName) {
                    throw new Error(`Could not find closest test class name in ${resultTreeItem.fileFsUri.fsPath} at line ${resultTreeItem.line + 1}.`);
                }
                if (resultTreeItem.runMode === 'closestMethod') {
                    if (!pythonParser.closestTestMethodName) {
                        throw new Error(`Could not find closest test method name in ${resultTreeItem.fileFsUri.fsPath} at line ${resultTreeItem.line + 1}.`);
                    }
                    pathToRun =`${pathToRun}::${pythonParser.closestTestClassName}::${pythonParser.closestTestMethodName}`;
                } else if (resultTreeItem.runMode === 'closestClass') {
                    pathToRun =`${pathToRun}::${pythonParser.closestTestClassName}`;
                } else {
                    throw new Error(`Invalid runMode: "${resultTreeItem.runMode}".`);
                }
            }
            return pathToRun;
        } else if (resultTreeItem.folderFsUri) {
            return this.workspaceFolderHelper.relativeFsPath(resultTreeItem.folderFsUri.fsPath);
        } else {
            // throw new Error('Can not run - no folder or file provided.');
            this.outputChannel.appendLine(`PyTestRunner can not run: ${resultTreeItem.toJson()}`);
            throw new Error(`PyTestRunner did not receive any runnable options for ${resultTreeItem.dottedPath}. See the output log for more details.`);
        }
    }

    get pathsToRun(): string[] {
        const pathsToRun: string[] = [];
        for (let resultTreeItem of this.resultTreeItemsToRun) {
            pathsToRun.push(this.makePathToRun(resultTreeItem));
        }
        return pathsToRun;
    }

    protected getExecutable(): TExecutable|null {
        let pythonPath: string|undefined = vscode.workspace.getConfiguration('python', this.workspaceFolder).get('pythonPath');
        if (!pythonPath) {
            vscode.window.showErrorMessage('No python.pythonPath configured.')
            return null;
        }
        pythonPath = expandHomeDir(pythonPath);
        const pythonBinPath = path.dirname(<string>pythonPath);
        const pytestPath = path.join(pythonBinPath, 'pytest')
        this.outputChannel.appendLine(`PyTestRunner using the following path for pytest: ${pytestPath}`)
        let args = [
            '-v', '-s',
            `--junit-xml=${this.workspaceFolderHelper.getTempDirectoryFilePath('tests.xml', true)}`
        ];
        args.push(...this.pathsToRun);
        return {
            command: pytestPath,
            args: args
        };
    }

    protected getOutputHandler(): AbstractOutputHandler {
        return new XunitOutputHandler(this.result, this.outputChannel, {
            testCaseHasFileAttribute: true
        });
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
