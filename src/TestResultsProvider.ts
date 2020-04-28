import * as vscode from 'vscode';
import { ResultTreeItem, IResultTreeItemContainer, WorkspaceFolderResultTreeItem } from './ResultTreeItem';

// https://code.visualstudio.com/api/extension-guides/tree-view
// https://code.visualstudio.com/docs/getstarted/keybindings#_when-clause-contexts

export class TestResultsProvider implements vscode.TreeDataProvider<ResultTreeItem>, IResultTreeItemContainer {
    private _onDidChangeTreeData: vscode.EventEmitter<ResultTreeItem|undefined> = new vscode.EventEmitter<ResultTreeItem|undefined>();
    readonly onDidChangeTreeData: vscode.Event<ResultTreeItem|undefined> = this._onDidChangeTreeData.event;
    workspaceFolderResultTreeItemMap: Map<string, WorkspaceFolderResultTreeItem>;
    treeView: vscode.TreeView<ResultTreeItem>;

    constructor () {
        this.workspaceFolderResultTreeItemMap = new Map<string, WorkspaceFolderResultTreeItem>();
        this.treeView = vscode.window.createTreeView('aTestTestResults', {
            treeDataProvider: this
        });
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

    setWorkspaceFolderResultTreeItem(resultTreeItem: WorkspaceFolderResultTreeItem, reveal: boolean = true) {
        this.workspaceFolderResultTreeItemMap.set(resultTreeItem.context.workspaceFolder.name, resultTreeItem);
        this.refresh();
        if (reveal) {
            this.revealItem(resultTreeItem);
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
            return Promise.resolve(resultTreeItem.flattenedChildren);
        } else {
            return Promise.resolve(Array.from(this.workspaceFolderResultTreeItemMap.values()));
        }
    }
}
