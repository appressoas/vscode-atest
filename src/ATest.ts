import * as vscode from 'vscode';
import { TestResultsProvider } from './TestResultsProvider';
import { WorkspaceFolderResultTreeItem, ResultTreeItem } from './ResultTreeItem';
import WorkspaceFolderSettings from './WorkspaceFolderSettings';

export default class ATest {
    testResultsProvider: TestResultsProvider;

    constructor () {
        this.testResultsProvider = new TestResultsProvider();
    }

    runTestAtCursor () {
        vscode.window.showInformationMessage('run test at cursor - not implemented yet.');
    }

    getTestRunnerNamesFromUri(uri: vscode.Uri) {
        
    }

    // getRunner (workspaceFolder: vscode.WorkspaceFolder, runnerOptions: TRunnerOptions): AbstractRunner {
    //     const runnerName = new WorkspaceFolderSettings(workspaceFolder).runner;
    //     // TODO: Autodetect runner?
    //     if (runnerName === 'pytest') {
    //         return new PyTestRunner(this.testResultsProvider, workspaceFolder, runnerOptions);
    //     } else {
    //         return new GenericRunner(this.testResultsProvider, workspaceFolder, runnerOptions);
    //     }
    // }

    runTestsInCurrentFile () {
        console.log('run tests in current file');
        // if (!vscode.workspace.workspaceFolders) {
        //     return;
        // }
        // const currentFileUri = vscode.window.activeTextEditor?.document.uri;
        // if (!currentFileUri) {
        //     return;
        // }
        // const currentFileWorkspaceFolder = vscode.workspace.getWorkspaceFolder(currentFileUri);
        // if (!currentFileWorkspaceFolder) {
        //     return;
        // }
        // // for (let workspaceFolder of vscode.workspace.workspaceFolders) {
        // //     this.getRunner(workspaceFolder).run()
        // //     .then(() => {
        // //         console.log('DONE');
        // //     });
        // // }
        // this.getRunner(currentFileWorkspaceFolder, {fileFsPath: currentFileUri.fsPath}).run()
        // .then(() => {
        // });
    }

    runTestsInFolder (folderUri: vscode.Uri) {
        vscode.window.showInformationMessage('run test in folder - not implemented yet.');
        // const currentFileWorkspaceFolder = vscode.workspace.getWorkspaceFolder(folderUri);
        // if (!currentFileWorkspaceFolder) {
        //     return;
        // }
        // this.getRunner(currentFileWorkspaceFolder, {folderFsPath: folderUri.fsPath}).run()
        // .then(() => {
        // });
    }

    runTestsInFile (fileUri: vscode.Uri) {
        vscode.window.showInformationMessage(`running tests in ${fileUri.fsPath}`);
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
        if (!workspaceFolder) {
            vscode.window.showErrorMessage(`ATest: Run tests in file - Could not find workspace folder for ${fileUri.fsPath}.`);
            return;
        }
        const settings = new WorkspaceFolderSettings(workspaceFolder);
        console.log(settings.getRunnerNamesFromUri(fileUri));
        for (let runnerName of settings.getRunnerNamesFromUri(fileUri)) {
            const result = new WorkspaceFolderResultTreeItem({
                workspaceFolder: workspaceFolder,
                runnerName: runnerName,
                container: this.testResultsProvider
            });
            result.fileFsUri = fileUri;
            this.testResultsProvider.runWorkspaceFolderResultTreeItem(result);
        }
    }

    testResultsShowSingleTest (resultTreeItem: ResultTreeItem) {
        // resultTreeItem.singleTestOutput.show().then(() => {});
    }

    testResultsReRunSingleTest (resultTreeItem: ResultTreeItem) {
        vscode.window.showInformationMessage('testResultsReRunSingleTest - not implemented yet.');
    }

    testResultsShowSingleTestFailureMessage (resultTreeItem: ResultTreeItem) {
        vscode.window.showInformationMessage('testResultsShowSingleTestFailureMessage - not implemented yet.');
    }

    testResultsReRunTestSet (resultTreeItem: ResultTreeItem) {
        vscode.window.showInformationMessage('testResultsReRunTestSet - not implemented yet.');
    }

    testResultsReRunFailedInTestSet (resultTreeItem: ResultTreeItem) {
        vscode.window.showInformationMessage('testResultsReRunFailedInTestSet - not implemented yet.');
    }

    testResultsShowTestSetFailureMessages (resultTreeItem: ResultTreeItem) {
        // testOutputSetTreeItem.testOutputSet.logFailures().then(() => {});
        // vscode.window.showInformationMessage('testResultsShowTestSetFailureMessages - not implemented yet.');
    }
}
