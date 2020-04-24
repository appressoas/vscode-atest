import AbstractRunner from "./AbstractRunner";
import * as vscode from 'vscode';
import * as path from 'path';
// @ts-ignore
import * as expandHomeDir from 'expand-home-dir';
import AbstractOutputHandler from "../outputhandlers/AbstractOutputHandler";
import XunitOutputHandler from "../outputhandlers/XunitOutputHandler";
import { TExecutable } from "../types";


export default class PyTestRunner extends AbstractRunner {
    protected getExecutable(): TExecutable|null {
        let pythonPath: string|undefined = vscode.workspace.getConfiguration('python', this.workspaceFolder).get('pythonPath');
        if (!pythonPath) {
            return null;
        }
        pythonPath = expandHomeDir(pythonPath);
        const pythonBinPath = path.dirname(<string>pythonPath);
        const pytestPath = path.join(pythonBinPath, 'pytest')
        const pathToRun = this.runnerOptions.fileFsPath || this.runnerOptions.folderFsPath
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
        return new XunitOutputHandler(this);
    }
}
