import * as vscode from 'vscode';
import {RUNNER_REGISTRY} from './runners/RunnerRegistry';

export default class WorkspaceFolderSettings {
    settings: vscode.WorkspaceConfiguration;

    constructor (public workspaceFolder: vscode.WorkspaceFolder) {
        this.settings = vscode.workspace.getConfiguration('atest', workspaceFolder);
        // console.log(this.settings)
    }

    // get genericRunnerExecutable(): TExecutable|null {
    //     const genericCommand: string|undefined = this.settings.get('genericCommand');
    //     const genericCommandArgs: Array<string>|undefined = this.settings.get('genericCommandArgs');
    //     const genericCommandEnv: {[key: string]: string}|undefined = this.settings.get('genericCommandEnv');
    //     if (genericCommand === undefined) {
    //         return null
    //     }
    //     return {
    //         command: genericCommand,
    //         args: genericCommandArgs || [],
    //         env: genericCommandEnv || {}
    //     };
    // }

    get rawRunners(): {[key: string]: any}|undefined {
        const runners: object|undefined = this.settings.get('runners');
        if (runners === undefined) {
            return {};
        }
        return runners;
    }

    get runners(): {[key: string]: any} {
        // TODO: Autodetect if not in settings
        return this.rawRunners || {};
    }

    getRunnerNamesFromUri(uri: vscode.Uri): string[] {
        const runnerNames: string[] = [];
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) {
            return runnerNames;
        }
        const settings = new WorkspaceFolderSettings(workspaceFolder);
        const enabledRunners = settings.runners;
        // console.log('enabledRunners', enabledRunners);
        for (let [runnerName, runnerClass] of RUNNER_REGISTRY.runnerClassMap.entries()) {
            if (enabledRunners[runnerName]) {
                if (runnerClass.canRunUri(uri)) {
                    runnerNames.push(runnerName);
                } else {
                    console.log(`Skipping "${runnerName}" - can not run ${uri.toString()}`);
                }
            } else {
                console.log(`Skipping "${runnerName}" - not in atest.runners setting`);
            }
        }
        return runnerNames;
    }
}
