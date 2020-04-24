import * as vscode from 'vscode';
import AbstractRunner, { TExecutable, TRunnerOptions } from "../runners/AbstractRunner";
import AbstractOutputHandler from '../outputhandlers/AbstractOutputHandler';
import DumbLogOutputHandler from '../outputhandlers/DumbLogOutputHandler';
import { TestResultsProvider } from '../TestResultsProvider';


export class MockRunner extends AbstractRunner {
    constructor (runnerOptions: TRunnerOptions = {}) {
		const workspaceFolder = vscode.workspace!.workspaceFolders![0];
		super(new TestResultsProvider(), workspaceFolder, runnerOptions);
	}

    protected getExecutable(): TExecutable|null {
        return null;
    }
    
    protected getOutputHandler(): AbstractOutputHandler {
        return new DumbLogOutputHandler(this);
    }
}
