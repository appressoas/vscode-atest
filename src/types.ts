import * as vscode from 'vscode';

/**
 * Defines an executable to be executed as a child process.
 * 
 * Used by test runners.
 */
export type TExecutable = {
    // The command to exectute.
    command: string;

    // Arguments for the command.
    args: Array<string>;

    // Environment variables for the command. Optional.
    env?: {[key: string]: string};
}

export enum EResultTreeItemType {
    WorkspaceFolder = 'WorkspaceFolder',
    Generic = 'Generic',
    TestSuite = 'TestSuite',
    TestCase = 'TestCase',
    Test = 'Test'
}

export enum EResultTreeItemStatus {
    // Waiting for tests to start
    WaitingToStart = 'WaitingToStart',

    // Running tests
    Running = 'Running',

    // All tests below this item (recursively) is done
    Done = 'Done'
}
