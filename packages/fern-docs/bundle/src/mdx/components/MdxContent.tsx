"use client";

import React, { useEffect, useState } from "react";

import { useKeyboardShortcuts } from "@noya-app/noya-keymap";
import { HistoryEntries, useNoyaState } from "@noya-app/noya-multiplayer-react";
import { MdastSelection, VisualMdxEditor } from "@noya-app/visual-editor";
import "@noya-app/visual-editor/index.css";

import { Mdast } from "@fern-docs/mdx";

import { ErrorBoundary } from "@/components/error-boundary";

import { parseMDX, stringifyMDX } from "../bundler/client-serialize";
import { MdxComponent } from "../bundler/component";
import { getRemarkPlugins } from "../bundler/remark-plugins";
import { createMdxComponents } from "./index";

const parseMdast = (mdx: string) => {
  return parseMDX({
    mdx,
    remarkPlugins: getRemarkPlugins(),
  });
};

const stringifyMdast = (mdast: Mdast.Node) => {
  return stringifyMDX({
    mdast,
    remarkPlugins: getRemarkPlugins(),
  });
};

type MarkdownText = string | { code: string; jsxElements: string[] };

export declare namespace MdxContent {
  export interface Props {
    mdx: MarkdownText | MarkdownText[] | undefined;
    fallback?: React.ReactNode;
    editable?: boolean;
  }
}

function isMdxEmpty(mdx: MarkdownText | MarkdownText[] | undefined): boolean {
  if (!mdx) {
    return true;
  }

  if (typeof mdx === "string") {
    return mdx.trim().length === 0;
  }

  if (Array.isArray(mdx)) {
    return mdx.length === 0 || mdx.every(isMdxEmpty);
  }

  return mdx.code.trim().length === 0;
}

const variableMapping = {
  "--n-primary-pastel": "var(--accent-a3)",
  "--n-primary": "var(--accent-a7)",
  "--n-popover-background":
    "light-dark(var(--grayscale-11), var(--grayscale-2))",
};

type VisualEditorState = {
  content: string;
};

type VisualEditorMetadata = {
  selectionBefore: MdastSelection | undefined;
  selectionAfter: MdastSelection | undefined;
};

export function MdxContent({ mdx, fallback, editable }: MdxContent.Props) {
  const isEditableHash = useIsEditable();
  const isEditable = editable && isEditableHash;

  if (isMdxEmpty(mdx) || mdx == null) {
    return fallback;
  }

  if (typeof mdx === "string") {
    return mdx;
  }

  if (Array.isArray(mdx)) {
    return (
      <>
        {mdx.map((mdx, index) => (
          <MdxContent key={index} mdx={mdx} />
        ))}
      </>
    );
  }

  if (isEditable) {
    return (
      <EditableMdxContent mdx={mdx} fallback={fallback} editable={editable} />
    );
  }

  return (
    <ErrorBoundary>
      <MdxComponent {...mdx} />
    </ErrorBoundary>
  );
}

function EditableMdxContent({ mdx, fallback }: MdxContent.Props) {
  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.dataset.theme = "dark";

      for (const [key, value] of Object.entries(variableMapping)) {
        document.documentElement.style.setProperty(key, value);
      }
    }
  }, []);

  const [state, setState, { noyaManager }] = useNoyaState<
    VisualEditorState,
    VisualEditorMetadata
  >(
    {
      content: fallback?.toString() ?? "",
    },
    {
      inspector: true,
      mergeHistoryEntries({ previous, next }) {
        if (
          previous.metadata.name !== undefined &&
          previous.metadata.name === next.metadata.name &&
          previous.metadata.timestamp + 500 > next.metadata.timestamp
        ) {
          const newHistoryEntry = HistoryEntries.merge({ previous, next });
          newHistoryEntry.metadata.selectionBefore =
            previous.metadata.selectionBefore;
          newHistoryEntry.metadata.selectionAfter =
            next.metadata.selectionAfter;
          return newHistoryEntry;
        }

        return undefined;
      },
    }
  );

  const [selection, setSelection] = useState<MdastSelection | undefined>(
    undefined
  );

  console.log({ content: state.content, selection });

  useKeyboardShortcuts({
    "Mod-z": {
      allowInInput: true,
      command: () => {
        if (noyaManager.multiplayerStateManager.canUndo()) {
          noyaManager.multiplayerStateManager.undo();
          console.log("undo");
          const stateManager = noyaManager.multiplayerStateManager.sm;
          const history = stateManager.history;
          const lastEntry = history[stateManager.historyIndex];
          if (lastEntry) {
            setSelection(lastEntry.metadata.selectionBefore);
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
            setSelection(lastEntry.metadata.selectionAfter);
          }
        }
      },
    },
  });

  if (!mdx || typeof mdx === "string") {
    return mdx;
  }

  const jsxElements = "jsxElements" in mdx ? mdx.jsxElements : [];

  return (
    <ErrorBoundary>
      <VisualMdxEditor
        mdx={state.content}
        onChangeMdx={(mdx, params) =>
          setState(params, {
            content: mdx,
          })
        }
        parseMdast={parseMdast}
        stringifyMdast={stringifyMdast}
        components={createMdxComponents(jsxElements) as any}
        selection={selection}
        onChangeSelection={setSelection}
      />
    </ErrorBoundary>
  );
}

function isEditHashUrl(): boolean {
  return window.location.hash.includes("edit=1");
}

function useIsEditable(): boolean {
  const [isEdit, setIsEdit] = useState<boolean>(false);

  useEffect(() => {
    setIsEdit(isEditHashUrl());

    const hashChangeHandler = () => {
      setIsEdit(isEditHashUrl());
    };

    window.addEventListener("hashchange", hashChangeHandler);

    return () => {
      window.removeEventListener("hashchange", hashChangeHandler);
    };
  }, []);

  return isEdit;
}
