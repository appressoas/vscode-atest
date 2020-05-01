import unittest
import time
from ...mysubmodule import fancy

class FancyTestCase(unittest.TestCase):
    def test_fancy_hello(self):
        # time.sleep(10)
        self.assertEqual(fancy.fancy_hello(), 'Hello Fancy World')

    def test_fancy_hello_wrong(self):
        self.assertEqual(fancy.fancy_hello(who='Person'), 'Hello Fancy World')
        pass

    def test_fancy_hello_who(self):
        self.assertEqual(fancy.fancy_hello(who='Person'), 'Hello Fancy Person')

    def test_fancy_hi(self):
        self.assertEqual(fancy.fancy_hi(), 'Hi Fancy World')

    def test_fancy_hi_wrong(self):
        self.assertEqual(fancy.fancy_hi(who='Person'), 'Hi Fancy World')
        pass

    def test_fancy_hi_who(self):
        self.assertEqual(fancy.fancy_hi(who='Person'), 'Hi Fancy Person')

    def test_fancy_crashes(self):
        raise Exception('Crashing2 ...')


class AnotherFancyTestCase(unittest.TestCase):
    def test_more_stuff(self):
        self.assertEqual(1, 1)
