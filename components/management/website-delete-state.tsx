interface WebsiteDeleteStateProps {
  deleting: boolean;
  error?: string;
}

export function WebsiteDeleteState({ deleting, error }: WebsiteDeleteStateProps) {
  if (deleting) {
    return <p className="website-delete-state website-delete-state-pending">Deleting website…</p>;
  }

  if (error) {
    return <p className="website-delete-state website-delete-state-error">{error}</p>;
  }

  return null;
}
