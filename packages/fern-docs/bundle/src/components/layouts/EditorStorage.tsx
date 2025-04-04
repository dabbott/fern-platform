"use client";

import { useEffect } from "react";

import {
  HistoryEntries,
  Static,
  Type,
  createNoyaContext,
} from "@noya-app/noya-multiplayer-react";
import { MdastSelection } from "@noya-app/visual-editor";

export type EditableField = "content" | "title" | "subtitle";

export const editorStateSchema = Type.Object({
  content: Type.String(),
  title: Type.String(),
  subtitle: Type.String(),
});

export type EditorStateSchema = typeof editorStateSchema;

export type EditorState = Static<EditorStateSchema>;

export type EditorMetadata = {
  selectionBefore: MdastSelection | undefined;
  selectionAfter: MdastSelection | undefined;
  name?: string;
  timestamp: number;
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

  return (
    <Provider initialState={{ content, title, subtitle }}>{children}</Provider>
  );
}
