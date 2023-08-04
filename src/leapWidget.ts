import {
  window,
  QuickPick,
  QuickPickItem,
  QuickInputButton,
  ThemeIcon,
  Range,
  ExtensionContext,
  Selection,
} from "vscode";
import { ExtensionSettings } from "./extension";
import {
  hightlight,
  findForward,
  findBackward,
  getVisibleLines,
  findEntireView,
} from "./find";

const MATCH_CASE_KEY = "match-case";

export enum SearchDirection {
  FORWARD,
  BACKWARD,
  ENTIRE_VIEW,
}

export class LeapWidget {
  public isActive = true;

  private matchCase: boolean = false;
  private searchString = "";
  private searchResult: Range[] = [];

  private readonly quickPick: QuickPick<QuickPickItem> =
    window.createQuickPick();
  private quickInputButtons: Map<QuickInputButton, () => void> = new Map();
  private currentSearchDirection: SearchDirection = SearchDirection.FORWARD;

  constructor(
    private readonly context: ExtensionContext,
    private readonly settings: ExtensionSettings
  ) {
    this.quickPick.title = "Leap Finder";
    this.quickPick.placeholder = "Find";

    this.matchCase = !!this.context.globalState.get<boolean>(MATCH_CASE_KEY);
    this.createButtons();

    this.quickPick.onDidTriggerButton(this.onDidTriggerButton.bind(this));
    this.quickPick.onDidChangeValue(this.onChangeValue.bind(this));
    this.quickPick.onDidHide(this.hide.bind(this));
  }

  public show(direction: SearchDirection): void {
    if (!this.isActive) {
      console.error("show: Leapwidget has already been disposed!");
      return;
    }

    this.quickPick.show();

    // Initiate the search in the given direction
    switch (direction) {
      case SearchDirection.FORWARD:
        this.findForward();
        break;
      case SearchDirection.BACKWARD:
        this.findBackward();
        break;
      case SearchDirection.ENTIRE_VIEW:
        this.findEntireView();
        break;
    }
  }

  public close(): void {
    this.hide();
    this.quickPick.dispose();
    this.isActive = false;
    this.context.globalState.update(MATCH_CASE_KEY, this.matchCase);
  }

  public toggleMatchCase(): void {
    if (!this.isActive) {
      console.error("toggleMatchCase: Leapwidget has already been disposed!");
      return;
    }

    this.matchCase = !this.matchCase;
    this.createButtons();
    this.createSearch();
  }

  private createButtons(): void {
    this.quickInputButtons.clear(); // Reset the existing map

    const matchCaseIcon = this.matchCase ? "preserve-case" : "case-sensitive";
    const matchCaseTooltip = this.matchCase
      ? "Match Case (Alt + C)"
      : "Don't Match Case (Alt + C)";

    this.quickInputButtons.set(
      {
        iconPath: new ThemeIcon(matchCaseIcon),
        tooltip: matchCaseTooltip,
      },
      this.toggleMatchCase.bind(this)
    );

    this.quickInputButtons.set(
      {
        iconPath: new ThemeIcon("widget-close"),
        tooltip: "Close (Escape)",
      },
      this.close.bind(this)
    );

    this.quickPick.buttons = [...this.quickInputButtons.keys()];
  }

  private createSearch() {
    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }

    // Check if the cursor is in the first or second half of the visible portion of the editor
    const cursorPosition = editor.selection.active.line;
    const visibleLines = getVisibleLines(editor);
    const middleVisibleLine =
      visibleLines[Math.floor(visibleLines.length / 2)].lineNumber;

    // Decide which find method to use based on the cursor's position
    if (cursorPosition <= middleVisibleLine) {
      this.searchResult = findBackward(
        this.searchString,
        this.matchCase,
        editor,
        this.settings,
        visibleLines[0].lineNumber, // start of visible range
        cursorPosition // current cursor position
      );
    } else {
      this.searchResult = findForward(
        this.searchString,
        this.matchCase,
        editor,
        this.settings,
        cursorPosition, // current cursor position
        visibleLines[visibleLines.length - 1].lineNumber // end of visible range
      );
    }

    const showLabels = this.searchString.length >= 2;
    hightlight(this.searchResult, editor, showLabels);

    if (this.searchResult.length === 1) {
      editor.selections = [
        new Selection(this.searchResult[0].start, this.searchResult[0].start),
      ];
      this.close();
    }
  }

  private hide(): void {
    if (!this.isActive) {
      console.error("hide: Leapwidget has already been disposed!");
      return;
    }

    const editor = window.activeTextEditor;
    if (editor) {
      hightlight([], editor, false);
    }
  }

  private onChangeValue(value: string): void {
    this.searchString = value;

    if (this.currentSearchDirection === SearchDirection.FORWARD) {
      this.findForward();
    } else if (this.currentSearchDirection === SearchDirection.BACKWARD) {
      this.findBackward();
    } else {
      this.findEntireView();
    }
  }

  private onDidTriggerButton(button: QuickInputButton): void {
    this.quickInputButtons.get(button)?.();
  }

  public findForward(): void {
    this.currentSearchDirection = SearchDirection.FORWARD;
    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }
    const startLine = editor.selection.active.line;
    const endLine = editor.visibleRanges[0].end.line;

    this.searchResult = findForward(
      this.searchString,
      this.matchCase,
      editor,
      this.settings,
      startLine,
      endLine
    );
    this.handleSearchResults();
  }

  public findBackward(): void {
    this.currentSearchDirection = SearchDirection.BACKWARD;
    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }
    const startLine = editor.selection.start.line;
    const endLine = editor.visibleRanges[0].start.line;

    this.searchResult = findBackward(
      this.searchString,
      this.matchCase,
      editor,
      this.settings,
      startLine,
      endLine
    );
    this.handleSearchResults();
  }

  public findEntireView(): void {
    this.currentSearchDirection = SearchDirection.ENTIRE;
    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }

    const startLine = editor.visibleRanges[0].start.line;
    const endLine = editor.visibleRanges[0].end.line;

    this.searchResult = findEntireView(
      this.searchString,
      this.matchCase,
      editor,
      this.settings,
      startLine,
      endLine
    );
    this.handleSearchResults();
  }

  private handleSearchResults(): void {
    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }
    const showLabels = this.searchString.length >= 2;
    hightlight(this.searchResult, editor, showLabels);

    if (this.searchResult.length === 1) {
      editor.selections = [
        new Selection(this.searchResult[0].start, this.searchResult[0].start),
      ];
      this.close();
    }
  }
}
