import re

class Replace:
    def __init__(self, string):
        self.string = string

    def replace(self, text, replacement):
        return self.string.replace(text, replacement)

    def strip_whitespace(self):
        return re.sub(r'\s+', '', self.string)
