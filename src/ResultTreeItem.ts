import * as path from 'path';
import * as vscode from 'vscode';
import { EResultTreeItemType, EResultTreeItemStatus } from './types';
import PyTestRunner from './runners/PyTestRunner';
import GenericRunner from './runners/GenericRunner';
import WorkspaceFolderHelper from './WorkspaceFolderHelper';
import { RUNNER_REGISTRY } from './runners/RunnerRegistry';

export interface IResultTreeItemContainer {
    refreshSingleResultTreeItem(resultTreeItem: ResultTreeItem): void;
}

export type TResultTreeItemContext = {
    workspaceFolder: vscode.WorkspaceFolder;
    runnerName: string;
    container: IResultTreeItemContainer;
}

const OUTPUT_LOG_NAME = 'ATest: Test output';

function getOutputLogChannel() {
    return vscode.window.createOutputChannel(OUTPUT_LOG_NAME);
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
    _codePath: Array<string>;
    
    // Absolute path to the file that was the target of this test run.
    fileFsUri?: vscode.Uri;

    // Absolute path to the folder that was the target for this test run.
    folderFsUri?: vscode.Uri;
    
    // Line number in ``fileFsPath`` where the test is located.
    line?: number;

    // The name of the test suite. Used when re-running tests,
    // and the format is highly language and test-runner dependent.
    // Typically the code path to the test suite class/module.
    testSuitePath?: string[];

    // The name of the test case. Used when re-running tests,
    // and the format is highly language and test-runner dependent.
    // Typically the code path to the test case class, or the relative code
    // path from the ``testSuitePath``.
    testCasePath?: string[];

    // The path of the test. Used when re-running tests,
    // and the format is highly language and test-runner dependent.
    // Typically the code path to the test case function/method, or the relative code
    // path from the ``testCasePath``.
    testPath?: string[];

    // Failure message (if the test failed). Only used if resultType is EResultTreeItemType.Test.
    // If this is set (not undefined), it means that the test failed.
    failureMessage?: string;

    // Number of tests within this item (recursively)
    testCount: number;

    // Number of failed tests within this item (recursively).
    // Updated by the optimize() method, so only awailable after all
    // tests are run.
    failedTestCount: number;

    _isOptimized: boolean;

    _isRunningTests: boolean;

    constructor(context: TResultTreeItemContext, codePath: string[], resultType: EResultTreeItemType) {
        super('x');  // NOTE: setCodePath sets the label, so it will not be 'x'
        this._codePath = [];  // Just to get typescript to shut up - we set it right below!
        this.resultType = resultType;
        this.context = context;
        this.testCount = 0;
        this.failedTestCount = 0;
        this._isOptimized = false;
        this._isRunningTests = false;
        this.status = EResultTreeItemStatus.Done;
        this.children = new Map<string, ResultTreeItem>();
        this.failedChildren = new Map<string, ResultTreeItem>();
        this.setCodePath(codePath);
        this._setCollapsibleState();
    }

    refresh (): void {
        this.context.container.refreshSingleResultTreeItem(this);
    }

    get rootItem(): ResultTreeItem {
        if (this.parent) {
            return this.parent.rootItem;
        }
        return this;
    }

    setIsRunningTests(isRunningTests: boolean) {
        this.rootItem._isRunningTests = isRunningTests;
    }

    isRunningTests () {
        return this.rootItem._isRunningTests;
    }

    run (): Promise<any> {
        const runnerClass = RUNNER_REGISTRY.getRunnerClass(this.context.runnerName);
        return new runnerClass(this).run();
    }

    get containsFailed () {
        if (this._isOptimized && this.failedTestCount > 0) {
            return true;
        }
        return false;
    }

    get contextValue () {
        if (this.isFailedTest) {
            return 'atestFailedSingleTest';
        } else if (this.isPassedTest) {
            return 'atestPassedSingleTest';
        } else if (this.containsFailed) {
            return 'atestFailedTestSet';
        } else {
            return 'atestPassedTestSet';
        }
    }

    get description(): string {
        if (this.isFailedTest) {
            return 'FAILED';
        } else if (this.isPassedTest) {
            return 'Passed';
        } else if (this._isOptimized) {
            if (this.containsFailed) {
                return `${this.failedTestCount} / ${this.testCount} failed`
            } else {
                return 'Passed';
            }
        }
        return '';
    }

    get iconPath() {
        if (this.isFailedTest || this._isOptimized && this.containsFailed) {
            return {
                light: path.join(__filename, '..', '..', 'icons', 'failed.svg'),
                dark: path.join(__filename, '..', '..', 'icons', 'failed.svg')
            }
        } else if (this.isPassedTest || this._isOptimized && !this.containsFailed) {
            return {
                light: path.join(__filename, '..', '..', 'icons', 'passed.svg'),
                dark: path.join(__filename, '..', '..', 'icons', 'passed.svg')
            }
        }
    }

    private _setCollapsibleState () {
        if (this.isTest) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        } else if (this.failedTestCount > 0 || !this._isOptimized || this.resultType === EResultTreeItemType.WorkspaceFolder) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        } else {
            this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        }
    }

    get name (): string {
        return this.label || 'UNNAMED';
    }

    setCodePath (codePath: string[]) {
        this._codePath = codePath;
        if (this._codePath.length === 0) {
            this.label = undefined;
            if (this.resultType === EResultTreeItemType.WorkspaceFolder) {
                this.label = `${this.context.workspaceFolder.name}:${this.context.runnerName}`;
            }
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

    mergeFrom(resultTreeItem: ResultTreeItem) {
        this.children = resultTreeItem.children;
        this.failedChildren = resultTreeItem.failedChildren;
        this.resultType = resultTreeItem.resultType;
        this.status = resultTreeItem.status;
        this._codePath = resultTreeItem._codePath;
        this.fileFsUri = resultTreeItem.fileFsUri;
        this.folderFsUri = resultTreeItem.folderFsUri;
        this.line = resultTreeItem.line;
        this.testSuitePath = resultTreeItem.testSuitePath;
        this.testCasePath = resultTreeItem.testCasePath;
        this.testPath = resultTreeItem.testPath;
        this.failureMessage = resultTreeItem.failureMessage;
        this.testCount = resultTreeItem.testCount;
        this.failedTestCount = resultTreeItem.failedTestCount;
        this.label = resultTreeItem.label;
        this._isOptimized = resultTreeItem._isOptimized;
        this._validate();
    }

    _addChild (resultTreeItemToAdd: ResultTreeItem) {
        const existingChild: ResultTreeItem|undefined = this.children.get(resultTreeItemToAdd.name);
        if (existingChild) {
            existingChild.mergeFrom(resultTreeItemToAdd);
        } else {
            resultTreeItemToAdd.parent = this;
            this.children.set(resultTreeItemToAdd.name, resultTreeItemToAdd);
            resultTreeItemToAdd._validate();
        }
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

    findCommonCodePath(otherResultTreeItem: ResultTreeItem): string[] {
        const commonCodePath: string[] = [];
        let index = 0;
        for(let myCodePathItem of this.codePath) {
            if (otherResultTreeItem.codePath.length >= index + 1) {
                let otherCodePathItem = otherResultTreeItem.codePath[index];
                if (myCodePathItem === otherCodePathItem) {
                    commonCodePath.push(myCodePathItem);
                } else {
                    break;
                }
            } else {
                break;
            }
            index ++;
        }
        return commonCodePath;
    }

    add(resultTreeItemToAdd: ResultTreeItem) {
        // TODO: Merge code paths.
        // E.g.: This can be added to something that has a codepath.
        // Require that their codepath prefix match!
        if (!resultTreeItemToAdd.codePath || resultTreeItemToAdd.codePath.length < 1) {
            throw new Error('resultTreeItemToAdd must have a codePath.')
        }
        const commonCodePath = this.findCommonCodePath(resultTreeItemToAdd);
        console.log(`add ${resultTreeItemToAdd.dottedCodePath} to ${this.dottedCodePath} (${commonCodePath.join('.')})`);
        console.log(`${commonCodePath.length} --- ${resultTreeItemToAdd.codePath.length}`)
        if (commonCodePath.length === resultTreeItemToAdd.codePath.length) {
            this.mergeFrom(resultTreeItemToAdd);
            return;
        }

        let codePathIndex = 0;
        if (commonCodePath.length > 0) {
            codePathIndex = commonCodePath.length - 1;
        }
        this._recursiveAddByCodePath(resultTreeItemToAdd, codePathIndex);
    }

    makeResultTreeItem(codePath: string[]) {
        return new ResultTreeItem(this.context, codePath, EResultTreeItemType.Generic);
    }

    optimize(): ResultTreeItem {
        this._isOptimized = true;
        for (let childItem of this.children.values()) {
            childItem.optimize();
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

        this._setCollapsibleState();
        this.label = this.flattenedLabel;
        return this;
    }

    get flattenedLabel () {
        let parent = this.parent;
        if (parent && parent.canBeFlattened) {
            const labelList = [this.name];
            while (parent && parent.canBeFlattened) {
                labelList.unshift(parent.name);
                parent = parent.parent;
            }
            return labelList.join('.');
        }
        return this.name;
    }

    get canBeFlattened () {
        return this._isOptimized && this.resultType !== EResultTreeItemType.WorkspaceFolder &&  this.children.size === 1;
    }

    get flattened (): ResultTreeItem {
        if (this.canBeFlattened) {
            return this.children.values().next().value.flattened;
        }
        return this;
    }

    get flattenedChildren () {
        const flattenedChildren = [];
        for (let child of this.children.values()) {
            flattenedChildren.push(child.flattened);
        }
        return flattenedChildren;
    }

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
        if (this.isTest) {
            data.isFailedTest = this.isFailedTest;
        }
        if (this._isOptimized) {
            data.failedChildren = childrenToPlain(this.failedChildren);
            data.failedTestCount = this.failedTestCount
        }
        return data
    }

    toJson () {
        return JSON.stringify(this.toPlainObject(), null, 2);
    }

    async navigateTo () {
        if (this.fileFsUri) {
            const document = await vscode.workspace.openTextDocument(this.fileFsUri);
            await vscode.window.showTextDocument(document, {
                selection: new vscode.Range(this.line || 0, 0, this.line || 0, 0)
            });
        } else {
            throw new Error('Can not use navigateTo() on ResultTreeItem without a fileFsUri.')
        }
    }

    get testResultMessage(): string {
        if (this.isFailedTest) {
            if (this.failureMessage) {
                return this.failureMessage;
            } else {
                return 'No failure message';
            }
        } else if (this.isPassedTest) {
            return 'Passed!';
        }
        return '';
    }

    get dottedCodePath() {
        return this.codePath.join('.');
    }

    get summaryHeading() {
        return `File: ${this.fileFsUri?.fsPath}\nCode path: ${this.dottedCodePath}`;
    }

    get compactTestSummary(): string {
        return `${this.summaryHeading}\n\n${this.testResultMessage}\n`
    }

    get verboseTestSummary(): string {
        return `\n${'='.repeat(70)}\n${this.summaryHeading}\n\n${this.testResultMessage}\n\n\n`
    }

    logTestResult (outputChannel: vscode.OutputChannel, verbose=false) {
        if (this.isTest) {
            if (verbose) {
                outputChannel.append(`${this.verboseTestSummary}`);
            } else {
                outputChannel.append(`${this.compactTestSummary}`);
            }
        } else {
            for (let child of this.children.values()) {
                if (child.failedTestCount > 0) {
                    child.logTestResult(outputChannel, verbose);
                }
            }
        }
    }

    async showTestResults () {
        const outputChannel = getOutputLogChannel();
        outputChannel.clear();
        outputChannel.show();
        this.logTestResult(outputChannel, !this.isTest);
    }

    async show () {
        await this.showTestResults();
        await this.navigateTo();
    }
}

export class WorkspaceFolderResultTreeItem extends ResultTreeItem {
    constructor(context: TResultTreeItemContext) {
        super(context, [], EResultTreeItemType.WorkspaceFolder);
    }
}
