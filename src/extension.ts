import { commands, ExtensionContext, workspace } from "vscode";
import { LeapWidget, SearchDirection } from "./leapWidget";

let widget: LeapWidget;

function getWidgetInstance(
  context: ExtensionContext,
  settings: ExtensionSettings
): LeapWidget {
  if (!widget || !widget.isActive) {
    widget = new LeapWidget(context, settings);
  }
  return widget;
}

export interface ExtensionSettings {
  /* determines if <space><space> should only match the new Line symbol like in leap.nvim */
  whiteSpacesOnlyMatchNewLine: boolean;
}

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand("leap.findForward", async () => {
      const settings: ExtensionSettings = {
        whiteSpacesOnlyMatchNewLine: getSetting<boolean>(
          "whiteSpacesOnlyMatchNewLine",
          false
        ),
      };
      const widgetInstance = getWidgetInstance(context, settings);
      widgetInstance.show(SearchDirection.FORWARD);
    }),

    commands.registerCommand("leap.findBackward", async () => {
      const settings: ExtensionSettings = {
        whiteSpacesOnlyMatchNewLine: getSetting<boolean>(
          "whiteSpacesOnlyMatchNewLine",
          false
        ),
      };
      const widgetInstance = getWidgetInstance(context, settings);
      widgetInstance.show(SearchDirection.BACKWARD);
    }),

    commands.registerCommand("leap.find", async () => {
      const settings: ExtensionSettings = {
        whiteSpacesOnlyMatchNewLine: getSetting<boolean>(
          "whiteSpacesOnlyMatchNewLine",
          false
        ),
      };
      const widgetInstance = getWidgetInstance(context, settings);
      widgetInstance.show(SearchDirection.FORWARD);
    }),

    commands.registerCommand("leap.match-case", async () => {
      if (widget && widget.isActive) {
        widget.toggleMatchCase();
      }
    })
  );
}

function getSetting<Type>(settingName: string, defaultValue: Type): Type {
  const workspaceConfig = workspace.getConfiguration("leap");
  const settingValue: Type | undefined = workspaceConfig.get(settingName);
  return settingValue ? settingValue : defaultValue;
}
