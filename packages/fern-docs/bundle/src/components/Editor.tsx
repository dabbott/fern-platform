"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  HistoryEntries,
  HistoryEntry as HistoryEntryType,
  MultiplayerStateManager,
  useObservable,
} from "@noya-app/noya-multiplayer-react";
import { VRange } from "@noya-app/visual-editor";

import { replaceFrontMatter } from "@/utils/frontMatterReplacer";

export declare namespace Editor {
  export interface Props {
    children: React.ReactNode;
    content: string;
    title: string;
    subtitle?: string;
  }

  export type FieldName = "content" | "title" | "subtitle";

  export type FieldState = {
    value: string;
    selection: VRange | null;
    setValue: (value: string, params: unknown) => void;
    setSelection: (selection: VRange | null) => void;
  };

  export type ContextValue = {
    content: FieldState;
    title: FieldState;
    subtitle: FieldState;
    undo: () => void;
    redo: () => void;
  };

  export type Metadata = {
    id: string;
    name?: string;
    timestamp: number;
    selectionBefore?: VRange | null;
    selectionAfter?: VRange | null;
    editorField?: FieldName;
  };

  export type State = {
    content: string;
    title: string;
    subtitle: string;
  };

  export type HistoryEntry = HistoryEntryType<State, Metadata>;
}

const EditorContext = createContext<Editor.ContextValue | undefined>(undefined);

const initialSelections: Record<Editor.FieldName, VRange | null> = {
  content: null,
  title: null,
  subtitle: null,
};

export const useEditor = () => {
  const context = useContext(EditorContext);

  if (!context) {
    throw new Error("useEditorContext must be used within an EditorContext");
  }

  return context;
};

export function EditorProvider({
  children,
  content,
  title,
  subtitle = "",
}: Editor.Props) {
  useCssVariables();

  const [stateManager] = useState(
    () =>
      new MultiplayerStateManager<Editor.State, Editor.Metadata>(
        { content, title, subtitle },
        { mode: "standalone", mergeHistoryEntries }
      )
  );

  const [selections, setSelections] =
    useState<Record<Editor.FieldName, VRange | null>>(initialSelections);

  const state = useObservable(stateManager.optimisticState$);

  const undo = useCallback(() => {
    const historyEntry = stateManager.undo();

    if (historyEntry) {
      const { editorField, selectionBefore } = historyEntry.metadata;

      if (!editorField) return;

      setSelections({
        ...initialSelections,
        [editorField]: selectionBefore,
      });
    }
  }, [stateManager]);

  const redo = useCallback(() => {
    const historyEntry = stateManager.redo();

    if (historyEntry) {
      const { editorField, selectionAfter } = historyEntry.metadata;

      if (!editorField) return;

      setSelections({
        ...initialSelections,
        [editorField]: selectionAfter,
      });
    }
  }, [stateManager]);

  const contextValue = useMemo(() => {
    const setSelection =
      (field: Editor.FieldName) => (selection: VRange | null) => {
        setSelections({
          ...initialSelections,
          [field]: selection,
        });
      };

    const setValue =
      (field: Editor.FieldName) => (value: string, params: any) => {
        stateManager.setState(params, (state) => ({
          ...state,
          [field]: value,
        }));
      };

    return {
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
      undo,
      redo,
    };
  }, [state, selections, undo, redo, stateManager]);

  const resultMdxValue = useMemo(
    () =>
      replaceFrontMatter(state.content, {
        title: state.title,
        subtitle: state.subtitle,
      }),
    [state]
  );

  console.debug("mdx:", resultMdxValue);

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}

function mergeHistoryEntries({
  previous,
  next,
}: {
  previous: Editor.HistoryEntry;
  next: Editor.HistoryEntry;
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
