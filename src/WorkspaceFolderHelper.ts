import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TExecutable } from './runners/AbstractRunner';
import WorkspaceFolderSettings from './WorkspaceFolderSettings';

export default class WorkspaceFolderHelper {
    settings: WorkspaceFolderSettings;

    constructor (public workspaceFolder: vscode.WorkspaceFolder) {
        this.settings = new WorkspaceFolderSettings(workspaceFolder);
    }

    relativeFsPath(fsPath: string) {
        return path.normalize(path.relative(this.workspaceFolder.uri.fsPath, fsPath));
    }

    absoluteFsPath(fsPath: string) {
        return path.resolve(this.workspaceFolder.uri.fsPath, fsPath);
    }

    get tempDirectoryPath(): string {
        const tempDirectoryPath = path.join(this.workspaceFolder.uri.fsPath, '.vscode-atest-temp');
        if (!fs.existsSync(tempDirectoryPath)) {
            fs.mkdirSync(tempDirectoryPath);
        }
        return tempDirectoryPath;
    }

    getTempDirectoryFilePath(filename: string, relative = false): string {
        const fsPath = path.join(this.tempDirectoryPath, filename);
        if (relative) {
            return this.relativeFsPath(fsPath);
        }
        return fsPath;
    }
}
