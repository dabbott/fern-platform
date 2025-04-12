import remarkFrontmatter from "remark-frontmatter";
import remarkGemoji from "remark-gemoji";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkSmartypants from "remark-smartypants";
import remarkSqueezeParagraphs from "remark-squeeze-paragraphs";

import type { PluggableList } from "@fern-docs/mdx";
import { remarkInjectEsm, remarkSanitizeAcorn } from "@fern-docs/mdx/plugins";

import { remarkExtractTitle } from "../plugins/remark-extract-title";

export function getRemarkPlugins(
  scope?: Record<string, unknown>
): PluggableList {
  return [
    remarkFrontmatter,
    remarkExtractTitle,
    [remarkMdxFrontmatter, { name: "frontmatter" }],
    remarkSqueezeParagraphs,
    [remarkInjectEsm, { scope }],
    [remarkSanitizeAcorn],
    remarkGfm,
    remarkSmartypants,
    remarkMath,
    remarkGemoji,
  ];
}
