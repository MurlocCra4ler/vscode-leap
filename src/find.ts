import { Position, TextLine, TextEditor, window, Range, TextEditorDecorationType } from "vscode";
import { ExtensionSettings } from "./extension";

let usedDecorationTypes: TextEditorDecorationType[] = [];

export function find(searchString: string, matchCase: boolean, editor: TextEditor, settings: ExtensionSettings): Range[] {
    const potentialMatches: Range[] = [];
    if (searchString.length === 0) {
        return potentialMatches;
    }

    searchString = matchCase ? searchString : searchString.toLowerCase();
    const visibleLines = getVisibleLines(editor);

    const anchor = searchString.slice(0, 2);
    const anchorLength = Math.min(searchString.length, 2);
    for (const line of visibleLines) {
        const text = line.text + '  ';
        console.log(text);
        for (let character = 0; character < text.length; character++) {
            const comperator = matchCase ? text.slice(character, character + anchorLength)
                : text.slice(character, character + anchorLength).toLocaleLowerCase();

            /* special handling for double whitespace */
            if (comperator === anchor && anchor === '  ') {
                if (((character === 0 || text.slice(character - 1, character) !== ' ') && !settings.whiteSpacesOnlyMatchNewLine) || character === text.length - 2) {
                    potentialMatches.push(new Range(
                        new Position(line.lineNumber, character),
                        new Position(line.lineNumber, character)
                    ));
                }
            } else if (comperator === anchor) {
                potentialMatches.push(new Range(
                    new Position(line.lineNumber, character),
                    new Position(line.lineNumber, character + searchString.length)
                ));
            }
        }
    }

    if (searchString.length <= 2) {
        return potentialMatches;
    }

    const searchStringTail = searchString.slice(2).toLocaleLowerCase();
    const searchResult: Range[] = [];
    for (let i = 0; i < potentialMatches.length; i++) {
        if (createLabels(i, searchStringTail.length) === searchStringTail) {
            searchResult.push(potentialMatches[i]);
        }
    }

    return searchResult;
}

export function hightlight(searchResult: Range[], editor: TextEditor, showLabels: boolean): void {
    for (let i = 0; i < usedDecorationTypes.length; i++) {
        usedDecorationTypes[i].dispose();
    }

    usedDecorationTypes = [];
    for (let i = 0; i < searchResult.length; i++) {
        const decorationType = createDecorationType(createLabels(i, 1), showLabels);
        editor.setDecorations(decorationType, [{ range: searchResult[i] }]);
        usedDecorationTypes.push(decorationType);
    }
}

function createLabels(value: number, length: number): string {
    let truffle = "";
    for (let i = 0; i < length; i++) {
        truffle += numberToCharacter(value % 26);
        value = value / 26;
    }

    return truffle;
}

function numberToCharacter(value: number): string {
    return "eariotnslcudpmhgbfywkvxzjq".charAt(value);
}

function getVisibleLines(editor: TextEditor): TextLine[] {
    let textLines = [];
    const ranges = editor.visibleRanges;

    for (let range of ranges) {
        for (let lineNumber = range.start.line; lineNumber <= range.end.line; lineNumber++) {
            textLines.push(editor.document.lineAt(lineNumber));
        }
    }

    return textLines;
}

function createDecorationType(label: string, showLabels: boolean): TextEditorDecorationType { 
    return window.createTextEditorDecorationType({
        backgroundColor: 'var(--vscode-editor-findMatchHighlightBackground)',
        light: {
            after: showLabels ? {
                contentText: label,
                color: 'var(--vscode-editor-background)',
                backgroundColor: 'var(--vscode-editor-foreground)',
                fontWeight: 'bold',
                border: '2px solid var(--vscode-editor-foreground)'
            } : undefined
        },
        dark: {
            after: showLabels ? {
                contentText: label,
                color: 'var(--vscode-editor-background)',
                backgroundColor: 'var(--vscode-editor-foreground)',
                fontWeight: 'bold',
                border: '2px solid var(--vscode-editor-foreground)'
            } : undefined
        }
    });
}