import * as vscode from 'vscode';
import * as child_process from 'child_process';
import AbstractOutputHandler from "../outputhandlers/AbstractOutputHandler";
import WorkspaceFolderHelper from '../WorkspaceFolderHelper';
import { TestResultsProvider } from '../TestResultsProvider';

export type TExecutable = {
    command: string;
    args: Array<string>;
    env?: {[key: string]: string};
}

export type TRunnerOptions = {
    fileToRunTestsIn?: string|undefined;
    folderToRunTestsIn?: string|undefined;
}

export class RunnerError extends Error {
    constructor(public runner: AbstractRunner, public error: Error|null = null) {
        super(`Failed to run: ${runner.description}. Error: ${error?.message}`);
    }
}


export default abstract class AbstractRunner {
    executable: TExecutable|null;
    executableOptions: object;
    description: string;
    outputChannel: vscode.OutputChannel;
    workspaceFolderHelper: WorkspaceFolderHelper;

    constructor (public testResultsProvider: TestResultsProvider, public workspaceFolder: vscode.WorkspaceFolder, public runnerOptions: TRunnerOptions) {
        this.workspaceFolderHelper = new WorkspaceFolderHelper(workspaceFolder);
        this.executable = this.getExecutable();
        this.executableOptions = this.makeExecutableOptions();
        this.description = this.makeDescription();
        this.outputChannel = vscode.window.createOutputChannel(this.outputChannelName);
        if (this.executable === null) {
            this.outputChannel.appendLine('No test runner executable provided.');
        }
    }
    
    protected abstract getExecutable(): TExecutable|null;
    protected abstract getOutputHandler(): AbstractOutputHandler;

    protected makeExecutableOptions () {
        return {
            cwd: this.workspaceFolder.uri.path,
            env: this.executable?.env || {}
        }
    }

    protected makeDescription () {
        if (this.executable === null) {
            return ''
        }
        const prettyArgs = JSON.stringify(this.executable.args);
        const prettyOptions = JSON.stringify(this.executableOptions);
        return `${this.executable.command} args=${prettyArgs}, options: ${prettyOptions}`
    }

    get outputChannelNameSuffix (): string {
        return this.executable?.command || 'NO TEST COMMAND'
    }

    get outputChannelName () {
        return `ATest[${this.workspaceFolder.name}] ${this.outputChannelNameSuffix}`;
    }

    async run () {
        return new Promise((resolve, reject) => {
            if (this.executable === null) {
                reject(new Error('No test runner executable provided'));
                return;
            }
            this.outputChannel.clear();
            this.outputChannel.appendLine(`Running: ${this.description}`);
            this.outputChannel.show();
            
            const outputHandler = this.getOutputHandler();
            this.testResultsProvider.setOutputHandler(outputHandler);
            let hasResolved = false;
            const childProcess = child_process.spawn(this.executable.command, this.executable.args, this.executableOptions);
            childProcess.stdout.on('data', (data) => {
                outputHandler.handleProcessStdout(`${data}`);
            });
            childProcess.stderr.on('data', (data) => {
                outputHandler.handleProcessStderr(`${data}`);
            });
            // childProcess.on('error', (error) => {
            //     this.outputChannel.appendLine(`Failed to run: ${this.description}. Error: ${error?.message}`);
            //     outputHandler.handleProcessError(error);
            //     if (!hasResolved) {
            //         resolve(null);
            //         hasResolved = true;
            //     }
            // });
            childProcess.on('close', (code) => {
                if (hasResolved) {
                    return;
                }
                if (code === 0) {
                    // console.log('SUCCESS');
                    outputHandler.handleProcessDone().then(() => {
                        hasResolved = true;
                        resolve(null);
                    });
                } else {
                    console.warn(`${this.description}. Exit code: ${code}.`);
                    // this.outputChannel.appendLine(`Failed to run: ${this.description}. Exit code: ${code}.`);
                    hasResolved = true;
                    resolve(null);
                    outputHandler.handleProcessDone(true).then(() => {
                        hasResolved = true;
                        resolve(null);
                    });
                }
            });
        });
    }
}
