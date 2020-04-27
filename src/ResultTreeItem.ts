import * as vscode from 'vscode';
import { EResultTreeItemType, EResultTreeItemStatus } from './types';
import PyTestRunner from './runners/PyTestRunner';
import GenericRunner from './runners/GenericRunner';
import WorkspaceFolderHelper from './WorkspaceFolderHelper';

export interface IResultTreeItemContainer {
    refreshSingleResultTreeItem(resultTreeItem: ResultTreeItem): void;
}

export type TResultTreeItemContext = {
    workspaceFolder: vscode.WorkspaceFolder;
    runnerName: string;
    container: IResultTreeItemContainer;
}

export class ResultTreeItem extends vscode.TreeItem {
    context: TResultTreeItemContext;

    // Parent - only undefined for root item.
    parent?: ResultTreeItem;

    // Children
    children: Map<string, ResultTreeItem>;

    // Children that contains at least one failed test.
    // Updated by the optimize() method, so only awailable after all
    // tests are run.
    failedChildren: Map<string, ResultTreeItem>;

    resultType: EResultTreeItemType;
    
    // The status of this item.
    status: EResultTreeItemStatus;

    // Code path to what this is a result for as an array.
    private _codePath: Array<string>;
    
    // Absolute path to the file that was the target of this test run.
    fileFsUri?: vscode.Uri;

    // Absolute path to the folder that was the target for this test run.
    folderFsUri?: vscode.Uri;
    
    // Line number in ``fileFsPath`` where the test is located.
    line?: number;

    // // The name of the test suite. Used when re-running tests,
    // // and the format is highly language and test-runner dependent.
    // // Typically the code path to the test suite class/module.
    // testSuiteName?: string;

    // // The name of the test case. Used when re-running tests,
    // // and the format is highly language and test-runner dependent.
    // // Typically the code path to the test case class, or the relative code
    // // path from the ``testSuiteName``.
    // testCaseName?: string;

    // // The name of the test. Used when re-running tests,
    // // and the format is highly language and test-runner dependent.
    // // Typically the code path to the test case function/method, or the relative code
    // // path from the ``testCaseName``.
    // testName?: string;

    // Failure message (if the test failed). Only used if resultType is EResultTreeItemType.Test.
    // If this is set (not undefined), it means that the test failed.
    failureMessage?: string;

    // Number of tests within this item (recursively)
    testCount: number;

    // Number of failed tests within this item (recursively).
    // Updated by the optimize() method, so only awailable after all
    // tests are run.
    failedTestCount: number;

    private _isOptimized: boolean;

    constructor(context: TResultTreeItemContext, codePath: string[], resultType: EResultTreeItemType) {
        super('x');  // NOTE: setCodePath sets the label, so it will not be 'x'
        this._codePath = [];  // Just to get typescript to shut up - we set it right below!
        this.setCodePath(codePath);
        this.context = context;
        this.resultType = resultType;
        this.testCount = 0;
        this.failedTestCount = 0;
        this.status = EResultTreeItemStatus.Done;
        this.children = new Map<string, ResultTreeItem>();
        this.failedChildren = new Map<string, ResultTreeItem>();
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        this._isOptimized = false;
    }

    refresh (): void {
        this.context.container.refreshSingleResultTreeItem(this);
    }

    async run () {
        if (this.context.runnerName === 'pytest') {
            await new PyTestRunner(this).run();
        } else {
            await new GenericRunner(this).run();
        }        
    }

    // get contextValue () {
    //     if (this.singleTestOutput.isFailure) {
    //         return 'atestFailedSingleTest';
    //     } else {
    //         return 'atestPassedSingleTest';
    //     }
    // }

    // get description(): string {
    //     if (this.singleTestOutput.isFailure) {
    //         return 'FAILED'
    //     } else {
    //         return 'Passed'
    //     }
    // }

    // get iconPath() {
    //     if (this.singleTestOutput.isFailure) {
    //         return {
    //             light: path.join(__filename, '..', '..', 'icons', 'failed.svg'),
    //             dark: path.join(__filename, '..', '..', 'icons', 'failed.svg')
    //         }
    //     } else {
    //             return {
    //                 light: path.join(__filename, '..', '..', 'icons', 'passed.svg'),
    //                 dark: path.join(__filename, '..', '..', 'icons', 'passed.svg')
    //             }
    //     }
    // }

    get name (): string {
        return this.label || 'UNNAMED';
    }

    setCodePath (codePath: string[]) {
        this._codePath = codePath;
        if (this._codePath.length === 0) {
            this.label = undefined;
        } else {
            this.label = this._codePath[this._codePath.length - 1]
        }
    }

    get codePath () {
        return this._codePath;
    }

    get isFailedTest() {
        return this.resultType === EResultTreeItemType.Test && this.failureMessage !== undefined;
    }

    get isPassedTest() {
        return this.resultType === EResultTreeItemType.Test && this.failureMessage === undefined;
    }

    get isTest() {
        return this.resultType === EResultTreeItemType.Test;
    }

    _addChild (resultTreeItemToAdd: ResultTreeItem) {
        resultTreeItemToAdd.parent = this;
        this.children.set(resultTreeItemToAdd.name, resultTreeItemToAdd);
        resultTreeItemToAdd._validate();
    }

    _validate () {
        if (this.parent && this.codePath.length === 0) {
            throw new Error('A ResultTreeItem with a parent must have a codePath.');
        }
    }

    _recursiveAddByCodePath(resultTreeItemToAdd: ResultTreeItem, codePathIndex: number) {
        if (!resultTreeItemToAdd.codePath) {
            throw new Error('Should not be possible to get here with an empty codePath!');
        }
        const name = resultTreeItemToAdd.codePath[codePathIndex];
        if (resultTreeItemToAdd.isTest) {
            this.testCount ++;
            // if (resultTreeItemToAdd.resultType === EResultTreeItemType.FailedTest) {
            //     this.failedTestCount ++;
            // }
        }
        if (codePathIndex >= (resultTreeItemToAdd.codePath.length - 1)) {
            this._addChild(resultTreeItemToAdd);
        } else {
            let childToAddTo;
            if (this.children.has(name)) {
                childToAddTo = <ResultTreeItem>this.children.get(name);
            } else {
                const childCodePath = resultTreeItemToAdd.codePath.slice(0, codePathIndex + 1);
                childToAddTo = new ResultTreeItem(this.context, childCodePath, EResultTreeItemType.Generic);
                this._addChild(childToAddTo);
            }
            childToAddTo._recursiveAddByCodePath(resultTreeItemToAdd, codePathIndex + 1);
        }
    }

    add (resultTreeItemToAdd: ResultTreeItem) {
        // TODO: Merge code paths.
        // E.g.: This can be added to something that has a codepath.
        // Require that their codepath prefix match!
        if (!resultTreeItemToAdd.codePath || resultTreeItemToAdd.codePath.length < 1) {
            throw new Error('resultTreeItemToAdd must have a codePath.')
        }
        // this.outputs.push(testOutput);
        this._recursiveAddByCodePath(resultTreeItemToAdd, 0);
    }

    makeResultTreeItem(codePath: string[]) {
        return new ResultTreeItem(this.context, codePath, EResultTreeItemType.Generic);
    }

    optimize(): ResultTreeItem {
        this._isOptimized = true;
        for (let childItem of this.children.values()) {
            const newChildItem = childItem.optimize();

        //     // Handle the case where we the child has merged itself into its only child
        //     if (newChildItem !== childItem) {
        //         this.children.delete(childItem.name);
        //         this._addChild(newChildItem);
        //     }
        }

        this.failedTestCount = 0;
        this.failedChildren = new Map<string, ResultTreeItem>();
        for (let childItem of this.children.values()) {
            this.failedTestCount += childItem.failedTestCount;
            if (childItem.failedTestCount > 0) {
                this.failedChildren.set(childItem.name, childItem);
            }
        }
        if (this.isFailedTest) {
            this.failedTestCount += 1;
        }

        // if (this.children.size === 1) {
        //     // Because of the code in the loop at the top of the method,
        //     // this means that we remove "this" from the tree, and
        //     // replace it with a child.
        //     const firstChild = this.children.values().next().value;
        //     firstChild.parent = this.parent;
        //     return firstChild;
        // }
        return this;
    }

    get flatSelf (): ResultTreeItem {
        if (this.children.size === 1) {
            return this.children.values().next().value.flatSelf;
        }
        return this;
    }

    // get flatChildren () {
    //     const children = [];
    // }

    toPlainObject () {
        function childrenToPlain (children: Map<string, ResultTreeItem>) {
            const out: any = {}
            for (let [key, value] of children) {
                out[key] = value.toPlainObject();
            }
            return out;
        }
        const data: any = {
            codePath: this.codePath.join('::'),
            resultType: this.resultType,
            children: childrenToPlain(this.children),
            testCount: this.testCount,
            status: this.status,
            _isOptimized: this._isOptimized
        };
        if (this._isOptimized) {
            data.failedChildren = childrenToPlain(this.failedChildren);
            data.failedTestCount = this.failedTestCount
        }
        return data
    }

    toJson () {
        return JSON.stringify(this.toPlainObject(), null, 2);
    }
}

export class WorkspaceFolderResultTreeItem extends ResultTreeItem {
    constructor(context: TResultTreeItemContext) {
        super(context, [`${context.workspaceFolder.name}:${context.runnerName}`], EResultTreeItemType.WorkspaceFolder);
    }
}
