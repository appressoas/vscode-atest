import * as vscode from 'vscode';
import WorkspaceFolderHelper from '../WorkspaceFolderHelper';
import { ResultTreeItem } from '../ResultTreeItem';

// https://stackabuse.com/executing-shell-commands-with-node-js/
// https://zaiste.net/nodejs-child-process-spawn-exec-fork-async-await/
// https://github.com/microsoft/vscode/issues/571
export default abstract class AbstractOutputHandler {
    workspaceFolderHelper: WorkspaceFolderHelper;
    options: {[key: string]: any};

    constructor (public result: ResultTreeItem, public outputChannel: vscode.OutputChannel, options?: {[key: string]: any}) {
        this.workspaceFolderHelper = new WorkspaceFolderHelper(result.context.workspaceFolder);
        this.options = options || {};
    }

    handleProcessStdout (data: string): void {
        this.outputChannel.append(data);
    }

    handleProcessStderr (data: string): void {
        this.outputChannel.append(data);
    }

    handleProcessError (error: Error): void {

    }

    async handleProcessDone (failed: boolean = false) {
        this.outputChannel.appendLine('DONE');
    }
}