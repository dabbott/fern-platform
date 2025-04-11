"use client";

import React, {
  DetailedHTMLProps,
  HTMLAttributes,
  useEffect,
  useState,
} from "react";

import { MdxEditor } from "@noya-app/visual-editor";
import "@noya-app/visual-editor/index.css";

import { Mdast } from "@fern-docs/mdx";

import { ErrorBoundary } from "@/components/error-boundary";
import {
  EditorField,
  useEditorContext,
} from "@/components/layouts/EditorStorage";

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
    editorField?: EditorField;
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

export function MdxContent({ mdx, fallback, editorField }: MdxContent.Props) {
  const isEditableHash = useIsEditable();
  const isEditable = editorField && isEditableHash;

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

  if (isEditable && editorField) {
    return <EditableMdxContent mdx={mdx} editorField={editorField} />;
  }

  return (
    <ErrorBoundary>
      <MdxComponent {...mdx} />
    </ErrorBoundary>
  );
}

const EditorRoot = (
  props: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
) => {
  return <div {...props} className={(props.className || "") + " -mx-2 px-2"} />;
};

function EditableMdxContent({ mdx, editorField }: MdxContent.Props) {
  const contextValue = useEditorContext();
  const {
    undo,
    redo,
    [editorField as EditorField]: { value, selection, setValue, setSelection },
  } = contextValue;

  if (!mdx || typeof mdx === "string") {
    return mdx;
  }

  const jsxElements = "jsxElements" in mdx ? mdx.jsxElements : [];
  const components = {
    ...createMdxComponents(jsxElements),
    EditorRoot,
  };

  const placeholder =
    editorField === "title"
      ? "Title"
      : editorField === "subtitle"
        ? "Subtitle"
        : undefined;

  return (
    <ErrorBoundary>
      <MdxEditor
        preset={editorField === "content" ? "rich-text" : "single-line"}
        placeholder={placeholder}
        mdx={value}
        onChangeMdx={(mdx, params) => setValue(mdx, { ...params, editorField })}
        parseMdast={parseMdast}
        stringifyMdast={stringifyMdast}
        components={components}
        selection={selection}
        onChangeSelection={setSelection}
        onUndo={undo}
        onRedo={redo}
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
