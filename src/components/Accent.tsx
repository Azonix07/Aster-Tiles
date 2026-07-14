import { Fragment } from "react";

/**
 * Renders admin-editable headline copy: *word* becomes the brand-green
 * emphasis (same typeface and weight — colour only) and newlines become
 * line breaks.
 */
export function Accent({
  text,
  accentClass = "not-italic text-green",
}: {
  text: string;
  accentClass?: string;
}) {
  return (
    <>
      {text.split("\n").map((line, li, lines) => (
        <Fragment key={li}>
          {line.split(/(\*[^*]+\*)/g).map((part, pi) =>
            part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
              <em key={pi} className={accentClass}>
                {part.slice(1, -1)}
              </em>
            ) : (
              <Fragment key={pi}>{part}</Fragment>
            ),
          )}
          {li < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  );
}
