import AbstractRunner from "./AbstractRunner";
import * as vscode from 'vscode';
import AbstractOutputHandler from "../outputhandlers/AbstractOutputHandler";
import DumbLogOutputHandler from "../outputhandlers/DumbLogOutputHandler";
import WorkspaceFolderSettings from "../WorkspaceFolderSettings";
import { TExecutable } from "../types";


// https://code.visualstudio.com/docs/editor/variables-reference
// https://stackoverflow.com/questions/44151691/vscode-is-there-an-api-for-accessing-config-values-from-a-vscode-extension

export default class GenericRunner extends AbstractRunner {
    protected getExecutable(): TExecutable|null {
        return this.workspaceFolderHelper.settings.genericRunnerExecutable;
    }

    protected getOutputHandler(): AbstractOutputHandler {
        return new DumbLogOutputHandler(this);
    }
}
