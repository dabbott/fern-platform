import { remark } from "remark";
import remarkMDX from "remark-mdx";

import { Mdast } from "@fern-docs/mdx";

import { getRemarkPlugins } from "./remark-plugins";

export function parseMdast(mdx: string) {
  let parser = remark().use(remarkMDX);
  parser = parser.use(getRemarkPlugins());
  return parser.parse(mdx);
}

export function stringifyMdast(mdast: Mdast.Root) {
  let processor = remark().use(remarkMDX);
  processor = processor.use(getRemarkPlugins());
  return processor.stringify(mdast);
}
