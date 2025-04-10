"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useKeyboardShortcuts } from "@noya-app/noya-keymap";
import {
  HistoryEntries,
  HistoryEntry,
  MultiplayerStateManager,
  Static,
  Type,
  useObservable,
} from "@noya-app/noya-multiplayer-react";
import { VRange } from "@noya-app/visual-editor";

import { replaceFrontMatter } from "@/utils/frontMatterReplacer";

export type EditorField = "content" | "title" | "subtitle";

type EditorFieldState = {
  value: string;
  selection: VRange | null;
  setValue: (value: string, params: any) => void;
  setSelection: (selection: VRange | null) => void;
};

export const editorStateSchema = Type.Object({
  content: Type.String(),
  title: Type.String(),
  subtitle: Type.String(),
});

type EditorContextValue = {
  content: EditorFieldState;
  title: EditorFieldState;
  subtitle: EditorFieldState;
};

export const EditorContext = createContext<EditorContextValue | undefined>(
  undefined
);

export const useEditorContext = () => {
  const context = useContext(EditorContext);

  if (!context) {
    throw new Error("useEditorContext must be used within an EditorContext");
  }

  return context;
};

export type EditorState = Static<typeof editorStateSchema>;

export type EditorMetadata = {
  id: string;
  name?: string;
  timestamp: number;
  selectionBefore?: VRange | null;
  selectionAfter?: VRange | null;
  editorField?: EditorField;
};

type EditorHistoryEntry = HistoryEntry<EditorState, EditorMetadata>;

function mergeHistoryEntries({
  previous,
  next,
}: {
  previous: EditorHistoryEntry;
  next: EditorHistoryEntry;
}) {
  if (
    previous.metadata.name !== undefined &&
    previous.metadata.name === next.metadata.name &&
    previous.metadata.editorField === next.metadata.editorField &&
    previous.metadata.timestamp + 500 > next.metadata.timestamp
  ) {
    const newHistoryEntry = HistoryEntries.merge({ previous, next });
    newHistoryEntry.metadata.selectionBefore =
      previous.metadata.selectionBefore;
    newHistoryEntry.metadata.selectionAfter = next.metadata.selectionAfter;
    return newHistoryEntry;
  }

  return undefined;
}

const variableMapping = {
  "--n-primary-pastel": "var(--accent-a3)",
  "--n-primary": "var(--accent-a7)",
  "--n-popover-background":
    "light-dark(var(--grayscale-11), var(--grayscale-2))",
};

function useCssVariables() {
  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.dataset.theme = "dark";

      for (const [key, value] of Object.entries(variableMapping)) {
        document.documentElement.style.setProperty(key, value);
      }
    }
  }, []);
}

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
  useCssVariables();

  const [stateManager] = useState(
    () =>
      new MultiplayerStateManager<EditorState, EditorMetadata>(
        { content, title, subtitle },
        { autoConnect: true, schema: editorStateSchema, mergeHistoryEntries }
      )
  );

  const [selections, setSelections] = useState<
    Record<EditorField, VRange | null>
  >({
    content: null,
    title: null,
    subtitle: null,
  });

  const setValue = useCallback(
    (field: EditorField) => (value: string, params: any) => {
      stateManager.setState(params, (state) => ({
        ...state,
        [field]: value,
      }));
    },
    [stateManager]
  );

  const setSelection = (field: EditorField) => (selection: VRange | null) => {
    setSelections((selections) => ({
      ...selections,
      [field]: selection,
    }));
  };

  const state = useObservable(stateManager.optimisticState$);

  const contextValue = useMemo(
    () => ({
      content: {
        value: state.content,
        selection: selections.content,
        setValue: setValue("content"),
        setSelection: setSelection("content"),
      },
      title: {
        value: state.title,
        selection: selections.title,
        setValue: setValue("title"),
        setSelection: setSelection("title"),
      },
      subtitle: {
        value: state.subtitle,
        selection: selections.subtitle,
        setValue: setValue("subtitle"),
        setSelection: setSelection("subtitle"),
      },
    }),
    [state, selections, setValue]
  );

  const resultMdxValue = useMemo(
    () =>
      replaceFrontMatter(state.content, {
        title: state.title,
        subtitle: state.subtitle,
      }),
    [state]
  );

  console.debug("mdx:", resultMdxValue);

  useKeyboardShortcuts({
    "Mod-z": {
      allowInInput: true,
      command: () => {
        if (!stateManager.canUndo()) return;

        const historyEntry = stateManager.undo();

        if (historyEntry) {
          setSelections((selections) => ({
            ...selections,
            [historyEntry.metadata.editorField as EditorField]:
              historyEntry.metadata.selectionBefore,
          }));
        }
      },
    },
    "Mod-Shift-z": {
      allowInInput: true,
      command: () => {
        if (!stateManager.canRedo()) return;

        const historyEntry = stateManager.redo();

        if (historyEntry) {
          setSelections((selections) => ({
            ...selections,
            [historyEntry.metadata.editorField as EditorField]:
              historyEntry.metadata.selectionAfter,
          }));
        }
      },
    },
  });

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}
