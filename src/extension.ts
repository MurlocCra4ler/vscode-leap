import { commands, ExtensionContext } from 'vscode';
import { LeapWidget } from './leapWidget';

let widget: LeapWidget | undefined;

export function activate(context: ExtensionContext) {
	context.subscriptions.push(...[
		commands.registerCommand('leap.find', async () => {
			widget = new LeapWidget(context);
			widget.show();
		}),
		commands.registerCommand('leap.match-case', async () => {
			if (widget && widget.isActive) {
				widget.toggleMatchCase();
			}
		})
	]);
}