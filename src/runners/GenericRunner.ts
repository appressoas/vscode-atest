import AbstractRunner from "./AbstractRunner";
import AbstractOutputHandler from "../outputhandlers/AbstractOutputHandler";
import DumbLogOutputHandler from "../outputhandlers/DumbLogOutputHandler";
import { TExecutable } from "../types";


// https://code.visualstudio.com/docs/editor/variables-reference
// https://stackoverflow.com/questions/44151691/vscode-is-there-an-api-for-accessing-config-values-from-a-vscode-extension

export default class GenericRunner extends AbstractRunner {
    static getRunnerName () {
        return 'generic';
    }

    protected getExecutable(): TExecutable|null {
        // return this.workspaceFolderHelper.settings.genericRunnerExecutable;
        return null;
    }

    protected getOutputHandler(): AbstractOutputHandler {
        return new DumbLogOutputHandler(this.result, this.outputChannel);
    }
}
