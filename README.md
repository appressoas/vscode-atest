# ATest README

## Features


## Extension Settings

This extension contributes the following settings:

* `atest.runners`: An object that maps enabled runners to options. See available runners section below for details.


### Available runners

#### Pytest runner
Configuration (in settings.json):

```
{
    "atest.runners" {
        "pytest": true   // No options for now - it may get some options later on, and then this will be an object instead of just true.
    }
}
```


## Available command palette commands

The actual command is within `[]` below - useful if you want to setup keybindings.

- **ATest: Run tests in current file** `[atest.runTestsInCurrentFile]`: Run the tests in the current file.
- **ATest: Clear test output list** `[atest.clearTestOutputList]`: Clear the test results list in the tests view/panel.


## Available explorer commands
E.g.: right click menu options in the file explorer.
The actual command is within `[]` below - useful if you want to setup keybindings.

- **ATest: Run all tests in folder** `[atest.runTestsInFolder]`: Run tests in the selected folder.
- **ATest: Run all tests in file** `[atest.runTestsInFile]`: Run tests in the selected file.

## Release Notes

### 1.0.0
Initial internal release of ATest. Only usable in very specific use cases.

### 1.0.2
Internal release that is usable for running tests with pytest, and the framework for adding more runners in place.

### 1.0.3
Internal release - fixes for output channels.
