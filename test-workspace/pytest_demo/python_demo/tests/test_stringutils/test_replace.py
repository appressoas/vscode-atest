import unittest
from ... import stringutils

class TestReplace(unittest.TestCase):
    def test_replace(self):
        self.assertEqual(stringutils.Replace('Hello World').replace('World', 'World!'), 'Hello World!')

    def test_will_fail(self):
        self.assertEqual(stringutils.Replace('Hello World').replace('World', 'World!'), 'Hello')

    def test_strip_whitespace(self):
        self.assertEqual(stringutils.Replace(' Hello  \nWorld ').strip_whitespace(), 'HelloWorld')


class TestReplace2(unittest.TestCase):
    def test_replace2(self):
        self.assertEqual(stringutils.Replace('Hello World').replace('World', 'World!'), 'Hello World!')

    def test_will_fail2(self):
        self.assertEqual(stringutils.Replace('Hello World').replace('World', 'World!'), 'Hello')
