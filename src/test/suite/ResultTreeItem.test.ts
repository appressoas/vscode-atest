import * as assert from 'assert';

import * as vscode from 'vscode';
import { MockResultTreeItem } from '../mocks';
import { EResultTreeItemType } from '../../types';

suite('ResultTreeItem Test Suite', () => {
    vscode.window.showInformationMessage('Start ResultTreeItem tests.');

    test('add() sanity', () => {
        const root = new MockResultTreeItem();
        const itemToAdd = new MockResultTreeItem(['a']);
        root.add(itemToAdd);
        assert.equal(root.children.size, 1);
        assert.equal(root.children.get('a'), itemToAdd);
    });

    test('add() recursive multiple levels sanity', () => {
        const root = new MockResultTreeItem();
        const itemToAdd = new MockResultTreeItem(['a', 'b', 'c']);
        root.add(itemToAdd);
        assert.equal(root.children.size, 1);

        assert(root.children.has('a'));
        assert.equal(root.children.get('a')!.name, 'a');
        assert.equal(root.children.get('a')!.codePath!.join('.'), 'a');
        assert.equal(root.children.get('a')!.children.size, 1);

        assert(root.children.get('a')!.children.has('b'));
        assert.equal(root.children.get('a')!.children.get('b')!.name, 'b');
        assert.equal(root.children.get('a')!.children.get('b')!.codePath!.join('.'), 'a.b');
        assert.equal(root.children.get('a')!.children.get('b')!.children.size, 1);

        assert(root.children.get('a')!.children.get('b')!.children.has('c'));
        assert.equal(root.children.get('a')!.children.get('b')!.children.get('c'), itemToAdd);
        assert.equal(root.children.get('a')!.children.get('b')!.children.get('c')!.codePath!.join('.'), 'a.b.c');
    });

    test('add() not test - do not add to testCount', () => {
        const root = new MockResultTreeItem();
        const itemToAdd = new MockResultTreeItem(['a']);
        itemToAdd.resultType = EResultTreeItemType.Generic;
        root.add(itemToAdd);
        assert.equal(root.testCount, 0);
    });

    test('add() test - adds to testCount', () => {
        const root = new MockResultTreeItem();
        const itemToAdd = new MockResultTreeItem(['a']);
        itemToAdd.resultType = EResultTreeItemType.Test;
        root.add(itemToAdd);
        assert.equal(root.testCount, 1);
    });

    test('add() failed test - adds to testCount', () => {
        const root = new MockResultTreeItem();
        const itemToAdd = new MockResultTreeItem(['a']);
        itemToAdd.resultType = EResultTreeItemType.Test;
        itemToAdd.failureMessage = 'Fail!';
        root.add(itemToAdd);
        assert.equal(root.testCount, 1);
    });

    test('add() test - adds to testCount recursive', () => {
        const root = new MockResultTreeItem();
        const itemToAdd1 = new MockResultTreeItem(['a', 'b', 'c']);
        itemToAdd1.resultType = EResultTreeItemType.Test;
        root.add(itemToAdd1);
        const itemToAdd2 = new MockResultTreeItem(['a', 'b', 'd']);
        itemToAdd2.resultType = EResultTreeItemType.Test;
        root.add(itemToAdd2);
        assert.equal(root.testCount, 2);
    });

    test('add() do not overwrite existing', () => {
        const root = new MockResultTreeItem();

        const itemToAdd1 = new MockResultTreeItem(['a', 'b']);
        itemToAdd1.resultType = EResultTreeItemType.TestCase;
        root.add(itemToAdd1);

        const itemToAdd2 = new MockResultTreeItem(['a', 'b', 'c']);
        itemToAdd2.resultType = EResultTreeItemType.Test;
        root.add(itemToAdd2);

        assert.equal(
            root.children.get('a')!.children.get('b')!.resultType,
            EResultTreeItemType.TestCase);
        assert.equal(
            root.children.get('a')!.children.get('b'),
            itemToAdd1);
        assert.equal(
            root.children.get('a')!.children.get('b')!.children.get('c')!.resultType,
            EResultTreeItemType.Test);
        assert.equal(
            root.children.get('a')!.children.get('b')!.children.get('c'),
            itemToAdd2);
    });
});
