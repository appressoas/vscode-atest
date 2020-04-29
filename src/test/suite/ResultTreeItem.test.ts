import * as assert from 'assert';

import * as vscode from 'vscode';
import { MockResultTreeItem } from '../mocks';
import { EResultTreeItemType, EResultTreeItemStatus } from '../../types';
import { ResultTreeItem } from '../../ResultTreeItem';

suite('ResultTreeItem Test Suite', () => {
    vscode.window.showInformationMessage('Start ResultTreeItem tests.');

    test('addChild()', () => {
        const root = new MockResultTreeItem('mockroot');
        const itemToAdd = new MockResultTreeItem('test');
        itemToAdd.resultType = EResultTreeItemType.Test;
        root.addChild(itemToAdd);

        assert(root.children.has('test'));
        assert.equal(root.children.get('test'), itemToAdd);
    });

    test('addOrReplaceChild() add', () => {
        const root = new MockResultTreeItem('mockroot');
        const itemToAdd = new MockResultTreeItem('test');
        const wasReplaced = root.addOrReplaceChild(itemToAdd);

        assert(!wasReplaced);
        assert(root.children.has('test'));
        assert.equal(root.children.get('test'), itemToAdd);
    });

    test('addOrReplaceChild() replace', () => {
        const root = new MockResultTreeItem('mockroot');
        root.addChild(new MockResultTreeItem('test'));
        const itemToAdd = new MockResultTreeItem('test');
        const wasReplaced = root.addOrReplaceChild(itemToAdd);

        assert(wasReplaced);
        assert(root.children.has('test'));
        assert.equal(root.children.get('test'), itemToAdd);
    });

    test('addChildRecursiveByPath()', () => {
        const root = new MockResultTreeItem('mockroot');
        const itemToAdd = new MockResultTreeItem('c');
        itemToAdd.resultType = EResultTreeItemType.Test;
        root.addChildRecursiveByPath(['a', 'b'], itemToAdd);

        assert(root.children.has('a'));
        assert.equal(root.children.get('a')!.resultType, EResultTreeItemType.Generic);

        assert(root.children.get('a')!.children.has('b'));
        assert.equal(root.children.get('a')!.children!.get('b')!.resultType, EResultTreeItemType.Generic);

        assert(root.children.get('a')!.children.get('b')!.children.has('c'));
        assert.equal(
            root.children.get('a')!.children!.get('b')!.children.get('c'), 
            itemToAdd);
        assert.equal(
            root.children.get('a')!.children!.get('b')!.children.get('c')?.resultType, 
            EResultTreeItemType.Test);
    });

    test('getByPathArray()', () => {
        const root = new MockResultTreeItem('mockroot');
        const level2 = new MockResultTreeItem('my');
        root.addChild(level2);
        const level3 = new MockResultTreeItem('test');
        level2.addChild(level3);
        assert.equal(root.getByPathArray(['my', 'test']), level3);
        assert.equal(root.getByPathArray(['my', 'other']), undefined);
    });

    test('getByDottedPath()', () => {
        const root = new MockResultTreeItem('mockroot');
        const level2 = new MockResultTreeItem('my');
        root.addChild(level2);
        const level3 = new MockResultTreeItem('test');
        level2.addChild(level3);
        assert.equal(root.getByDottedPath('my.test'), level3);
        assert.equal(root.getByDottedPath('my.other'), undefined);
    });

    // test('mergeFrom()', () => {
    //     const target = new MockResultTreeItem(['a', 'b']);
    //     target.children = new Map<string, ResultTreeItem>();
    //     target.failedChildren = new Map<string, ResultTreeItem>();
    //     target.resultType = EResultTreeItemType.Generic;
    //     target.status = EResultTreeItemStatus.WaitingToStart;
    //     target._codePath = ['my', 'test'];
    //     target.fileFsUri = vscode.Uri.file('/a/test.js');
    //     target.folderFsUri = undefined;
    //     target.line = 2;
    //     target.testSuitePath = ['test', 'suite'];
    //     target.testCasePath = ['TargetTestCase'];
    //     target.testPath = ['test_something_target'];
    //     target.failureMessage = 'This failed!';
    //     target.testCount = 0;
    //     target.failedTestCount = 1;
    //     target.label = 'TargetTest';

    //     const source = new MockResultTreeItem(['a', 'b']);
    //     source.resultType = EResultTreeItemType.TestCase;
    //     source.status = EResultTreeItemStatus.Done;
    //     source._codePath = ['my', 'test'];
    //     source.fileFsUri = vscode.Uri.file('/a/testsource.js');
    //     source.folderFsUri = vscode.Uri.file('/a/');
    //     source.line = 4;
    //     source.testSuitePath = ['test', 'sourcesuite'];
    //     source.testCasePath = ['SourceTestCase'];
    //     source.testPath = ['test_something_source'];
    //     source.failureMessage = undefined;
    //     source.testCount = 2;
    //     source.failedTestCount = 0;
    //     source.label = 'SourceTest';

    //     target.mergeFrom(source);
    //     assert.equal(target.resultType, EResultTreeItemType.TestCase);
    //     assert.equal(target.status, EResultTreeItemStatus.Done);
    //     assert.equal(target.dottedCodePath, 'my.test');
    //     assert.equal(target.fileFsUri.fsPath, '/a/testsource.js');
    //     assert.equal(target.folderFsUri!.fsPath, '/a/');
    //     assert.equal(target.line, 4);
    //     assert.equal(target.testSuitePath.join('.'), 'test.sourcesuite');
    //     assert.equal(target.testCasePath.join('.'), 'SourceTestCase');
    //     assert.equal(target.testPath.join('.'), 'test_something_source');
    //     assert.equal(target.failureMessage, undefined);
    //     assert.equal(target.testCount, 2);
    //     assert.equal(target.failedTestCount, 0);
    //     assert.equal(target.label, 'SourceTest');
    //     assert.equal(target.name, 'SourceTest');
    // });

    // test('add() sanity', () => {
    //     const root = new MockResultTreeItem();
    //     const itemToAdd = new MockResultTreeItem(['a']);
    //     root.add(itemToAdd);
    //     assert.equal(root.children.size, 1);
    //     assert.equal(root.children.get('a'), itemToAdd);
    // });

    // test('add() recursive multiple levels sanity', () => {
    //     const root = new MockResultTreeItem();
    //     const itemToAdd = new MockResultTreeItem(['a', 'b', 'c']);
    //     root.add(itemToAdd);
    //     assert.equal(root.children.size, 1);

    //     assert(root.children.has('a'));
    //     assert.equal(root.children.get('a')!.name, 'a');
    //     assert.equal(root.children.get('a')!.codePath!.join('.'), 'a');
    //     assert.equal(root.children.get('a')!.children.size, 1);

    //     assert(root.children.get('a')!.children.has('b'));
    //     assert.equal(root.children.get('a')!.children.get('b')!.name, 'b');
    //     assert.equal(root.children.get('a')!.children.get('b')!.codePath!.join('.'), 'a.b');
    //     assert.equal(root.children.get('a')!.children.get('b')!.children.size, 1);

    //     assert(root.children.get('a')!.children.get('b')!.children.has('c'));
    //     assert.equal(root.children.get('a')!.children.get('b')!.children.get('c'), itemToAdd);
    //     assert.equal(root.children.get('a')!.children.get('b')!.children.get('c')!.codePath!.join('.'), 'a.b.c');
    // });

    // test('add() not test - do not add to testCount', () => {
    //     const root = new MockResultTreeItem();
    //     const itemToAdd = new MockResultTreeItem(['a']);
    //     itemToAdd.resultType = EResultTreeItemType.Generic;
    //     root.add(itemToAdd);
    //     assert.equal(root.testCount, 0);
    // });

    // test('add() test - adds to testCount', () => {
    //     const root = new MockResultTreeItem();
    //     const itemToAdd = new MockResultTreeItem(['a']);
    //     itemToAdd.resultType = EResultTreeItemType.Test;
    //     root.add(itemToAdd);
    //     assert.equal(root.testCount, 1);
    // });

    // test('add() failed test - adds to testCount', () => {
    //     const root = new MockResultTreeItem();
    //     const itemToAdd = new MockResultTreeItem(['a']);
    //     itemToAdd.resultType = EResultTreeItemType.Test;
    //     itemToAdd.failureMessage = 'Fail!';
    //     root.add(itemToAdd);
    //     assert.equal(root.testCount, 1);
    // });

    // test('add() test - adds to testCount recursive', () => {
    //     const root = new MockResultTreeItem();
    //     const itemToAdd1 = new MockResultTreeItem(['a', 'b', 'c']);
    //     itemToAdd1.resultType = EResultTreeItemType.Test;
    //     root.add(itemToAdd1);
    //     const itemToAdd2 = new MockResultTreeItem(['a', 'b', 'd']);
    //     itemToAdd2.resultType = EResultTreeItemType.Test;
    //     root.add(itemToAdd2);
    //     assert.equal(root.testCount, 2);
    // });

    // test('add() do not overwrite existing', () => {
    //     const root = new MockResultTreeItem();

    //     const itemToAdd1 = new MockResultTreeItem(['a', 'b']);
    //     itemToAdd1.resultType = EResultTreeItemType.TestCase;
    //     root.add(itemToAdd1);

    //     const itemToAdd2 = new MockResultTreeItem(['a', 'b', 'c']);
    //     itemToAdd2.resultType = EResultTreeItemType.Test;
    //     root.add(itemToAdd2);

    //     assert.equal(
    //         root.children.get('a')!.children.get('b')!.resultType,
    //         EResultTreeItemType.TestCase);
    //     assert.equal(
    //         root.children.get('a')!.children.get('b'),
    //         itemToAdd1);
    //     assert.equal(
    //         root.children.get('a')!.children.get('b')!.children.get('c')!.resultType,
    //         EResultTreeItemType.Test);
    //     assert.equal(
    //         root.children.get('a')!.children.get('b')!.children.get('c'),
    //         itemToAdd2);
    // });

    // test('add() merges if new and target is the same', () => {
    //     const root = new MockResultTreeItem(['a', 'b']);
    //     root.label = 'Root';
    //     root.status = EResultTreeItemStatus.WaitingToStart;
    //     const itemToAdd = new MockResultTreeItem(['a', 'b']);        
    //     itemToAdd.label = 'New Root';
    //     itemToAdd.status = EResultTreeItemStatus.Done;
    //     root.add(itemToAdd);

    //     assert.equal(root.label, 'New Root');
    //     assert.equal(root.status, EResultTreeItemStatus.Done);
    // });

    // test('add() merges if new and target is the same', () => {
    //     const root = new MockResultTreeItem(['a', 'b']);
    //     root.label = 'Root';
    //     root.status = EResultTreeItemStatus.WaitingToStart;
    //     const itemToAdd = new MockResultTreeItem(['a', 'b']);        
    //     itemToAdd.label = 'New Root';
    //     itemToAdd.status = EResultTreeItemStatus.Done;
    //     root.add(itemToAdd);

    //     assert.equal(root.label, 'New Root');
    //     assert.equal(root.status, EResultTreeItemStatus.Done);
    // });

    // test('add() merges if new and target is the same', () => {
    //     const root = new MockResultTreeItem(['a', 'b']);
    //     root.label = 'Root';
    //     root.status = EResultTreeItemStatus.WaitingToStart;
    //     const itemToAdd = new MockResultTreeItem(['a', 'b']);        
    //     itemToAdd.label = 'New Root';
    //     itemToAdd.status = EResultTreeItemStatus.Done;
    //     root.add(itemToAdd);

    //     assert.equal(root.label, 'New Root');
    //     assert.equal(root.status, EResultTreeItemStatus.Done);
    // });
});
