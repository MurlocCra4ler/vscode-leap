# Leap Extension for Visual Studio Code 

Leap provides an easy way to move the cursor in vscode without using the mouse. Based on leap.nvim

## Feature Overview

![showcase](./media/showcase.gif?raw=true)

Leap lets you jump to any location in the visible editor area by entering a two-character search pattern and then possibly a tag character to select your destination from multiple matches.

The default key assignment to open the Leap widget is `Ctrl + Alt + F` and with `Alt + C` you can toggle the "Match Case" option.

## Extension Settings

Define new keybinds using the `"leap.find"` and `"leap.match-case"` commands. 

Example using the [Vim extension](https://marketplace.visualstudio.com/items?itemName=vscodevim.vim), mimicking [leap.nvim](https://github.com/ggandor/leap.nvim):

```json
"vim.normalModeKeyBindingsNonRecursive": [
    {
        "before": ["s"],
        "commands": ["leap.find"]
    }
]
```

## Known Issues

None, but feel free to report any bugs you may find :)

## Release Notes

### 0.0.2

The end of a line now acts as if it had trailing whitspaces. Try jumping to the end of it by pressing `space` twice.

### 0.0.1

Initial release 🎉

**Enjoy!**
