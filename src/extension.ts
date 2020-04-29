import * as vscode from 'vscode';
import ATest from './ATest';
import { ResultTreeItem } from './ResultTreeItem';

export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('"atest" extension is active');

	let atest = new ATest();

	context.subscriptions.push(vscode.commands.registerCommand('atest.clearTestOutputList', () => {
		atest.clearTestOutputList();
	}));

	// context.subscriptions.push(vscode.commands.registerCommand('atest.runTestAtCursor', () => {
	// 	atest.runTestAtCursor();
	// }));
	context.subscriptions.push(vscode.commands.registerCommand('atest.runTestsInCurrentFile', () => {
		atest.runTestsInCurrentFile();
	}));
	context.subscriptions.push(vscode.commands.registerCommand('atest.runTestsInFolder', (folderUri: vscode.Uri) => {
		atest.runTestsInFolder(folderUri);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('atest.runTestsInFile', (fileUri: vscode.Uri) => {
		atest.runTestsInFile(fileUri);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('atest.testResultsShowSingleTest', (resultTreeItem: ResultTreeItem) => {
		atest.testResultsShowSingleTest(resultTreeItem);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('atest.testResultsReRunSingleTest', (resultTreeItem: ResultTreeItem) => {
		atest.testResultsReRunSingleTest(resultTreeItem);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('atest.testResultsShowSingleTestFailureMessage', (resultTreeItem: ResultTreeItem) => {
		atest.testResultsShowSingleTestFailureMessage(resultTreeItem);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('atest.testResultsReRunTestSet', (resultTreeItem: ResultTreeItem) => {
		atest.testResultsReRunTestSet(resultTreeItem);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('atest.testResultsReRunFailedInTestSet', (resultTreeItem: ResultTreeItem) => {
		atest.testResultsReRunFailedInTestSet(resultTreeItem);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('atest.testResultsShowTestSetFailureMessages', (resultTreeItem: ResultTreeItem) => {
		atest.testResultsShowTestSetFailureMessages(resultTreeItem);
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {}
