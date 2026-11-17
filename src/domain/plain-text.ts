const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

export function plainText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<(br|\/?(p|div|li|ul|ol|h[1-6]|blockquote|tr|td|th))\b[^>]*>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}
