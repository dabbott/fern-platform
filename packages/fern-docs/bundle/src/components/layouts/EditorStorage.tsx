"use client";

import { createContext, useEffect, useState } from "react";

import { useKeyboardShortcuts } from "@noya-app/noya-keymap";
import {
  HistoryEntries,
  Static,
  Type,
  createNoyaContext,
} from "@noya-app/noya-multiplayer-react";
import { VRange } from "@noya-app/visual-editor";

export type EditableField = "content" | "title" | "subtitle";

export const editorStateSchema = Type.Object({
  content: Type.String(),
  title: Type.String(),
  subtitle: Type.String(),
});

type EditorSelection = {
  content: VRange | null;
  title: VRange | null;
  subtitle: VRange | null;
};

export const EditorSelectionContext = createContext<EditorSelection>({
  content: null,
  title: null,
  subtitle: null,
});

export type EditorStateSchema = typeof editorStateSchema;

export type EditorState = Static<EditorStateSchema>;

export type EditorMetadata = {
  selectionBefore: VRange | null;
  selectionAfter: VRange | null;
  name?: string;
  timestamp: number;
  editableField: EditableField;
};

export const { Provider, useValueState, useNoyaManager } = createNoyaContext<
  EditorStateSchema,
  EditorMetadata
>({
  schema: editorStateSchema,
  mergeHistoryEntries({ previous, next }) {
    if (
      previous.metadata.name !== undefined &&
      previous.metadata.name === next.metadata.name &&
      previous.metadata.editableField === next.metadata.editableField &&
      previous.metadata.timestamp + 500 > next.metadata.timestamp
    ) {
      const newHistoryEntry = HistoryEntries.merge({ previous, next });
      newHistoryEntry.metadata.selectionBefore =
        previous.metadata.selectionBefore;
      newHistoryEntry.metadata.selectionAfter = next.metadata.selectionAfter;
      return newHistoryEntry;
    }

    return undefined;
  },
});

const variableMapping = {
  "--n-primary-pastel": "var(--accent-a3)",
  "--n-primary": "var(--accent-a7)",
  "--n-popover-background":
    "light-dark(var(--grayscale-11), var(--grayscale-2))",
};

export function EditorStorage({
  children,
  content,
  title,
  subtitle = "",
}: {
  children: React.ReactNode;
  content: string;
  title: string;
  subtitle?: string;
}) {
  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.dataset.theme = "dark";

      for (const [key, value] of Object.entries(variableMapping)) {
        document.documentElement.style.setProperty(key, value);
      }
    }
  }, []);

  const [selection, setSelection] = useState<{
    content: VRange | null;
    title: VRange | null;
    subtitle: VRange | null;
  }>({
    content: null,
    title: null,
    subtitle: null,
  });

  return (
    <Provider
      initialState={{ content, title, subtitle }}
      inspector={{
        colorScheme: "dark",
        anchor: "bottom right",
      }}
    >
      <EditorSelectionContext.Provider value={selection}>
        <Behavior setSelection={setSelection} />
        {children}
      </EditorSelectionContext.Provider>
    </Provider>
  );
}

function Behavior({
  setSelection,
}: {
  setSelection: React.Dispatch<React.SetStateAction<EditorSelection>>;
}) {
  const noyaManager = useNoyaManager();

  useKeyboardShortcuts({
    "Mod-z": {
      allowInInput: true,
      command: () => {
        if (noyaManager.multiplayerStateManager.canUndo()) {
          noyaManager.multiplayerStateManager.undo();
          const stateManager = noyaManager.multiplayerStateManager.sm;
          const history = stateManager.history;
          const lastEntry = history[stateManager.historyIndex];
          if (lastEntry) {
            setSelection((selection) => ({
              ...selection,
              [lastEntry.metadata.editableField as keyof EditorSelection]:
                lastEntry.metadata.selectionBefore,
            }));
          }
        }
      },
    },
    "Mod-Shift-z": {
      allowInInput: true,
      command: () => {
        if (noyaManager.multiplayerStateManager.canRedo()) {
          noyaManager.multiplayerStateManager.redo();
          const stateManager = noyaManager.multiplayerStateManager.sm;
          const history = stateManager.history;
          const lastEntry = history[stateManager.historyIndex - 1];
          if (lastEntry) {
            setSelection((selection) => ({
              ...selection,
              [lastEntry.metadata.editableField as keyof EditorSelection]:
                lastEntry.metadata.selectionAfter,
            }));
          }
        }
      },
    },
  });

  return <></>;
}
