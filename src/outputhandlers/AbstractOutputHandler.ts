import * as vscode from 'vscode';
import AbstractRunner from '../runners/AbstractRunner';
import WorkspaceFolderHelper from '../WorkspaceFolderHelper';
import { TestOutputSet } from '../TestOutputSet';
import { TestResultsProvider } from '../TestResultsProvider';

// https://stackabuse.com/executing-shell-commands-with-node-js/
// https://zaiste.net/nodejs-child-process-spawn-exec-fork-async-await/
// https://github.com/microsoft/vscode/issues/571
export default abstract class AbstractOutputHandler {
    testOutputSet: TestOutputSet;

    constructor (public runner: AbstractRunner) {
        this.testOutputSet = new TestOutputSet();
    }

    get workspaceFolderHelper (): WorkspaceFolderHelper {
        return this.runner.workspaceFolderHelper;
    }

    get testResultsProvider (): TestResultsProvider {
        return this.runner.testResultsProvider;
    }

    // get workspaceFolder (): vscode.WorkspaceFolder {
    //     return this.workspaceFolderHelper.workspaceFolder;
    // }

    get outputChannel (): vscode.OutputChannel {
        return this.runner.outputChannel;
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