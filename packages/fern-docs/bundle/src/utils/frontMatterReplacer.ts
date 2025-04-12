/**
 * Replaces or adds values in YAML front matter
 * @param content The full content with front matter
 * @param replacements Object with key-value pairs to replace in front matter
 * @returns Content with updated front matter
 */
export function replaceFrontMatter(
  content: string,
  replacements: Record<string, string>
): string {
  // Check if content has front matter (starts with ---)
  if (!content.trim().startsWith("---")) {
    // If no front matter exists, create one with the replacements
    const frontMatter = Object.entries(replacements)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    return `---\n${frontMatter}\n---\n\n${content}`;
  }

  // Extract front matter and content
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontMatterMatch) {
    return content; // Return original if pattern doesn't match
  }

  const [, frontMatter, mainContent] = frontMatterMatch;

  // Split front matter into lines and process each line
  const lines = (frontMatter || "")
    .split("\n")
    .filter((line) => line.trim() !== "");

  // Create a map of existing front matter
  const frontMatterMap = new Map(
    lines.map((line) => {
      const colonIndex = line.indexOf(":");
      const key =
        colonIndex > -1 ? line.slice(0, colonIndex).trim() : line.trim();
      return [key, line];
    })
  );

  // Update or add new values
  for (const [key, value] of Object.entries(replacements)) {
    frontMatterMap.set(key, `${key}: ${value}`.trim());
  }

  // Join lines back together
  const updatedFrontMatter = Array.from(frontMatterMap.values()).join("\n");

  // Reconstruct the document
  return `---\n${updatedFrontMatter}\n---\n${mainContent || ""}`;
}
