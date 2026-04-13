import type { EditorValidationError } from "@/lib/editor";

interface EditorErrorStateProps {
  message?: string;
  validationErrors: EditorValidationError[];
}

export function EditorErrorState({ message, validationErrors }: EditorErrorStateProps) {
  if (!message && validationErrors.length === 0) {
    return null;
  }

  return (
    <section className="editor-error-state" aria-live="assertive">
      {message ? <p>{message}</p> : null}
      {validationErrors.length > 0 ? (
        <ul>
          {validationErrors.map((error) => (
            <li key={`${error.field}-${error.message}`}>{error.message}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
