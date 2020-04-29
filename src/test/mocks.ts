import * as vscode from 'vscode';
import { EResultTreeItemType, TRunnerOptions } from '../types';
import { ResultTreeItem, IResultTreeItemContainer, WorkspaceFolderResultTreeItem } from '../ResultTreeItem';


export class MockResultTreeItemContainer implements IResultTreeItemContainer {
    refreshSingleResultTreeItem(resultTreeItem: ResultTreeItem): void {

    }

    runWorkspaceFolderResultTreeItem (resultTreeItem: WorkspaceFolderResultTreeItem, runnerOptions?: TRunnerOptions): void {
        
    }
}

export class MockResultTreeItem extends ResultTreeItem {
    constructor(name: string = 'mockroot') {
        super(
            {
                workspaceFolder: vscode.workspace!.workspaceFolders![0],
                runnerName: 'mock',
                container: new MockResultTreeItemContainer()
            }, 
            name, EResultTreeItemType.Generic
        );
    }
}
