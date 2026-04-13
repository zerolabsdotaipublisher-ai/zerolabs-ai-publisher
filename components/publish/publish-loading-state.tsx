import type { PublishAction } from "@/lib/publish";

interface PublishLoadingStateProps {
  action: PublishAction;
}

export function PublishLoadingState({ action }: PublishLoadingStateProps) {
  return (
    <p className="publish-loading-state" role="status" aria-live="polite" aria-busy="true">
      {action === "publish" ? "Publishing website…" : "Updating live website…"}
    </p>
  );
}
