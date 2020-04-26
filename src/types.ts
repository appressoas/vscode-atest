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

/**
 * Options for a runner (an {@link AbstractRunner} subclass).
 * 
 * I.e.: We throw as much details as possible at the runner and it tries
 * to run it. The rule is that more explicit options such as
 * ``testSuiteName+testCaseName+testName`` takes presedence over
 * less specific options such as ``fileFsUri`` if both are specified.
 * I.e.: Runners should try to run as few tests as possible based on the
 * provided options.
 * 
 * Most runners run fine without ANY options. E.g.: They run all tests.
 */
export type TRunnerOptions = {
    // The workspace folder to run the tests within
    workspaceFolder: vscode.WorkspaceFolder;

    // Runner name - when this is provided, we skip detecting the runner.
    // I.e.: This is used when re-running tests.
    runnerName: string;

    // Absolute path to a file.
    fileFsUri?: vscode.Uri;

    // Absolute path to a folder.
    folderFsUri?: vscode.Uri;

    // The line number of a test to run in the ``fileFsUri`` file.
    line?: number;

    // The name of the test suite. Used when re-running tests,
    // and the format is highly language and test-runner dependent.
    // Typically the code path to the test suite class/module.
    testSuiteName?: string;

    // The name of the test case. Used when re-running tests,
    // and the format is highly language and test-runner dependent.
    // Typically the code path to the test case class, or the relative code
    // path from the ``testSuiteName``.
    testCaseName?: string;

    // The name of the test. Used when re-running tests,
    // and the format is highly language and test-runner dependent.
    // Typically the code path to the test case function/method, or the relative code
    // path from the ``testCaseName``.
    testName?: string;
}

/**
 * Output from a single test.
 * 
 * Notice that this is very similar to {@link TRunnerOptions}. This is intentional
 * because test output is converted to TRunnerOptions to re-run tests.
 */
export type TSingleTestOutput = {

    // Code path to the test as an array.
    codePath: Array<string>;

    // Absolute filestystem path of the file containing the test
    fileFsPath: string;

    // Line number in ``fileFsPath`` where the test is located.
    line: number;

    // The relative filesystem path of the file.
    // E.g.: The path relative to the CWD when the test runner ran the test.
    // Used when re-running tests.
    relativeFsPath: string;

    // The name of the test suite. Used when re-running tests,
    // and the format is highly language and test-runner dependent.
    // Typically the code path to the test suite class/module.
    testSuiteName?: string;

    // The name of the test case. Used when re-running tests,
    // and the format is highly language and test-runner dependent.
    // Typically the code path to the test case class, or the relative code
    // path from the ``testSuiteName``.
    testCaseName?: string;

    // The name of the test. Used when re-running tests,
    // and the format is highly language and test-runner dependent.
    // Typically the code path to the test case function/method, or the relative code
    // path from the ``testCaseName``.
    testName?: string;

    // Failure message (if the test failed)
    failureMessage?: string;
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
