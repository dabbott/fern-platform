"use client";

import React, { useEffect, useState } from "react";

import { MdastSelection, VisualMdxEditor } from "@noya-app/visual-editor";
import "@noya-app/visual-editor/index.css";

import { Mdast } from "@fern-docs/mdx";

import { ErrorBoundary } from "@/components/error-boundary";
import {
  EditableField,
  EditorMetadata,
  useValueState,
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
    editableField?: EditableField;
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

export function MdxContent({ mdx, fallback, editableField }: MdxContent.Props) {
  const isEditableHash = useIsEditable();
  const isEditable = editableField && isEditableHash;

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

  if (isEditable && editableField) {
    return <EditableMdxContent mdx={mdx} editableField={editableField} />;
  }

  return (
    <ErrorBoundary>
      <MdxComponent {...mdx} />
    </ErrorBoundary>
  );
}

function EditableMdxContent({ mdx, editableField }: MdxContent.Props) {
  const [content, setContent] = useValueState(editableField);
  const [selection, setSelection] = useState<MdastSelection | undefined>();

  if (!mdx || typeof mdx === "string") {
    return mdx;
  }

  const jsxElements = "jsxElements" in mdx ? mdx.jsxElements : [];

  return (
    <ErrorBoundary>
      <VisualMdxEditor
        mdx={content}
        onChangeMdx={(mdx, params) =>
          setContent({ ...params, editableField } as EditorMetadata, mdx)
        }
        parseMdast={parseMdast}
        stringifyMdast={stringifyMdast}
        components={createMdxComponents(jsxElements)}
        selection={selection}
        onChangeSelection={setSelection}
        showSelectionToolbar={editableField === "content"}
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
