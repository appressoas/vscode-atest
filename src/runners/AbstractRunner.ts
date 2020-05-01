import * as vscode from 'vscode';
import * as child_process from 'child_process';
import AbstractOutputHandler from "../outputhandlers/AbstractOutputHandler";
import WorkspaceFolderHelper from '../WorkspaceFolderHelper';
import { TExecutable, TRunnerOptions } from '../types';
import { ResultTreeItem } from '../ResultTreeItem';

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
    options: TRunnerOptions;

    constructor (public result: ResultTreeItem, outputChannel: vscode.OutputChannel, options?: TRunnerOptions) {
        this.options = options || {};
        this.workspaceFolderHelper = new WorkspaceFolderHelper(result.context.workspaceFolder);
        this.outputChannel = outputChannel;
        this.outputChannel.clear();
        this.outputChannel.show(true);
        this.executable = this.getExecutable();
        this.executableOptions = this.makeExecutableOptions();
        this.description = this.makeDescription();
        if (this.executable === null) {
            throw new Error('No test runner executable provided.');
        }
        this.result.clearResults();
    }
    
    protected abstract getExecutable(): TExecutable|null;
    protected abstract getOutputHandler(): AbstractOutputHandler;

    static getRunnerName () {
        throw new Error("Must be implemented in subclasses");
    }

    static canRunUri(uri: vscode.Uri): boolean {
        return false;
    }

    get workspaceFolder() {
        return this.result.context.workspaceFolder;
    }

    protected makeExecutableOptions () {
        return {
            cwd: this.workspaceFolder.uri.fsPath,
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

    run (): Promise<any> {
        this.result.setIsRunningTests(true);
        return new Promise((resolve, reject) => {
            if (this.executable === null) {
                reject(new Error('No test runner executable provided'));
                return;
            }
            this.outputChannel.appendLine(`Running: ${this.description}`);

            const outputHandler = this.getOutputHandler();
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
                    // this.outputChannel.appendLine(`${this.description}: Successful execution.`);
                    outputHandler.handleProcessDone().then(() => {
                        hasResolved = true;
                        this.result.setIsRunningTests(false);
                        resolve(null);
                    }).catch((error) => {
                        this.result.setIsRunningTests(false);
                        reject(error);
                    });
                } else {
                    console.warn(`${this.description}. Exit code: ${code}.`);
                    // this.outputChannel.appendLine(`${this.description}: Failed. Exit code: ${code}.`);
                    hasResolved = true;
                    outputHandler.handleProcessDone(true).then(() => {
                        hasResolved = true;
                        this.result.setIsRunningTests(false);
                        resolve(null);
                    }).catch((error) => {
                        this.result.setIsRunningTests(false);
                        reject(error);
                    });
                }
            });
        });
    }
}
