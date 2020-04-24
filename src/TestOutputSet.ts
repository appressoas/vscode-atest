import * as vscode from 'vscode';

export type TSingleTestOutput = {
    codePath: Array<string>,

    // Absolute filestystem path
    fsPath: string,

    line: number,
    failureMessage: string|null
}

const OUTPUT_LOG_NAME = 'ATest: Test output';

function getOutputLogChannel() {
    return vscode.window.createOutputChannel(OUTPUT_LOG_NAME);
}

export class SingleTestOutput {
    constructor (public output: TSingleTestOutput) {

    }

    get name () {
        return this.output.codePath[this.output.codePath.length - 1];
    }

    toPlainObject() {
        return {
            ...this.output,
            name: this.name,
            isFailure: this.isFailure
        }
    }

    get isFailure () {
        return this.output.failureMessage !== null
    }

    get isSuccessful () {
        return !this.isFailure
    }

    get uri () {
        return vscode.Uri.file(this.output.fsPath);
    }

    async navigateTo () {
        const document = await vscode.workspace.openTextDocument(this.uri);
        await vscode.window.showTextDocument(document, {
            selection: new vscode.Range(this.output.line, 0, this.output.line, 0)
        });
    }

    get testResultMessage(): string {
        if (this.isFailure) {
            if (this.output.failureMessage) {
                return this.output.failureMessage;
            } else {
                return 'No failure message';
            }
        } else {
            return 'Successful!';
        }
    }

    get dottedCodePath() {
        return this.output.codePath.join('.');
    }

    get summaryHeading() {
        return `File: ${this.output.fsPath}\nCode path: ${this.dottedCodePath}`;
    }

    get compactTestSummary(): string {
        return `${this.summaryHeading}\n\n${this.testResultMessage}\n`
    }

    get verboseTestSummary(): string {
        return `\n${'='.repeat(70)}\n${this.summaryHeading}\n\n${this.testResultMessage}\n\n\n`
    }

    logTestResult (outputChannel: vscode.OutputChannel, verbose: boolean = false) {
        if (verbose) {
            outputChannel.append(`${this.verboseTestSummary}`);
        } else {
            outputChannel.append(`${this.compactTestSummary}`);
        }
    }

    async show () {
        const outputChannel = getOutputLogChannel();
        outputChannel.clear();
        outputChannel.show();
        this.logTestResult(outputChannel);
        await this.navigateTo();
    }
}

export class TestOutputSet {
    outputs: Array<SingleTestOutput>;
    failedOutputs: Array<SingleTestOutput>;
    subsets: Map<string, TestOutputSet>;
    failedSubsets: Map<string, TestOutputSet>;
    testCount: number;
    failedTestCount: number;

    constructor (public name: string|null = null) {
        this.outputs = new Array<SingleTestOutput>();
        this.failedOutputs = new Array<SingleTestOutput>();
        this.subsets = new Map<string, TestOutputSet>();
        this.failedSubsets = new Map<string, TestOutputSet>();
        this.testCount = 0;
        this.failedTestCount = 0;
    }

    _add(codePath: Array<string>, testOutput: SingleTestOutput) {
        if (codePath.length === 0) {
            throw new Error('Should not be possible to get here with an empty codePath!');
        }
        this.testCount ++;
        if (testOutput.isFailure) {
            this.failedTestCount ++;
        }
        if (codePath.length === 1) {
            this.outputs.push(testOutput);
            if (testOutput.isFailure) {
                this.failedOutputs.push(testOutput);
            }
        } else {
            const firstCodePath = codePath.shift();
            if (!firstCodePath) {
                return;
            }
            if (!this.subsets.has(firstCodePath)) {
                this.subsets.set(firstCodePath, new TestOutputSet(firstCodePath));
            }
            this.subsets.get(firstCodePath)?._add([...codePath], testOutput);

            if (testOutput.isFailure) {
                if (!this.failedSubsets.has(firstCodePath)) {
                    this.failedSubsets.set(firstCodePath, new TestOutputSet(firstCodePath));
                }
                this.failedSubsets.get(firstCodePath)?._add([...codePath], testOutput);
            }
        }
    }

    add (testOutput: SingleTestOutput) {
        // this.outputs.push(testOutput);
        this._add([...testOutput.output.codePath], testOutput);
    }

    get isLeaf () {
        return this.outputs.length > 0
    }

    get containsFailed () {
        return this.failedTestCount > 0;
    }

    _outputsToPlainArray (outputs: Array<SingleTestOutput>) {
        const plainArray = [];
        for (let output of outputs) {
            plainArray.push(output.toPlainObject());
        }
        return plainArray;
    }

    _subsetsToPlainObject (subsets: Map<string, TestOutputSet>) {
        const plainObject: {[key: string]: any} = {};
        for (let [key, subset] of subsets.entries()) {
            plainObject[key] = subset.toPlainObject();
        }
        
        return plainObject;
    }

    toPlainObject(): any {
        const plainObject: {[key: string]: any} = {};

        // Include the testCount
        if (plainObject.testCount) {
            // Even if this is just for debugging, we still do not want to overwrite
            // the testCount key if there is a subset with that name!
            plainObject.__aTestTestCount = this.testCount;
        } else {
            plainObject.testCount = this.testCount;
        }
        if (plainObject.failedTestCount) {
            // Even if this is just for debugging, we still do not want to overwrite
            // the failedTestCount key if there is a subset with that name!
            plainObject.__aTestFailedTestCount = this.failedTestCount;
        } else {
            plainObject.failedTestCount = this.failedTestCount;
        }

        if (this.isLeaf) {
            plainObject.outputs = this._outputsToPlainArray(this.outputs);
            plainObject.failedOutputs = this._outputsToPlainArray(this.failedOutputs);
        } else {
            plainObject.subsets = this._subsetsToPlainObject(this.subsets);
            plainObject.failedSubsets = this._subsetsToPlainObject(this.failedSubsets);
        }
        return plainObject;
    }

    toJson() {
        return JSON.stringify(this.toPlainObject(), null, 2);
    }

    _logFailures (outputChannel: vscode.OutputChannel) {
        for (let subset of this.failedSubsets.values()) {
            subset._logFailures(outputChannel);
        }
        for (let output of this.failedOutputs) {
            output.logTestResult(outputChannel, true);
        }
    }

    async logFailures () {
        const outputChannel = getOutputLogChannel();
        outputChannel.clear();
        outputChannel.show();
        this._logFailures(outputChannel);
    }
}
