import * as assert from 'assert';

import * as vscode from 'vscode';
import XunitOutputHandler from '../../../outputhandlers/XunitOutputHandler';
import { MockResultTreeItem } from '../../mocks';
import { ResultTreeItem } from '../../../ResultTreeItem';

class MockXunitOutputHandlerFull extends XunitOutputHandler {
	constructor () {
		super(new MockResultTreeItem(), vscode.window.createOutputChannel('mock'));
	}

    get xunitOutputString(): string {
		return `<testsuites>
	<testsuite errors="0" failures="1" hostname="test.local" name="pytest" skipped="0" tests="3" time="0.095" timestamp="2020-04-23T20:18:42.259401">
		<testcase classname="test_stringutils.test_stuff.TestReplace" file="test_stringutils/test_stuff.py" line="4" name="test_do_stuff" time="0.001"/>
		<testcase classname="test_stringutils.test_replace.TestReplace" file="test_stringutils/test_replace.py" line="7" name="test_strip_whitespace" time="0.001"/>
		<testcase classname="test_stringutils.test_replace.TestReplace" file="test_stringutils/test_replace.py" line="10" name="test_will_fail" time="0.001">
			<failure message="AssertionError: 'Hello World!' != 'Hello' - Hello World! + Hello">self = &lt;test_stringutils.test_replace.TestReplace testMethod=test_will_fail&gt;
	
		def test_will_fail(self):
	&gt;       self.assertEqual(stringutils.Replace('Hello World').replace('World', 'World!'), 'Hello')
	E       AssertionError: 'Hello World!' != 'Hello'
	E       - Hello World!
	E       + Hello
	
	python_demo/tests/test_stringutils/test_replace.py:12: AssertionError</failure>
		</testcase>
	</testsuite>
</testsuites>`;
	}
}

suite('XunitOutputHandler Test Suite', () => {
	vscode.window.showInformationMessage('Start XunitOutputHandler tests.');

	test('handleProcessDone', () => {
		const outputHandler = new MockXunitOutputHandlerFull();
		return outputHandler.handleProcessDone().then(() => {
			assert.equal(outputHandler.result.testCount, 3);
			assert.equal(outputHandler.result.failedTestCount, 1);
		});
	});

	test('handleProcessDone failure mapped correctly', () => {
		const outputHandler = new MockXunitOutputHandlerFull();
		return outputHandler.handleProcessDone().then(() => {
			assert(outputHandler.result.failedChildren.has('test_stringutils'))
			assert(!outputHandler.result.failedChildren.get('test_stringutils')!.failedChildren.has('test_stuff'))
			assert(outputHandler.result.failedChildren.get('test_stringutils')!.failedChildren.has('test_replace'))
			assert(
				outputHandler.result.failedChildren.get('test_stringutils')!.
				failedChildren.get('test_replace')!.failedChildren.has('TestReplace'))

			assert.equal(
				outputHandler.result.failedChildren.get('test_stringutils')!.
				failedChildren.get('test_replace')!.failedChildren.get('TestReplace')!.
				failedChildren.size, 1)			

			const failedChild = <ResultTreeItem>outputHandler.result.failedChildren.get('test_stringutils')?.
				failedChildren.get('test_replace')?.failedChildren.get('TestReplace')?.
				failedChildren.get('test_will_fail');
			assert.equal(failedChild.name, 'test_will_fail')
			assert(failedChild.isFailedTest)
			assert.equal(failedChild.line, 10)
		});
	});
});
