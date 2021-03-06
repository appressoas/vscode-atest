import * as assert from 'assert';

import * as vscode from 'vscode';
import XunitOutputHandler from '../../../outputhandlers/XunitOutputHandler';
import { MockResultTreeItem } from '../../mocks';
import { EResultTreeItemType } from '../../../types';

class MockXunitOutputHandlerSingleTestThatFails extends XunitOutputHandler {
	constructor (options?: {[key: string]: any}) {
		super(new MockResultTreeItem(), vscode.window.createOutputChannel('mock'), options);
	}

    get xunitOutputString(): string {
		return `<testsuites>
	<testsuite name="mytestsuite">
		<testcase classname="test_stringutils.TestReplace" file="test_stringutils/test_replace.py" line="10" name="test_will_fail">
			<failure message="The failure message">Failure details</failure>
		</testcase>
	</testsuite>
</testsuites>`;
	}
}

class MockXunitOutputHandlerSingleTestThatPasses extends XunitOutputHandler {
	constructor (options?: {[key: string]: any}) {
		super(new MockResultTreeItem(), vscode.window.createOutputChannel('mock'), options);
	}

    get xunitOutputString(): string {
		return `<testsuites>
	<testsuite name="mytestsuite">
		<testcase classname="test_stringutils.TestReplace" file="test_stringutils/test_replace.py" line="10" name="test_ok"/>
	</testsuite>
</testsuites>`;
	}
}

class MockXunitOutputHandlerAdvanced extends XunitOutputHandler {
	constructor (options?: {[key: string]: any}) {
		super(new MockResultTreeItem(), vscode.window.createOutputChannel('mock'), options);
	}

    get xunitOutputString(): string {
		return `<testsuites>
	<testsuite name="mytestsuite">
		<testcase classname="test_other.TestOther" file="test_stringutils/test_other.py" line="4" name="test_other"/>
		<testcase classname="test_stringutils.test_stuff.TestStuff" file="test_stringutils/test_stuff.py" line="4" name="test_do_stuff"/>
		<testcase classname="test_stringutils.test_replace.TestReplace" file="test_stringutils/test_replace.py" line="7" name="test_strip_whitespace"/>
		<testcase classname="test_stringutils.test_replace.TestReplace" file="test_stringutils/test_replace.py" line="10" name="test_will_fail">
			<failure message="The failure message">Failure details</failure>
		</testcase>
	</testsuite>
</testsuites>`;
	}
}

suite('XunitOutputHandler Test Suite', () => {
	vscode.window.showInformationMessage('Start XunitOutputHandler tests.');

	test('handleProcessDone single passed test', () => {
		const outputHandler = new MockXunitOutputHandlerSingleTestThatPasses();
		return outputHandler.handleProcessDone().then(() => {
			// console.log(outputHandler.result.toPlainObject());
			assert.equal(outputHandler.result.testCount, 1);
			assert.equal(outputHandler.result.failedTestCount, 0);
			assert.equal(
				outputHandler.result.getByDottedPath('test_stringutils')!.resultType, 
				EResultTreeItemType.Generic);
			assert.equal(
				outputHandler.result.getByDottedPath('test_stringutils.TestReplace')!.resultType, 
				EResultTreeItemType.TestCase);
			assert(outputHandler.result.getByDottedPath('test_stringutils.TestReplace')!.fileFsUri!.fsPath.endsWith('test_stringutils/test_replace.py'))
			assert.equal(
				outputHandler.result.getByDottedPath('test_stringutils.TestReplace.test_ok')!.resultType, 
				EResultTreeItemType.Test);
				assert(outputHandler.result.getByDottedPath('test_stringutils.TestReplace.test_ok')!.fileFsUri!.fsPath.endsWith('test_stringutils/test_replace.py'))
			assert.equal(
				outputHandler.result.getByDottedPath('test_stringutils.TestReplace.test_ok')!.line, 
				10);
		});
	});

	test('handleProcessDone single failed test', () => {
		const outputHandler = new MockXunitOutputHandlerSingleTestThatFails();
		return outputHandler.handleProcessDone().then(() => {
			// console.log(outputHandler.result.toPlainObject());

			// Make sure the stuff not relating to failed is OK
			assert.equal(outputHandler.result.testCount, 1);
			assert.equal(
				outputHandler.result.getByDottedPath('test_stringutils')!.resultType, 
				EResultTreeItemType.Generic);
			assert.equal(
				outputHandler.result.getByDottedPath('test_stringutils.TestReplace')!.resultType, 
				EResultTreeItemType.TestCase);
			assert(outputHandler.result.getByDottedPath('test_stringutils.TestReplace')!.fileFsUri!.fsPath.endsWith('test_stringutils/test_replace.py'))
			assert.equal(
				outputHandler.result.getByDottedPath('test_stringutils.TestReplace.test_will_fail')!.resultType, 
				EResultTreeItemType.Test);
				assert(outputHandler.result.getByDottedPath('test_stringutils.TestReplace.test_will_fail')!.fileFsUri!.fsPath.endsWith('test_stringutils/test_replace.py'))
			assert.equal(
				outputHandler.result.getByDottedPath('test_stringutils.TestReplace.test_will_fail')!.line, 
				10);

			assert.equal(outputHandler.result.failedTestCount, 1);
			assert.equal(
				outputHandler.result.getFailedByDottedPath('test_stringutils')!.resultType, 
				EResultTreeItemType.Generic);
			assert.equal(
				outputHandler.result.getFailedByDottedPath('test_stringutils.TestReplace')!.resultType, 
				EResultTreeItemType.TestCase);
			assert(outputHandler.result.getFailedByDottedPath('test_stringutils.TestReplace')!.fileFsUri!.fsPath.endsWith('test_stringutils/test_replace.py'))
			assert.equal(
				outputHandler.result.getFailedByDottedPath('test_stringutils.TestReplace.test_will_fail')!.resultType, 
				EResultTreeItemType.Test);
				assert(outputHandler.result.getFailedByDottedPath('test_stringutils.TestReplace.test_will_fail')!.fileFsUri!.fsPath.endsWith('test_stringutils/test_replace.py'))
			assert.equal(
				outputHandler.result.getFailedByDottedPath('test_stringutils.TestReplace.test_will_fail')!.line, 
				10);
			assert.equal(
				outputHandler.result.getFailedByDottedPath('test_stringutils.TestReplace.test_will_fail')!.failureMessage, 
				'The failure message\n\nFailure details');
		});
	});

	test('handleProcessDone advanced', () => {
		const outputHandler = new MockXunitOutputHandlerAdvanced();
		return outputHandler.handleProcessDone().then(() => {
			// We only do rough checks here - details in the tests above
			assert.equal(outputHandler.result.testCount, 4);
			assert.equal(outputHandler.result.failedTestCount, 1);
			assert(outputHandler.result.getByDottedPath('test_other.TestOther'));
			assert(outputHandler.result.getByDottedPath('test_stringutils.test_stuff.TestStuff'));
			assert(outputHandler.result.getByDottedPath('test_stringutils.test_replace.TestReplace'));
			assert(outputHandler.result.getByDottedPath('test_other.TestOther.test_other'));
			assert(outputHandler.result.getByDottedPath('test_stringutils.test_stuff.TestStuff.test_do_stuff'));
			assert(outputHandler.result.getByDottedPath('test_stringutils.test_replace.TestReplace.test_strip_whitespace'));
			assert(outputHandler.result.getByDottedPath('test_stringutils.test_replace.TestReplace.test_will_fail'));

			assert.equal(
				outputHandler.result.getByDottedPath('test_other.TestOther')!.resultType,
				EResultTreeItemType.TestCase);
			assert.equal(
				outputHandler.result.getByDottedPath('test_stringutils.test_stuff.TestStuff')!.resultType,
				EResultTreeItemType.TestCase);
			assert.equal(
				outputHandler.result.getByDottedPath('test_stringutils.test_replace.TestReplace')!.resultType,
				EResultTreeItemType.TestCase);
			assert.equal(
				outputHandler.result.getByDottedPath('test_other.TestOther.test_other')!.resultType,
				EResultTreeItemType.Test);
			assert.equal(
				outputHandler.result.getByDottedPath('test_stringutils.test_stuff.TestStuff.test_do_stuff')!.resultType,
				EResultTreeItemType.Test);
			assert.equal(
				outputHandler.result.getByDottedPath('test_stringutils.test_replace.TestReplace.test_strip_whitespace')!.resultType,
				EResultTreeItemType.Test);
			assert.equal(outputHandler.result.getByDottedPath('test_stringutils.test_replace.TestReplace.test_will_fail')!.resultType,
				EResultTreeItemType.Test);
	
			assert(!outputHandler.result.getFailedByDottedPath('test_stringutils.test_replace.TestReplace.test_strip_whitespace'));
			assert(outputHandler.result.getFailedByDottedPath('test_stringutils.test_replace.TestReplace.test_will_fail'));
			});
	});

	test('handleProcessDone testCaseHasFileAttribute=true', () => {
		const outputHandler = new MockXunitOutputHandlerSingleTestThatPasses({
			testCaseHasFileAttribute: true
		});
		return outputHandler.handleProcessDone().then(() => {
			// console.log(outputHandler.result.toPlainObject());
			assert.equal(outputHandler.result.testCount, 1);
			assert.equal(outputHandler.result.failedTestCount, 0);
			assert.equal(
				outputHandler.result.getByDottedPath('test_stringutils')!.resultType,
				EResultTreeItemType.Folder);
			assert.equal(
				outputHandler.result.getByDottedPath('test_stringutils.test_replace')!.resultType,
				EResultTreeItemType.File);
			assert(outputHandler.result.getByDottedPath('test_stringutils.test_replace.TestReplace')!.fileFsUri!.fsPath.endsWith('test_stringutils/test_replace.py'))
			assert.equal(
				outputHandler.result.getByDottedPath('test_stringutils.test_replace.TestReplace')!.resultType, 
				EResultTreeItemType.TestCase);
			assert(outputHandler.result.getByDottedPath('test_stringutils.test_replace.TestReplace')!.fileFsUri!.fsPath.endsWith('test_stringutils/test_replace.py'))
			assert.equal(
				outputHandler.result.getByDottedPath('test_stringutils.test_replace.TestReplace.test_ok')!.resultType, 
				EResultTreeItemType.Test);
				assert(outputHandler.result.getByDottedPath('test_stringutils.test_replace.TestReplace.test_ok')!.fileFsUri!.fsPath.endsWith('test_stringutils/test_replace.py'))
			assert.equal(
				outputHandler.result.getByDottedPath('test_stringutils.test_replace.TestReplace.test_ok')!.line, 
				10);
		});
	});
});
