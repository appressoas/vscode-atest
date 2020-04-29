import * as vscode from 'vscode';
import * as fs from 'fs';
import AbstractOutputHandler from "./AbstractOutputHandler";
// @ts-ignore
import * as xml2js from 'xml2js';
import { EResultTreeItemType } from '../types';
import { ResultTreeItem } from '../ResultTreeItem';

export type TXunitOutputHandlerOptions = {
    // Does the <testcase> have a file attribute with the
    // path to the test file which can be used to re-run the test?
    // E.g.: src/my/module/mytests.js.
    testCaseHasFileAttribute?: boolean;

    // Is the <testsuite> name attribute the file path?
    // E.g.: The path to the file which can be used to
    // re-run the test? E.g: src/mymodule/mytests.js.
    testSuiteNameIsFilePath?: boolean;
};

export default class XunitOutputHandler extends AbstractOutputHandler {

    get xunitOutputString(): string {
        return fs.readFileSync(this.workspaceFolderHelper.getTempDirectoryFilePath('tests.xml')).toString()
    }

    joinFailureElements (failureElements: Array<any>) {
        let output = [];
        for (let failureElement of failureElements) {
            output.push(`${failureElement.$.message}\n\n${failureElement._}`);
        }
        return output.join('\n\n#####################################\n\n')
    }

    addOrGetaddTestCaseClassElement (testCaseClassPath: string[], testCaseElement: any): ResultTreeItem {
        const attributes = testCaseElement.$;
        let parentPathArray = undefined;
        if (this.options.testCaseHasFileAttribute) {
            const fileRelativePath = attributes.file;
            if (fileRelativePath) {
                const fileResultItem = this.result.addChildRecursiveByFilePath(
                    this.workspaceFolderHelper.workspaceFolder.uri.fsPath,
                    fileRelativePath);
                parentPathArray = fileResultItem.pathArray.slice(1);
            } else {
                console.warn(`testcase xunit element does not have a file attribute.`);
            }
        }

        let resultItem = this.result.getByPathArray(testCaseClassPath);
        if (!resultItem) {
            const className = testCaseClassPath[testCaseClassPath.length - 1];
            resultItem = this.result.makeResultTreeItem(className);
            resultItem.resultType = EResultTreeItemType.TestCase;
            resultItem.fileFsUri = this.workspaceFolderHelper.absoluteFsUri(attributes.file);
            resultItem.fileRelativeCodePath = [className];
            if (!parentPathArray) {
                parentPathArray = testCaseClassPath.slice(0, testCaseClassPath.length - 1);
            }
            this.result.addChildRecursiveByPath(parentPathArray, resultItem, true);
        }
        return resultItem;
    } 

    addTestCaseElement (testCaseElement: any) {
        const attributes = testCaseElement.$
        if (!attributes.classname) {
            throw new Error(`Invalid xUnit: <testcase> element ${JSON.stringify(testCaseElement)} does not have a "classname" attribute.`)
        }
        if (!attributes.name) {
            throw new Error(`Invalid xUnit: <testcase> element ${JSON.stringify(testCaseElement)} does not have a "name" attribute.`)
        }
        if (!attributes.file) {
            throw new Error(`Invalid xUnit: <testcase> element ${JSON.stringify(testCaseElement)} does not have a "file" attribute.`)
        }
        if (!attributes.line) {
            throw new Error(`Invalid xUnit: <testcase> element ${JSON.stringify(testCaseElement)} does not have a "line" attribute.`)
        }

        const testCaseClassPath = attributes.classname.split('.');
        const testCaseClassResultItem = this.addOrGetaddTestCaseClassElement(testCaseClassPath, testCaseElement);
        const testName = attributes.name;

        let failureMessage = undefined;
        if (testCaseElement.failure && testCaseElement.failure.length > 0) {
            failureMessage = this.joinFailureElements(testCaseElement.failure)
        }

        const resultItem = this.result.makeResultTreeItem(testName);
        resultItem.resultType = EResultTreeItemType.Test;
        resultItem.fileFsUri = this.workspaceFolderHelper.absoluteFsUri(attributes.file);
        resultItem.line = parseInt(attributes.line, 10);
        resultItem.failureMessage = failureMessage;
        resultItem.fullCodePath = [...testCaseClassPath, testName];
        resultItem.fileRelativeCodePath = [testCaseClassResultItem.label, testName];
        testCaseClassResultItem.addChild(resultItem);
    }

    addTestSuiteElement (testsuiteElement: any) {
        const testcaseElements = testsuiteElement.testcase || [];
        // const testSuiteName = testsuiteElement.$?.name;
        for (let testCaseElement of testcaseElements) {
            this.addTestCaseElement(testCaseElement);
        }
    }

    addTestSuitesElement (testsuitesElement: any) {
        const testsuiteElements = testsuitesElement.testsuite || [];
        for (let testsuiteElement of testsuiteElements) {
            this.addTestSuiteElement(testsuiteElement);
        }
    }

    async handleProcessDone (failed: boolean = false) {
        return xml2js.parseStringPromise(this.xunitOutputString).then((result: any) => {
            if (result.testsuites) {
                this.addTestSuitesElement(result.testsuites);
            } else if (result.testsuite) {
                this.addTestSuiteElement(result.testsuite);
            } else {
                throw new Error('Invalid xUnit output. No <testsuites> or <testsuite> at the root of the XML document.');
            }
            this.result.optimize();
            this.result.refresh();
        });
    }
}
