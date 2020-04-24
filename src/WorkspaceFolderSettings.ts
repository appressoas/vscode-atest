import * as vscode from 'vscode';
import { TExecutable } from './types';

export default class WorkspaceFolderSettings {
    settings: vscode.WorkspaceConfiguration;

    constructor (public workspaceFolder: vscode.WorkspaceFolder) {
        this.settings = vscode.workspace.getConfiguration('atest', workspaceFolder);
        // console.log(this.settings)
    }

    get genericRunnerExecutable(): TExecutable|null {
        const genericCommand: string|undefined = this.settings.get('genericCommand');
        const genericCommandArgs: Array<string>|undefined = this.settings.get('genericCommandArgs');
        const genericCommandEnv: {[key: string]: string}|undefined = this.settings.get('genericCommandEnv');
        if (genericCommand === undefined) {
            return null
        }
        return {
            command: genericCommand,
            args: genericCommandArgs || [],
            env: genericCommandEnv || {}
        };
    }

    get runner(): string|null {
        const runner: string|undefined = this.settings.get('runner');
        if (runner === undefined) {
            return null;
        }
        return runner;
    }
}
