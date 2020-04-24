import * as assert from 'assert';

import * as vscode from 'vscode';
import XunitOutputHandler from '../../../outputhandlers/XunitOutputHandler';
import { MockRunner } from '../../mocks';

class MockXunitOutputHandlerFull extends XunitOutputHandler {
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
		const outputHandler = new MockXunitOutputHandlerFull(new MockRunner());
		return outputHandler.handleProcessDone().then(() => {
			assert.equal(outputHandler.testOutputSet.testCount, 3);
			assert.equal(outputHandler.testOutputSet.failedTestCount, 1);
		});
	});

	test('handleProcessDone failure mapped correctly', () => {
		const outputHandler = new MockXunitOutputHandlerFull(new MockRunner());
		return outputHandler.handleProcessDone().then(() => {
			assert(outputHandler.testOutputSet.failedSubsets.has('test_stringutils'))
			assert(!outputHandler.testOutputSet.failedSubsets.get('test_stringutils')?.failedSubsets.has('test_stuff'))
			assert(outputHandler.testOutputSet.failedSubsets.get('test_stringutils')?.failedSubsets.has('test_replace'))
			assert(
				outputHandler.testOutputSet.failedSubsets.get('test_stringutils')?.
				failedSubsets.get('test_replace')?.failedSubsets.has('TestReplace'))
			assert.equal(
				outputHandler.testOutputSet.failedSubsets.get('test_stringutils')?.
				failedSubsets.get('test_replace')?.failedSubsets.get('TestReplace')?.
				failedSubsets.size, 0)
			assert.equal(
				outputHandler.testOutputSet.failedSubsets.get('test_stringutils')?.
				failedSubsets.get('test_replace')?.failedSubsets.get('TestReplace')?.
				failedOutputs.length, 1)
			
			const failedOutput = outputHandler.testOutputSet.failedSubsets.get('test_stringutils')?.
				failedSubsets.get('test_replace')?.failedSubsets.get('TestReplace')?.
				failedOutputs[0];
			assert.equal(failedOutput?.name, 'test_will_fail')
			assert(failedOutput?.isFailure)
			assert.equal(failedOutput?.output.line, 10)
			assert.equal(failedOutput?.output.fsPath, 'test_stringutils/test_replace.py')
		});
	});
});
