// @ts-nocheck 
import * as path from 'path';
import * as vscode from 'vscode';
import { EResultTreeItemType, EResultTreeItemStatus, TRunnerOptions } from './types';
import { RUNNER_REGISTRY } from './runners/RunnerRegistry';

export interface IResultTreeItemContainer {
    refreshSingleResultTreeItem(resultTreeItem: ResultTreeItem): void;
    runWorkspaceFolderResultTreeItem (resultTreeItem: WorkspaceFolderResultTreeItem, runnerOptions?: TRunnerOptions): void;
}

export type TResultTreeItemContext = {
    workspaceFolder: vscode.WorkspaceFolder;
    runnerName: string;
    container: IResultTreeItemContainer;
}

const OUTPUT_LOG_NAME = 'ATest: Test output';
let _output_channel: vscode.OutputChannel|null = null;

function getOutputLogChannel() {
    if (_output_channel) {
        _output_channel.dispose();
    }
    _output_channel = vscode.window.createOutputChannel(OUTPUT_LOG_NAME);
    return _output_channel;
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
    
    // Absolute path to the file that was the target of this test run.
    fileFsUri?: vscode.Uri;

    // Absolute path to the folder that was the target for this test run.
    folderFsUri?: vscode.Uri;
    
    // Line number in ``fileFsPath`` where the test is located.
    line?: number;

    // Run mode. If this is not null, it must be "closestMethod" or "closestClass".
    runMode?: string;

    name: string;
    fullCodePath?: string[];
    fileRelativeCodePath?: string[];

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

    constructor(context: TResultTreeItemContext, name: string, resultType: EResultTreeItemType) {
        super(name);
        // this.label = name;
        this.name = name;
        this.resultType = resultType;
        this.context = context;
        this.testCount = 0;
        this.failedTestCount = 0;
        this._isOptimized = false;
        this._isRunningTests = false;
        this.status = EResultTreeItemStatus.Done;
        this.children = new Map<string, ResultTreeItem>();
        this.failedChildren = new Map<string, ResultTreeItem>();
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

    clearResults () {
        this.failedChildren = new Map<string, ResultTreeItem>();
        this.children = new Map<string, ResultTreeItem>();
        this.status = EResultTreeItemStatus.WaitingToStart;
        this.failureMessage = undefined;
        this.testCount = 0;
        this.failedTestCount = 0;
        this._isOptimized = false;
    }

    setIsRunningTests(isRunningTests: boolean) {
        this.rootItem._isRunningTests = isRunningTests;
    }

    isRunningTests () {
        return this.rootItem._isRunningTests;
    }

    run (outputChannel: vscode.OutputChannel, runnerOptions?: TRunnerOptions): Promise<any> {
        const runnerClass = RUNNER_REGISTRY.getRunnerClass(this.context.runnerName);
        return new runnerClass(this, outputChannel, runnerOptions).run();
    }

    makeReRunnableResultTreeItem (): WorkspaceFolderResultTreeItem {
        const resultTreeItem = new WorkspaceFolderResultTreeItem(this.context);
        resultTreeItem.children = this.children;
        resultTreeItem.failedChildren = this.failedChildren;
        resultTreeItem.fileFsUri = this.fileFsUri;
        resultTreeItem.folderFsUri = this.folderFsUri;
        resultTreeItem.line = this.line;
        resultTreeItem.name = this.name;
        resultTreeItem.fileRelativeCodePath = this.fileRelativeCodePath;
        resultTreeItem.fullCodePath = this.fullCodePath;
        return resultTreeItem;
    }

    reRun () {
        return this.context.container.runWorkspaceFolderResultTreeItem(this.makeReRunnableResultTreeItem());
    }

    reRunFailed () {
        return this.context.container.runWorkspaceFolderResultTreeItem(this.makeReRunnableResultTreeItem(), {
            failedOnly: true
        });
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
            if (this.resultType === EResultTreeItemType.Generic) {
                return 'atestFailedGenericTestSet';
            } else {
                return 'atestFailedTestSet';
            }
        } else {
            if (this.resultType === EResultTreeItemType.Generic) {
                return 'atestPassedGenericTestSet';
            } else {
                return 'atestPassedTestSet';
            }
        }
    }

    get description(): string {
        if (this.isFailedTest) {
            return 'FAILED';
        } else if (this.isPassedTest) {
            return 'Passed';
        } else if (this._isOptimized) {
            if (this.containsFailed) {
                return `${this.failedTestCount} / ${this.testCount} failed`;
            } else {
                return `${this.testCount} / ${this.testCount} passed`;
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

    _buildPathArray (pathArray: string[]) {
        pathArray.unshift(<string>this.name);
        if (this.parent) {
            this.parent._buildPathArray(pathArray);
        }
    }

    get pathArray () {
        const pathArray: string[] = [];
        this._buildPathArray(pathArray);
        return pathArray;
    }

    get dottedPath() {
        return this.pathArray.join('.');
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

    addChild (resultTreeItem: ResultTreeItem) {
        if (!resultTreeItem.name) {
            throw new Error('addChild requires resultTreeItem with name.')
        }
        if (this.children.has(resultTreeItem.name)) {
            throw new Error(`${this.dottedPath} already have a child with this name: "${this.name}".`)
        }
        this.children.set(resultTreeItem.name, resultTreeItem);
        resultTreeItem.parent = this;
    }

    addOrReplaceChild(resultTreeItem: ResultTreeItem): boolean {
        if (!resultTreeItem.name) {
            throw new Error('addOrReplaceChild requires resultTreeItem with name.')
        }
        if (this.children.has(resultTreeItem.name)) {
            this.children.set(resultTreeItem.name, resultTreeItem);
            return true;
        } else {
            this.addChild(resultTreeItem);
            return false;
        }
    }

    addChildRecursiveByPath (parentPathArray: string[], resultTreeItem: ResultTreeItem, skipExisting: boolean = false) {
        if (!resultTreeItem.name) {
            throw new Error('addOrReplace requires resultTreeItem with name.')
        }
        if (parentPathArray.length === 0) {
            this.addOrReplaceChild(resultTreeItem);
        } else {
            const name = parentPathArray[0];
            let child = this.children.get(name);
            if (child) {
                if (!skipExisting) {
                    throw new Error(`${this.dottedPath} already has a ${name} child.`);
                }
            } else {
                child = this.makeResultTreeItem(name);
                this.addChild(child);
            }
            child.addChildRecursiveByPath(parentPathArray.slice(1), resultTreeItem, skipExisting);
        }
    }

    _addChildRecursiveByFilePath (rootDirectory: string, remainingFilePathArray: string[], currentFilePathArray: string[]): ResultTreeItem {
        if (remainingFilePathArray.length === 1) {
            const fileName = remainingFilePathArray[0];
            const name = fileName.split('.')[0];
            if (this.children.has(name)) {
                return <ResultTreeItem>this.children.get(name);
            }
            currentFilePathArray.push(fileName);
            const fileItem = this.makeResultTreeItem(name);
            fileItem.resultType = EResultTreeItemType.File;
            fileItem.fileFsUri = vscode.Uri.file(path.join(rootDirectory, currentFilePathArray.join('/')));
            this.addOrReplaceChild(fileItem);
            return fileItem;
        } else {
            const name = remainingFilePathArray[0];
            currentFilePathArray.push(name);
            let child = this.children.get(name);
            if (!child) {
                child = this.makeResultTreeItem(name);
                child.resultType = EResultTreeItemType.Folder;
                child.folderFsUri = vscode.Uri.file(path.join(rootDirectory, currentFilePathArray.join('/')));
                this.addChild(child);
            }
            return child._addChildRecursiveByFilePath(rootDirectory, remainingFilePathArray.slice(1), currentFilePathArray);
        }
    }

    addChildRecursiveByFilePath (rootDirectory: string, filePath: string): ResultTreeItem {
        const filePathArray = filePath.split('/');
        return this._addChildRecursiveByFilePath(rootDirectory, filePathArray, []);
    }

    getByPathArray (pathArray: string[]): ResultTreeItem|undefined {
        if (pathArray.length === 0) {
            return this;
        }
        else {
            const name = pathArray[0];
            const child = this.children.get(name);
            if (child) {
                return child.getByPathArray(pathArray.slice(1));
            } else {
                return undefined;
            }
        }
    }

    _getClosestExistingParentPathArray (pathArray: string[], resultArray: string[], add: boolean = true) {
        if (pathArray.length === 0) {
            return;
        }
        else {
            if (add) {
                resultArray.push(this.name);
            }
            const name = pathArray[0];
            const child = this.children.get(name);
            if (child) {
                child._getClosestExistingParentPathArray(pathArray.slice(1), resultArray);
            }
        }
    }

    getClosestExistingParentPathArray (pathArray: string[]): string[] {
        const resultArray: string[] = [];
        this._getClosestExistingParentPathArray(pathArray, resultArray, false);
        return resultArray;
    }

    getByDottedPath (dottedPath: string): ResultTreeItem|undefined {
        if (dottedPath === '') {
            return undefined;
        }
        return this.getByPathArray(dottedPath.split('.'));
    }

    getFailedByPathArray (pathArray: string[]): ResultTreeItem|undefined {
        if (pathArray.length === 0) {
            return this;
        }
        else {
            const name = pathArray[0];
            const child = this.failedChildren.get(name);
            if (child) {
                return child.getFailedByPathArray(pathArray.slice(1));
            } else {
                return undefined;
            }
        }
    }

    getFailedByDottedPath (dottedPath: string): ResultTreeItem|undefined {
        if (dottedPath === '') {
            return undefined;
        }
        return this.getFailedByPathArray(dottedPath.split('.'));
    }

    _getAllFailedTestResultItems (failedTests: ResultTreeItem[]) {
        if (this.isFailedTest) {
            failedTests.push(this);
        }
        for (let child of this.children.values()) {
            child._getAllFailedTestResultItems(failedTests);
        }
    }

    getAllFailedTestResultItems (): ResultTreeItem[] {
        const failedTests: ResultTreeItem[] = [];
        this._getAllFailedTestResultItems(failedTests);
        return failedTests;
    }

    makeResultTreeItem(label: string) {
        return new ResultTreeItem(this.context, label, EResultTreeItemType.Generic);
    }

    optimize(): ResultTreeItem {
        this._isOptimized = true;
        this.testCount = 0;
        if (this.isTest) {
            this.testCount = 1;
        }
        for (let childItem of this.children.values()) {
            childItem.optimize();
            this.testCount += childItem.testCount;
        }

        this.failedTestCount = 0;
        this.failedChildren = new Map<string, ResultTreeItem>();
        for (let childItem of this.children.values()) {
            this.failedTestCount += childItem.failedTestCount;
            if (childItem.failedTestCount > 0) {
                this.failedChildren.set(<string>childItem.name, childItem);
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
        return this.label;
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

    get flattenedFailed (): ResultTreeItem {
        if (this.canBeFlattened) {
            const children = this._isOptimized? this.failedChildren : this.children;
            return children.values().next().value.flattened;
        }
        return this;
    }

    get flattenedFailedChildren () {
        const flattenedChildren = [];
        const children = this._isOptimized? this.failedChildren : this.children;
        for (let child of children.values()) {
            flattenedChildren.push(child.flattenedFailed);
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
            label: this.label,
            name: this.name,
            parentDottedPath: this.parent?.dottedPath || 'NONE',
            hasParent: this.parent? true : false,
            dottedPath: this.dottedPath,
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

    get summaryHeading() {
        return `File: ${this.fileFsUri?.fsPath}\nCode path: ${this.dottedPath}`;
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
        this.logTestResult(outputChannel, !this.isTest);
        outputChannel.show(true);
    }

    async show () {
        await this.showTestResults();
        await this.navigateTo();
    }
}

export class WorkspaceFolderResultTreeItem extends ResultTreeItem {
    constructor(context: TResultTreeItemContext) {
        super(context, `${context.workspaceFolder.name}:${context.runnerName}`, EResultTreeItemType.WorkspaceFolder);
        this.folderFsUri = context.workspaceFolder.uri;
    }
}
