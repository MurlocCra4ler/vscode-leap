import { commands, ExtensionContext, workspace } from 'vscode';
import { LeapWidget } from './leapWidget';

let widget: LeapWidget | undefined;

export interface ExtensionSettings {
	/* determines if <space><space> should only match the new Line symbol like in leap.nvim */
	whiteSpacesOnlyMatchNewLine: boolean
}

export function activate(context: ExtensionContext) {
	context.subscriptions.push(...[
		commands.registerCommand('leap.find', async () => {
			const workspaceConfig = workspace.getConfiguration('leap');
			const settings: ExtensionSettings = {
				whiteSpacesOnlyMatchNewLine: getSetting<boolean>('whiteSpacesOnlyMatchNewLine', false)
			};

			widget = new LeapWidget(context, settings);
			widget.show();
		}),
		commands.registerCommand('leap.match-case', async () => {
			if (widget && widget.isActive) {
				widget.toggleMatchCase();
			}
		})
	]);
}

function getSetting<Type>(settingName: string, defaultValue: Type): Type {
	const workspaceConfig = workspace.getConfiguration('leap');
	const settingValue: Type | undefined = workspaceConfig.get(settingName);
	return settingValue ? settingValue : defaultValue;
}