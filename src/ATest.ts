import * as vscode from 'vscode';
import { TestResultsProvider } from './TestResultsProvider';
import { WorkspaceFolderResultTreeItem, ResultTreeItem } from './ResultTreeItem';
import WorkspaceFolderSettings from './WorkspaceFolderSettings';

export default class ATest {
    testResultsProvider: TestResultsProvider;

    constructor () {
        this.testResultsProvider = new TestResultsProvider();
    }

    private _runTestsAtUri (uri: vscode.Uri, setOptions: (resultTreeItem: ResultTreeItem) => void) {
        vscode.window.showInformationMessage(`running tests in ${uri.fsPath}`);
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) {
            vscode.window.showErrorMessage(`ATest: Could not find workspace folder for ${uri.fsPath}.`);
            return;
        }
        const settings = new WorkspaceFolderSettings(workspaceFolder);
        const runnerNames = settings.getRunnerNamesFromUri(uri);
        if (runnerNames.length === 0) {
            vscode.window.showErrorMessage(`ATest: Could not find runners that can handle ${uri.fsPath}.`);
            return;
        }
        for (let runnerName of settings.getRunnerNamesFromUri(uri)) {
            const result = new WorkspaceFolderResultTreeItem({
                workspaceFolder: workspaceFolder,
                runnerName: runnerName,
                container: this.testResultsProvider
            });
            setOptions(result);
            this.testResultsProvider.runWorkspaceFolderResultTreeItem(result);
        }
    }

    // runTestAtCursor () {
    //     vscode.window.showInformationMessage('run test at cursor - not implemented yet.');
    // }

    runTestsInCurrentFile () {
        const currentFileUri = vscode.window.activeTextEditor?.document.uri;
        if (!currentFileUri) {
            vscode.window.showErrorMessage(`ATest: Could not find current file URI.`);
            return;
        }
        this._runTestsAtUri(currentFileUri, (resultTreeItem: ResultTreeItem) => {
            resultTreeItem.fileFsUri = currentFileUri;
        });
    }

    runTestsInFolder (folderUri: vscode.Uri) {
        this._runTestsAtUri(folderUri, (resultTreeItem: ResultTreeItem) => {
            resultTreeItem.folderFsUri = folderUri;
        });
    }

    runTestsInFile (fileUri: vscode.Uri) {
        this._runTestsAtUri(fileUri, (resultTreeItem: ResultTreeItem) => {
            resultTreeItem.fileFsUri = fileUri;
        });
    }

    testResultsShowSingleTest (resultTreeItem: ResultTreeItem) {
        resultTreeItem.show().then(() => {});
    }

    testResultsReRunSingleTest (resultTreeItem: ResultTreeItem) {
        // vscode.window.showInformationMessage('testResultsReRunSingleTest - not implemented yet.');
        resultTreeItem.reRun();
    }

    testResultsShowSingleTestFailureMessage (resultTreeItem: ResultTreeItem) {
        resultTreeItem.showTestResults().then(() => {});
    }

    testResultsReRunTestSet (resultTreeItem: ResultTreeItem) {
        vscode.window.showInformationMessage('testResultsReRunTestSet - not implemented yet.');
    }

    testResultsReRunFailedInTestSet (resultTreeItem: ResultTreeItem) {
        vscode.window.showInformationMessage('testResultsReRunFailedInTestSet - not implemented yet.');
    }

    testResultsShowTestSetFailureMessages (resultTreeItem: ResultTreeItem) {
        // vscode.window.showInformationMessage('testResultsShowTestSetFailureMessages - not implemented yet.');
        resultTreeItem.showTestResults().then(() => {});
    }

    clearTestOutputList () {
        this.testResultsProvider.clear();
    }
}
