import { Position, TextLine, TextEditor, window, Range, TextEditorDecorationType } from "vscode";

let decorationTypes: TextEditorDecorationType[] = [];

export function find(searchString: string, matchCase: boolean, editor: TextEditor): Range[] {
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
        for (let character = 0; character < text.length; character++) {
            const comperator = matchCase ? text.slice(character, character + anchorLength)
                : text.slice(character, character + anchorLength).toLocaleLowerCase();
            if (comperator === anchor) {
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
        if (createTruffles(i, searchStringTail.length) === searchStringTail) {
            searchResult.push(potentialMatches[i]);
        }
    }

    return searchResult;
}

export function hightlight(searchResult: Range[], editor: TextEditor): void {
    for (let i = 0; i < decorationTypes.length; i++) {
        editor.setDecorations(decorationTypes[i], []);
    }

    decorationTypes = [];

    for (let i = 0; i < searchResult.length; i++) {
        const showTruffles = (searchResult[i].end.character - searchResult[i].start.character) >= 2;
        const decorationType = createDecorationType(createTruffles(i, 1), showTruffles);
        editor.setDecorations(decorationType, [{ range: searchResult[i] }]);
        decorationTypes.push(decorationType);
    }
}

function createTruffles(value: number, length: number): string {
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

function createDecorationType(truffle: string, showTruffles: boolean): TextEditorDecorationType {
    return window.createTextEditorDecorationType({
        backgroundColor: 'var(--vscode-editor-findMatchHighlightBackground)',
        light: {
            after: showTruffles ? {
                contentText: truffle,
                color: 'var(--vscode-editor-background)',
                backgroundColor: 'var(--vscode-editor-foreground)',
                fontWeight: 'bold',
                border: '2px solid var(--vscode-editor-foreground)'
            } : undefined
        },
        dark: {
            after: showTruffles ? {
                contentText: truffle,
                color: 'var(--vscode-editor-background)',
                backgroundColor: 'var(--vscode-editor-foreground)',
                fontWeight: 'bold',
                border: '2px solid var(--vscode-editor-foreground)'
            } : undefined
        }
    });
}