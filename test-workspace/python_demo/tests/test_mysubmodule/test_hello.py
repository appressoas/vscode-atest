import unittest
from ...mysubmodule import hello

class HelloTestCase(unittest.TestCase):
    def test_hello(self):
        self.assertEqual(hello.hello(), 'Hello')

    def test_hello_wrong(self):
        self.assertEqual(hello.hello(who='Person'), 'Hello World')

    def test_hello_who(self):
        self.assertEqual(hello.hello(who='Person'), 'Hello Person')

    def test_hi(self):
        self.assertEqual(hello.hi(), 'Hi')

    def test_hi_wrong(self):
        self.assertEqual(hello.hi(who='Person'), 'Hi World')

    def test_hi_who(self):
        self.assertEqual(hello.hi(who='Person'), 'Hi Person')
