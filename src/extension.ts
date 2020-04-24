import * as vscode from 'vscode';
import ATest from './ATest';
import { TestResultsProvider, SingleTestOutputTreeItem, TestOutputSetTreeItem } from './TestResultsProvider';

export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('"atest" extension is active');

	let atest = new ATest();
	context.subscriptions.push(vscode.commands.registerCommand('atest.runTestAtCursor', () => {
		atest.runTestAtCursor();
	}));
	context.subscriptions.push(vscode.commands.registerCommand('atest.runTestsInCurrentFile', () => {
		atest.runTestsInCurrentFile();
	}));
	context.subscriptions.push(vscode.commands.registerCommand('atest.runTestsInFolder', (folderUri: vscode.Uri) => {
		// console.log('typeof folderUri', typeof folderUri);
		// console.log('folderUri', folderUri);
		atest.runTestsInFolder(folderUri);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('atest.runTestsInFile', (fileUri: vscode.Uri) => {
		// console.log('typeof fileUri', typeof fileUri);
		// console.log('fileUri', fileUri);
		atest.runTestsInFile(fileUri);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('atest.testResultsShowSingleTest', (singleTestOutputTreeItem: SingleTestOutputTreeItem) => {
		atest.testResultsShowSingleTest(singleTestOutputTreeItem);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('atest.testResultsReRunSingleTest', (singleTestOutputTreeItem: SingleTestOutputTreeItem) => {
		atest.testResultsReRunSingleTest(singleTestOutputTreeItem);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('atest.testResultsShowSingleTestFailureMessage', (singleTestOutputTreeItem: SingleTestOutputTreeItem) => {
		atest.testResultsShowSingleTestFailureMessage(singleTestOutputTreeItem);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('atest.testResultsReRunTestSet', (testOutputSetTreeItem: TestOutputSetTreeItem) => {
		atest.testResultsReRunTestSet(testOutputSetTreeItem);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('atest.testResultsReRunFailedInTestSet', (testOutputSetTreeItem: TestOutputSetTreeItem) => {
		atest.testResultsReRunFailedInTestSet(testOutputSetTreeItem);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('atest.testResultsShowTestSetFailureMessages', (testOutputSetTreeItem: TestOutputSetTreeItem) => {
		atest.testResultsShowTestSetFailureMessages(testOutputSetTreeItem);
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {}
