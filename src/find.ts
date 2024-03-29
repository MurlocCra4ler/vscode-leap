import {
  Position,
  TextLine,
  TextEditor,
  window,
  Range,
  TextEditorDecorationType,
} from "vscode";
import { ExtensionSettings } from "./extension";

let usedDecorationTypes: TextEditorDecorationType[] = [];

export function findForward(
  searchString: string,
  matchCase: boolean,
  editor: TextEditor,
  settings: ExtensionSettings,
  startLine: number,
  endLine: number
): Range[] {
  const startCharacter = editor.selection.active.character;
  const endCharacter = editor.document.lineAt(endLine).text.length; // End of the line

  return findFromRange(
    searchString,
    matchCase,
    editor,
    settings,
    startLine,
    startCharacter,
    endLine,
    endCharacter
  );
}

export function findBackward(
  searchString: string,
  matchCase: boolean,
  editor: TextEditor,
  settings: ExtensionSettings,
  startLine: number,
  endLine: number
): Range[] {
  const startCharacter = 0; // Start of the line
  const endCharacter = editor.selection.active.character;

  return findFromRange(
    searchString,
    matchCase,
    editor,
    settings,
    endLine,
    startCharacter,
    startLine,
    endCharacter
  );
}

export function findEntireView(
  searchString: string,
  matchCase: boolean,
  editor: TextEditor,
  settings: ExtensionSettings,
  startLine: number,
  endLine: number
): Range[] {
  const startCharacter = 0; // Start of the line
  const endCharacter = editor.document.lineAt(endLine).text.length; // End of the line

  return findFromRange(
    searchString,
    matchCase,
    editor,
    settings,
    startLine,
    startCharacter,
    endLine,
    endCharacter
  );
}

export function findFromRange(
  searchString: string,
  matchCase: boolean,
  editor: TextEditor,
  settings: ExtensionSettings,
  startLine: number,
  startCharacter: number,
  endLine: number,
  endCharacter: number
): Range[] {
  const potentialMatches: Range[] = [];

  if (searchString.length === 0) {
    return potentialMatches;
  }

  searchString = matchCase ? searchString : searchString.toLowerCase();

  // We use the editor's document to get lines from startLine to endLine
  const lines: TextLine[] = [];
  for (let i = startLine; i <= endLine; i++) {
    lines.push(editor.document.lineAt(i));
  }

  const anchor = searchString.slice(0, 2);
  const anchorLength = Math.min(searchString.length, 2);
  for (const line of lines) {
    const text = line.text + "  ";
    console.log(text);

    let startChar = 0; // default starting character
    let endChar = text.length; // default ending character

    if (line.lineNumber === startLine) {
      startChar = startCharacter;
    }
    if (line.lineNumber === endLine) {
      endChar = endCharacter;
    }

    for (let character = startChar; character < endChar; character++) {
      const comparator = matchCase
        ? text.slice(character, character + anchorLength)
        : text.slice(character, character + anchorLength).toLocaleLowerCase();

      /* special handling for double whitespace */
      if (comparator === anchor && anchor === "  ") {
        if (
          ((character === 0 || text.slice(character - 1, character) !== " ") &&
            !settings.whiteSpacesOnlyMatchNewLine) ||
          character === text.length - 2
        ) {
          potentialMatches.push(
            new Range(
              new Position(line.lineNumber, character),
              new Position(line.lineNumber, character)
            )
          );
        }
      } else if (comparator === anchor) {
        potentialMatches.push(
          new Range(
            new Position(line.lineNumber, character),
            new Position(line.lineNumber, character + searchString.length)
          )
        );
      }
    }
  }

  if (searchString.length <= 2) {
    return potentialMatches;
  }

  const searchStringTail = searchString.slice(2).toLocaleLowerCase();
  const searchResult: Range[] = [];
  for (let i = 0; i < potentialMatches.length; i++) {
    if (createLabels(i, searchStringTail.length, settings.labels) === searchStringTail) {
      searchResult.push(potentialMatches[i]);
    }
  }

  return searchResult;
}

export function hightlight(
  searchResult: Range[],
  editor: TextEditor,
  labels: string[],
  showLabels: boolean
): void {
  for (let i = 0; i < usedDecorationTypes.length; i++) {
    usedDecorationTypes[i].dispose();
  }

  usedDecorationTypes = [];
  for (let i = 0; i < searchResult.length; i++) {
    const decorationType = createDecorationType(createLabels(i, 1, labels), showLabels);

    const labelRange = new Range(
      searchResult[i].end, // start from the end of the match
      searchResult[i].end // end at the end of the match (i.e., no characters highlighted)
    );

    editor.setDecorations(decorationType, [{ range: labelRange }]);
    usedDecorationTypes.push(decorationType);
  }
}

function createLabels(value: number, length: number, labels: string[]): string {
  let truffle = "";
  for (let i = 0; i < length; i++) {
    truffle += numberToCharacter(value % labels.length, labels);
    value = Math.floor(value / labels.length);
  }
  return truffle;
}

function numberToCharacter(value: number, labels: string[]): string {
  if (value >= 0 && value < labels.length) {
    return labels[value];
  }
  return "";
}

export function getVisibleLines(editor: TextEditor): TextLine[] {
  let textLines = [];
  const ranges = editor.visibleRanges;

  for (let range of ranges) {
    for (
      let lineNumber = range.start.line;
      lineNumber <= range.end.line;
      lineNumber++
    ) {
      textLines.push(editor.document.lineAt(lineNumber));
    }
  }

  return textLines;
}

function createDecorationType(
  label: string,
  showLabels: boolean
): TextEditorDecorationType {
  return window.createTextEditorDecorationType({
    backgroundColor: "var(--vscode-editor-findMatchHighlightBackground)",
    light: {
      after: showLabels
        ? {
            contentText: label,
            color: "var(--vscode-editor-background)",
            backgroundColor: "var(--vscode-editor-foreground)",
            fontWeight: "bold",
            border: "2px solid var(--vscode-editor-foreground)",
          }
        : undefined,
    },
    dark: {
      after: showLabels
        ? {
            contentText: label,
            color: "var(--vscode-editor-background)",
            backgroundColor: "var(--vscode-editor-foreground)",
            fontWeight: "bold",
            border: "2px solid var(--vscode-editor-foreground)",
          }
        : undefined,
    },
  });
}
