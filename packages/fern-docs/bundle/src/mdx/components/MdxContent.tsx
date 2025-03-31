"use client";

import React, { useEffect, useState } from "react";

import { VisualMdxEditor } from "@noya-app/visual-editor";
import "@noya-app/visual-editor/index.css";

import { Mdast } from "@fern-docs/mdx";

import { ErrorBoundary } from "@/components/error-boundary";

import { parseMDX, stringifyMDX } from "../bundler/client-serialize";
import { MdxComponent } from "../bundler/component";
import { getRemarkPlugins } from "../bundler/remark-plugins";
import { createMdxComponents } from "./index";

type MarkdownText = string | { code: string; jsxElements: string[] };

export declare namespace MdxContent {
  export interface Props {
    mdx: MarkdownText | MarkdownText[] | undefined;
    fallback?: React.ReactNode;
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

export function MdxContent({ mdx, fallback }: MdxContent.Props) {
  const isEditable = useIsEditable();

  const [contentString, setContentString] = useState<string>(
    fallback?.toString() ?? ""
  );

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
    const jsxElements = "jsxElements" in mdx ? mdx.jsxElements : [];

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

    return (
      <ErrorBoundary>
        <VisualMdxEditor
          data-theme="dark"
          mdx={contentString}
          onChangeMdx={setContentString}
          parseMdast={parseMdast}
          stringifyMdast={stringifyMdast}
          components={createMdxComponents(jsxElements) as any}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <MdxComponent {...mdx} />
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
