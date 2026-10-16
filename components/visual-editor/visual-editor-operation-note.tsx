interface VisualEditorOperationNoteProps {
  messages: Array<string | undefined>;
}

/** Visible explanations keep unavailable editor operations understandable. */
export function VisualEditorOperationNote({ messages }: VisualEditorOperationNoteProps) {
  const uniqueMessages = [...new Set(messages.filter((message): message is string => Boolean(message)))];
  if (!uniqueMessages.length) return null;

  return (
    <p className="visual-editor-operation-note" role="status">
      {uniqueMessages.map((message) => <span key={message}>{message}</span>)}
    </p>
  );
}
