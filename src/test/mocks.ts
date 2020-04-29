import * as vscode from 'vscode';
import { EResultTreeItemType } from '../types';
import { ResultTreeItem, IResultTreeItemContainer, WorkspaceFolderResultTreeItem } from '../ResultTreeItem';


export class MockResultTreeItemContainer implements IResultTreeItemContainer {
    refreshSingleResultTreeItem(resultTreeItem: ResultTreeItem): void {

    }

    runWorkspaceFolderResultTreeItem (resultTreeItem: WorkspaceFolderResultTreeItem): void {
        
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


// export class MockRunner extends AbstractRunner {
//     constructor (runnerOptions: TRunnerOptions = {}) {
// 		const workspaceFolder = vscode.workspace!.workspaceFolders![0];
// 		super(new TestResultsProvider(), workspaceFolder, runnerOptions);
// 	}

//     protected getExecutable(): TExecutable|null {
//         return null;
//     }
    
//     protected getOutputHandler(): AbstractOutputHandler {
//         return new DumbLogOutputHandler(this);
//     }
// }
