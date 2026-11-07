// Render chat text with a small, safe markdown subset: ***bold+italic***,
// **bold**, *italic*, and `code`. Nodes are built from strings as React
// children (never injected as HTML), so any HTML typed by the model or the
// user is escaped by React automatically.
//
// Why this exists: Gemini answers with markdown emphasis (e.g. *Robi*,
// **skor jerawat**), but chat bubbles used to render the raw text, so the
// asterisks leaked into the visible answer. Rendering the subset keeps the
// intended emphasis and removes the stray "*" characters.
const INLINE_RE = /(\*\*\*[^*\n]+\*\*\*|\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;

export function renderChatInline(text, keyPrefix = "") {
  if (text == null) return text;
  const parts = String(text).split(INLINE_RE);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("***") && part.endsWith("***") && part.length > 6) {
      return (
        <strong key={key}>
          <em>{part.slice(3, -3)}</em>
        </strong>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
