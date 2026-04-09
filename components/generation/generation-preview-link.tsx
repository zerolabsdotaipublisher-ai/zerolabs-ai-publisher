import Link from "next/link";

interface GenerationPreviewLinkProps {
  href?: string;
  onClick?: () => void;
}

export function GenerationPreviewLink({ href, onClick }: GenerationPreviewLinkProps) {
  if (!href) {
    return null;
  }

  return (
    <Link href={href} onClick={onClick}>
      Open generated website preview
    </Link>
  );
}
