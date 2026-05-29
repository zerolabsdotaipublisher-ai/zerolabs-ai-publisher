import { clampRevisionPage, clampRevisionPerPage } from "./model";

export interface RevisionListQuery {
  page: number;
  perPage: number;
}

function parsePositiveInt(value: string | null | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return undefined;
  }

  return parsed;
}

export function normalizeRevisionContentIdParam(value: string): string {
  return decodeURIComponent(value).trim();
}

export function parseRevisionListQuery(searchParams: URLSearchParams): RevisionListQuery {
  return {
    page: clampRevisionPage(parsePositiveInt(searchParams.get("page"))),
    perPage: clampRevisionPerPage(parsePositiveInt(searchParams.get("perPage"))),
  };
}

export interface RevisionCompareBody {
  leftRevisionId: string;
  rightRevisionId: string;
}

export function parseRevisionCompareBody(body: unknown): RevisionCompareBody | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  const leftRevisionId = typeof record.leftRevisionId === "string" ? record.leftRevisionId.trim() : "";
  const rightRevisionId = typeof record.rightRevisionId === "string" ? record.rightRevisionId.trim() : "";

  if (!leftRevisionId || !rightRevisionId) {
    return null;
  }

  return {
    leftRevisionId,
    rightRevisionId,
  };
}

export interface RevisionRestoreBody {
  revisionId: string;
  confirm: boolean;
}

export function parseRevisionRestoreBody(body: unknown): RevisionRestoreBody | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  const revisionId = typeof record.revisionId === "string" ? record.revisionId.trim() : "";
  const confirm = record.confirm === true;

  if (!revisionId || !confirm) {
    return null;
  }

  return { revisionId, confirm };
}
