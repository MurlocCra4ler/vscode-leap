import { window, QuickPick, QuickPickItem, QuickInputButton, ThemeIcon, Range, ExtensionContext, Selection } from "vscode";
import { ExtensionSettings, SearchDirection } from "./extension";
import { find, hightlight } from "./find";

const MATCH_CASE_KEY = 'match-case';

export class LeapWidget {
    public isActive = true;

    private matchCase: boolean = false;
    private direction: SearchDirection;
    private searchString = '';
    private searchResult: Range[] = [];

    private readonly quickPick: QuickPick<QuickPickItem> = window.createQuickPick();
    private quickInputButtons: Map<QuickInputButton, () => void> = new Map();

    constructor(private readonly context: ExtensionContext, private readonly settings: ExtensionSettings) {
        this.quickPick.title = 'Leap Finder';
        this.quickPick.placeholder = 'Find';

        this.matchCase = !!this.context.globalState.get<boolean>(MATCH_CASE_KEY);
        this.direction = "both";
        this.createButtons();

        this.quickPick.onDidTriggerButton(this.onDidTriggerButton.bind(this));
        this.quickPick.onDidChangeValue(this.onChangeValue.bind(this));
        this.quickPick.onDidHide(this.hide.bind(this));
    }

    public setSearchDirection(direction: SearchDirection) {
        this.direction = direction;
    }

    public show(): void {
        if (!this.isActive) {
            console.error('show: Leapwidget has already been disposed!');
            return;
        }

        this.quickPick.show();
    }

    public close(): void {
        this.hide();
        this.quickPick.dispose();
        this.isActive = false;
        this.context.globalState.update(MATCH_CASE_KEY, this.matchCase);
    }

    public toggleMatchCase(): void {
        if (!this.isActive) {
            console.error('toggleMatchCase: Leapwidget has already been disposed!');
            return;
        }

        this.matchCase = !this.matchCase;
        this.createButtons();
        this.createSearch();
    }

    private createButtons(): void {
        this.quickInputButtons = new Map<QuickInputButton, () => void>([
            [{ 
                iconPath: this.matchCase ? new ThemeIcon('preserve-case') : new ThemeIcon('case-sensitive'), 
                tooltip: this.matchCase ? 'Match Case (Alt + C)' : 'Don\'t Match Case (Alt + C)'
            }, this.toggleMatchCase.bind(this)],
            [{ 
                iconPath: new ThemeIcon('widget-close'), 
                tooltip: 'Close (Escape)' 
            }, this.close.bind(this)]
        ]);
        this.quickPick.buttons = [...this.quickInputButtons.keys()];
    }

    private createSearch() {
        const editor = window.activeTextEditor;
        if (!editor) {
            return;
        }

        this.searchResult = find(this.searchString, this.matchCase, this.direction, editor, this.settings);
        const showLabels = this.searchString.length >= 2;
        hightlight(this.searchResult, editor, showLabels);

        if (this.searchResult.length === 1) {
            editor.selections = [new Selection(this.searchResult[0].start, this.searchResult[0].start)];
            this.close();
        }
    }

    private hide(): void {
        if (!this.isActive) {
            console.error('hide: Leapwidget has already been disposed!');
            return;
        }

        const editor = window.activeTextEditor;
        if (editor) {
            hightlight([], editor, false);
        }
    }

    private onChangeValue(value: string): void {
        this.searchString = value;
        this.createSearch();
    }

    private onDidTriggerButton(button: QuickInputButton): void {
        this.quickInputButtons.get(button)?.();
    }
}