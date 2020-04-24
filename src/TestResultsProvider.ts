import * as vscode from 'vscode';
import * as path from 'path';
import AbstractOutputHandler from './outputhandlers/AbstractOutputHandler';
import { TestOutputSet, SingleTestOutput } from './TestOutputSet';

// https://code.visualstudio.com/api/extension-guides/tree-view
// https://code.visualstudio.com/docs/getstarted/keybindings#_when-clause-contexts

export class TestResultsProvider implements vscode.TreeDataProvider<SingleTestOutputTreeItem|TestOutputSetTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SingleTestOutputTreeItem|TestOutputSetTreeItem|undefined> = new vscode.EventEmitter<SingleTestOutputTreeItem|TestOutputSetTreeItem|undefined>();
    readonly onDidChangeTreeData: vscode.Event<SingleTestOutputTreeItem|TestOutputSetTreeItem|undefined> = this._onDidChangeTreeData.event;
    outputHandler: AbstractOutputHandler|null;

    constructor () {
        this.outputHandler = null;
    }
  
    refresh(): void {
      this._onDidChangeTreeData.fire();
    }

    setOutputHandler (outputHandler: AbstractOutputHandler) {
        this.outputHandler = outputHandler;
        this.refresh();
    }

    getTreeItem(item: SingleTestOutputTreeItem|TestOutputSetTreeItem): vscode.TreeItem {
        return item;
    }

    getChildren(element?: SingleTestOutputTreeItem|TestOutputSetTreeItem): Thenable<Array<SingleTestOutputTreeItem|TestOutputSetTreeItem>> {
        if (!this.outputHandler) {
            return Promise.resolve([]);
        }
        if (element && element instanceof SingleTestOutputTreeItem) {
            return Promise.resolve([]);
        }
        // let testOutputSet: TestOutputSet|null = null;

        // if (element) {
        //     if (element.testOutputSet) {
        //         testOutputSet = element.testOutputSet;
        //     }
        // } else {
        //     if (!this.outputHandler.testOutputSet.isLeaf) {
        //         testOutputSet = this.outputHandler.testOutputSet;
        //     } 
        // }
        // const children: TestResultItem[] = [];
        // if (testOutputSet) {
        //     for (let subset of testOutputSet.subsets.values()) {
        //         children.push(new TestResultItem(subset, null));
        //     }
        //     for (let singleTestOutput of testOutputSet.outputs.values()) {
        //         children.push(new TestResultItem(null, singleTestOutput));
        //     }
        // }
        // return Promise.resolve(children);

        let testOutputSet = this.outputHandler.testOutputSet;
        if (element) {
            const outputSetTreeItem = <TestOutputSetTreeItem>element;
            testOutputSet = outputSetTreeItem.testOutputSet;
        }

        const children: Array<SingleTestOutputTreeItem|TestOutputSetTreeItem> = [];
        for (let subset of testOutputSet.subsets.values()) {
            children.push(new TestOutputSetTreeItem(subset));
        }
        for (let singleTestOutput of testOutputSet.outputs.values()) {
            children.push(new SingleTestOutputTreeItem(singleTestOutput));
        }

        return Promise.resolve(children);
    }
}

export class TestOutputSetTreeItem extends vscode.TreeItem {
    constructor(
        public readonly testOutputSet: TestOutputSet
    ) {
        super(
            testOutputSet.name || 'UNDEFINED NAME', 
            testOutputSet.containsFailed? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed);
    }

    get contextValue () {
        if (this.testOutputSet.containsFailed) {
            return 'atestFailedOutputSet';
        } else {
            return 'atestPassedOutputSet';
        }
    }

    // get tooltip(): string {
    //     return `${this.label} Tooltip`;
    // }
    
    get description(): string {
        return `${this.testOutputSet.failedTestCount} / ${this.testOutputSet.testCount} failed`
    }

    // iconPath = {
    //   light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    //   dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
    // };
}

export class SingleTestOutputTreeItem extends vscode.TreeItem {
    constructor(
        public readonly singleTestOutput: SingleTestOutput
    ) {
        super(singleTestOutput.name, vscode.TreeItemCollapsibleState.None);
    }

    get contextValue () {
        if (this.singleTestOutput.isFailure) {
            return 'atestFailedSingleTest';
        } else {
            return 'atestPassedSingleTest';
        }
    }

    // get tooltip(): string {
    //     return `${this.label} Tooltip`;
    // }
    
    get description(): string {
        if (this.singleTestOutput.isFailure) {
            return 'FAILED'
        } else {
            return 'Passed'
        }
    }

    get iconPath() {
        if (this.singleTestOutput.isFailure) {
            return {
                light: path.join(__filename, '..', '..', 'icons', 'failed.svg'),
                dark: path.join(__filename, '..', '..', 'icons', 'failed.svg')
            }
        } else {
                return {
                    light: path.join(__filename, '..', '..', 'icons', 'passed.svg'),
                    dark: path.join(__filename, '..', '..', 'icons', 'passed.svg')
                }
        }
    }
}
