import { remark } from "remark";
import remarkMDX from "remark-mdx";

import { Mdast, PluggableList } from "@fern-docs/mdx";

export function parseMDX({
  mdx,
  remarkPlugins,
}: {
  mdx: string;
  remarkPlugins: PluggableList;
}) {
  let parser = remark().use(remarkMDX);
  parser = parser.use(remarkPlugins);
  return parser.parse(mdx);
}

export function stringifyMDX({
  mdast,
  remarkPlugins,
}: {
  mdast: Mdast.Node;
  remarkPlugins: PluggableList;
}) {
  let processor = remark().use(remarkMDX);
  processor = processor.use(remarkPlugins);
  return processor.stringify(mdast as Mdast.Root);
}
