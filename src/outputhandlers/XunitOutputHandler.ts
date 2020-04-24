import * as fs from 'fs';
import AbstractOutputHandler from "./AbstractOutputHandler";
import {SingleTestOutput} from "../TestOutputSet";
// @ts-ignore
import * as xml2js from 'xml2js';

export default class XunitOutputHandler extends AbstractOutputHandler {

    get xunitOutputString(): string {
        return fs.readFileSync(this.workspaceFolderHelper.getTempDirectoryFilePath('tests.xml')).toString()
    }

    joinFailureElements (failureElements: Array<any>) {
        let output = [];
        for (let failureElement of failureElements) {
            output.push(failureElement._);
        }
        return output.join('\n\n#####################################\n\n')
    }

    addTestCaseElement (testSuiteName: string|undefined, testcaseElement: any) {
        const attributes = testcaseElement.$
        if (!attributes.classname) {
            throw new Error(`Invalid xUnit: <testcase> element ${JSON.stringify(testcaseElement)} does not have a "classname" attribute.`)
        }
        if (!attributes.name) {
            throw new Error(`Invalid xUnit: <testcase> element ${JSON.stringify(testcaseElement)} does not have a "name" attribute.`)
        }
        if (!attributes.file) {
            throw new Error(`Invalid xUnit: <testcase> element ${JSON.stringify(testcaseElement)} does not have a "file" attribute.`)
        }
        if (!attributes.line) {
            throw new Error(`Invalid xUnit: <testcase> element ${JSON.stringify(testcaseElement)} does not have a "line" attribute.`)
        }

        let codePath = attributes.classname.split('.');
        codePath.push(attributes.name);

        let failureMessage = undefined
        if (testcaseElement.failure && testcaseElement.failure.length > 0) {
            failureMessage = this.joinFailureElements(testcaseElement.failure)
        }

        this.testOutputSet.add(new SingleTestOutput({
            codePath: codePath,
            fileFsPath: this.workspaceFolderHelper.absoluteFsPath(attributes.file),
            relativeFsPath: attributes.file,
            line: parseInt(attributes.line, 10),
            failureMessage: failureMessage,
            testSuiteName: testSuiteName,
            testCaseName: attributes.classname,
            testName: attributes.name
        }));
    }

    addTestSuiteElement (testsuiteElement: any) {
        const testcaseElements = testsuiteElement.testcase || [];
        const testSuiteName = testsuiteElement.$?.name;
        for (let testcaseElement of testcaseElements) {
            this.addTestCaseElement(testSuiteName, testcaseElement);
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
            // console.log(this.testOutputSet.toPlainObject());
            // console.log('DONE. Result: ', this.testOutputSet.toJson());
            // this.outputChannel.append(`DONE. Result:\n${this.testOutputSet.toJson()}`);
            this.testResultsProvider.refresh();
        });
    }
}
