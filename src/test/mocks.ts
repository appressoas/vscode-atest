import * as vscode from 'vscode';
import { EResultTreeItemType } from '../types';
import { ResultTreeItem, IResultTreeItemContainer } from '../ResultTreeItem';


export class MockResultTreeItemContainer implements IResultTreeItemContainer {
    refreshSingleResultTreeItem(resultTreeItem: ResultTreeItem): void {

    }
}

export class MockResultTreeItem extends ResultTreeItem {
    constructor(codePath: string[] = []) {
        super(
            {
                workspaceFolder: vscode.workspace!.workspaceFolders![0],
                runnerName: 'mock',
                container: new MockResultTreeItemContainer()
            }, 
            codePath, EResultTreeItemType.Generic
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
