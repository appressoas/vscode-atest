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
});
