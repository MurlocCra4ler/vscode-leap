import { commands, ExtensionContext, workspace } from "vscode";
import { LeapWidget, SearchDirection } from "./leapWidget";

export interface ExtensionSettings {
  /* determines if <space><space> should only match the new Line symbol like in leap.nvim */
  whiteSpacesOnlyMatchNewLine: boolean;
  labels: string[];
}

const LABELS = [
  "s",
  "f",
  "n",
  "j",
  "k",
  "l",
  "h",
  "o",
  "d",
  "w",
  "e",
  "i",
  "m",
  "b",
  "u",
  "y",
  "v",
  "r",
  "g",
  "t",
  "a",
  "q",
  "p",
  "c",
  "x",
  "z",
];

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

function getExtensionSettings(): ExtensionSettings {
  const whiteSpacesOnlyMatchNewLine = getSetting<boolean>("whiteSpacesOnlyMatchNewLine", false);
  let labels = getSetting<string[] | null>("customLabels", null);

  // remove duplicates
  if (labels)
  {
    const cleanLabels = new Set<string>(labels);
    labels = Array.from(cleanLabels);
  }

  return {
    whiteSpacesOnlyMatchNewLine: whiteSpacesOnlyMatchNewLine,
    labels: labels ? labels : LABELS
  };
}

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand("leap.findForward", async () => {
      const settings = getExtensionSettings();
      const widgetInstance = getWidgetInstance(context, settings);
      widgetInstance.show(SearchDirection.FORWARD);
    }),

    commands.registerCommand("leap.findBackward", async () => {
      const settings = getExtensionSettings();
      const widgetInstance = getWidgetInstance(context, settings);
      widgetInstance.show(SearchDirection.BACKWARD);
    }),

    commands.registerCommand("leap.find", async () => {
      const settings = getExtensionSettings();
      const widgetInstance = getWidgetInstance(context, settings);
      widgetInstance.show(SearchDirection.ENTIRE_VIEW);
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
