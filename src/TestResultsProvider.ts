import * as vscode from 'vscode';
import { ResultTreeItem, IResultTreeItemContainer, WorkspaceFolderResultTreeItem } from './ResultTreeItem';
import { TRunnerOptions } from './types';

// https://code.visualstudio.com/api/extension-guides/tree-view
// https://code.visualstudio.com/docs/getstarted/keybindings#_when-clause-contexts

export class TestResultsProvider implements vscode.TreeDataProvider<ResultTreeItem>, IResultTreeItemContainer {
    private _onDidChangeTreeData: vscode.EventEmitter<ResultTreeItem|undefined> = new vscode.EventEmitter<ResultTreeItem|undefined>();
    readonly onDidChangeTreeData: vscode.Event<ResultTreeItem|undefined> = this._onDidChangeTreeData.event;
    workspaceFolderResultTreeItemMap: Map<string, WorkspaceFolderResultTreeItem>;
    treeView: vscode.TreeView<ResultTreeItem>;
    showPassedTests: boolean;
    outputChannelMap: Map<string, vscode.OutputChannel>;

    constructor () {
        this.workspaceFolderResultTreeItemMap = new Map<string, WorkspaceFolderResultTreeItem>();
        this.outputChannelMap = new Map<string, vscode.OutputChannel>();
        this.showPassedTests = false;
        this.treeView = vscode.window.createTreeView('aTestTestResults', {
            treeDataProvider: this
        });
    }

    toggleShowPassedTests () {
        this.showPassedTests = !this.showPassedTests;
        this.refresh();
    }
  
    refresh(): void {
      this._onDidChangeTreeData.fire();
    }

    refreshSingleResultTreeItem(resultTreeItem: ResultTreeItem): void {
        this._onDidChangeTreeData.fire(resultTreeItem);
    }

    clear () {
        this.workspaceFolderResultTreeItemMap.clear();
        this.refresh();
    }

    revealItem (resultTreeItem: ResultTreeItem) {
        this.treeView.reveal(resultTreeItem);
    }

    setWorkspaceFolderResultTreeItem(resultTreeItem: WorkspaceFolderResultTreeItem, reveal: boolean = true): boolean {
        if (this.workspaceFolderResultTreeItemMap.has(resultTreeItem.context.workspaceFolder.name)) {
            const existingTreeItem = <ResultTreeItem>this.workspaceFolderResultTreeItemMap.get(resultTreeItem.context.workspaceFolder.name);
            if (existingTreeItem.isRunningTests()) {
                vscode.window.showWarningMessage(`Not running tests. Tests in ${existingTreeItem.context.workspaceFolder.name} is already running.`);
                return false;
            }
        }
        this.workspaceFolderResultTreeItemMap.set(resultTreeItem.context.workspaceFolder.name, resultTreeItem);
        this.refresh();
        if (reveal) {
            this.revealItem(resultTreeItem);
        }
        return true;
    }

    getOuputChannel (resultItem: WorkspaceFolderResultTreeItem): vscode.OutputChannel {
        const key = `${resultItem.context.workspaceFolder.name}:${resultItem.context.runnerName}`;
        let outputChannel = this.outputChannelMap.get(key);
        if (!outputChannel) {
            const name = `ATest[${resultItem.context.workspaceFolder.name}] ${resultItem.context.runnerName}`;
            outputChannel = vscode.window.createOutputChannel(name);
            this.outputChannelMap.set(key, outputChannel);
        }
        return outputChannel;
    }

    runWorkspaceFolderResultTreeItem (resultTreeItem: WorkspaceFolderResultTreeItem, runnerOptions?: TRunnerOptions) {
        if (this.setWorkspaceFolderResultTreeItem(resultTreeItem)) {
            resultTreeItem.run(this.getOuputChannel(resultTreeItem), runnerOptions)
                .then(() => {})
                .catch((error: Error) => {
                    vscode.window.showErrorMessage(`Test run failed: ${error.message}`);
                });
        }
    }

    getTreeItem(item: ResultTreeItem): vscode.TreeItem {
        return item;
    }

    getParent(resultTreeItem: ResultTreeItem): Thenable<ResultTreeItem|undefined> {
        return Promise.resolve(resultTreeItem.parent);
    }

    getChildren(resultTreeItem?: ResultTreeItem): Thenable<Array<ResultTreeItem>> {
        // console.log('getChildren', resultTreeItem);
        if (this.workspaceFolderResultTreeItemMap.size === 0) {
            return Promise.resolve([]);
        }
        if (resultTreeItem) {
            // console.log(resultTreeItem.toJson());
            if (this.showPassedTests) {
                return Promise.resolve(resultTreeItem.flattenedChildren);
            } else {
                return Promise.resolve(resultTreeItem.flattenedFailedChildren);
            }
        } else {
            return Promise.resolve(Array.from(this.workspaceFolderResultTreeItemMap.values()));
        }
    }
}
