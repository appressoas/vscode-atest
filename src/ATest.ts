import * as vscode from 'vscode';
import GenericRunner from './runners/GenericRunner';
import PyTestRunner from './runners/PyTestRunner';
import AbstractRunner, { TRunnerOptions } from './runners/AbstractRunner';
import WorkspaceFolderSettings from './WorkspaceFolderSettings';
import { TestResultsProvider, SingleTestOutputTreeItem, TestOutputSetTreeItem } from './TestResultsProvider';

export default class ATest {
    testResultsProvider: TestResultsProvider;

    constructor () {
        this.testResultsProvider = new TestResultsProvider();
        vscode.window.createTreeView('aTestTestResults', {
            treeDataProvider: this.testResultsProvider
        });
    }

    runTestAtCursor () {
        console.log('run test at cursor');
    }

    getRunner (workspaceFolder: vscode.WorkspaceFolder, runnerOptions: TRunnerOptions): AbstractRunner {
        const runnerName = new WorkspaceFolderSettings(workspaceFolder).runner;
        if (runnerName === 'pytest') {
            return new PyTestRunner(this.testResultsProvider, workspaceFolder, runnerOptions);
        } else {
            return new GenericRunner(this.testResultsProvider, workspaceFolder, runnerOptions);
        }
    }

    runTestsInCurrentFile () {
        console.log('run tests in current file');
        if (!vscode.workspace.workspaceFolders) {
            return;
        }
        const currentFileUri = vscode.window.activeTextEditor?.document.uri;
        if (!currentFileUri) {
            return;
        }
        const currentFileWorkspaceFolder = vscode.workspace.getWorkspaceFolder(currentFileUri);
        if (!currentFileWorkspaceFolder) {
            return;
        }
        // for (let workspaceFolder of vscode.workspace.workspaceFolders) {
        //     this.getRunner(workspaceFolder).run()
        //     .then(() => {
        //         console.log('DONE');
        //     });
        // }
        this.getRunner(currentFileWorkspaceFolder, {fileToRunTestsIn: currentFileUri.fsPath}).run()
        .then(() => {
        });
    }

    runTestsInFolder (folderUri: vscode.Uri) {
        console.log('runTestsInFolder!', folderUri);
        const currentFileWorkspaceFolder = vscode.workspace.getWorkspaceFolder(folderUri);
        if (!currentFileWorkspaceFolder) {
            return;
        }
        this.getRunner(currentFileWorkspaceFolder, {folderToRunTestsIn: folderUri.fsPath}).run()
        .then(() => {
        });
    }

    runTestsInFile (fileUri: vscode.Uri) {
        console.log('runTestsInFile!');
        const currentFileWorkspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
        if (!currentFileWorkspaceFolder) {
            return;
        }
        this.getRunner(currentFileWorkspaceFolder, {fileToRunTestsIn: fileUri.fsPath}).run()
        .then(() => {
        });
    }

    testResultsShowSingleTest (singleTestOutputTreeItem: SingleTestOutputTreeItem) {
        singleTestOutputTreeItem.singleTestOutput.show().then(() => {});
    }

    testResultsReRunSingleTest (singleTestOutputTreeItem: SingleTestOutputTreeItem) {
        vscode.window.showInformationMessage('testResultsReRunSingleTest - not implemented yet.');
    }

    testResultsShowSingleTestFailureMessage (singleTestOutputTreeItem: SingleTestOutputTreeItem) {
        vscode.window.showInformationMessage('testResultsShowSingleTestFailureMessage - not implemented yet.');
    }

    testResultsReRunTestSet (testOutputSetTreeItem: TestOutputSetTreeItem) {
        vscode.window.showInformationMessage('testResultsReRunTestSet - not implemented yet.');
    }

    testResultsReRunFailedInTestSet (testOutputSetTreeItem: TestOutputSetTreeItem) {
        vscode.window.showInformationMessage('testResultsReRunFailedInTestSet - not implemented yet.');
    }

    testResultsShowTestSetFailureMessages (testOutputSetTreeItem: TestOutputSetTreeItem) {
        testOutputSetTreeItem.testOutputSet.logFailures().then(() => {});
        // vscode.window.showInformationMessage('testResultsShowTestSetFailureMessages - not implemented yet.');
    }
}
