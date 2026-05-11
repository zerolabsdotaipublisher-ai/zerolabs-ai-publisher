import "server-only";

import { toMediaApiRecord } from "@/lib/media/model";
import { deleteOwnedMedia, uploadOwnedMedia, createOwnedMediaSignedUrl } from "@/lib/media/workflow";
import { getOwnedMediaAsset } from "@/lib/media/storage";
import { resolveTenantId } from "@/lib/media/model";
import {
  assertStorageResourcePermission,
  assertStorageUploadPermission,
  buildStoragePermissionMatrix,
  createResourceUserStorageActor,
  createScopedUserStorageActor,
  type StorageAccessResourceRecord,
} from "@/lib/storage-access";
import { buildFileUploadAssociationSummary } from "./associations";
import { createFileUploadLifecycleEvent, transitionFileUpload } from "./lifecycle";
import {
  createFileUploadAssociationRecord,
  createNewFileUploadRecord,
  inferUsageContextFromSource,
  toFileUploadApiRecord,
  toFileUploadAssociationApiRecord,
} from "./model";
import { logFileUploadEvent, logFileUploadFailure, recordFileUploadDuration } from "./monitoring";
import {
  createFileUploadRecord,
  getOwnedFileUploadRecord,
  listOwnedFileUploadAssociations,
  saveFileUploadAssociation,
  updateFileUploadRecord,
} from "./storage";
import { validateFileUploadInput } from "./validation";
import type {
  FileUploadBatchInput,
  FileUploadBatchItemResult,
  FileUploadDetailResult,
  FileUploadInput,
  FileUploadRecord,
  FileUploadResult,
} from "./types";

function toFileUploadResource(record: FileUploadRecord): StorageAccessResourceRecord {
  return {
    resourceType: "file_upload",
    resourceId: record.id,
    ownerUserId: record.userId,
    tenantId: record.tenantId,
    mediaId: record.mediaId,
    linkedContentId: record.linkedContentId,
    linkedContentType: record.linkedContentType,
    status: record.status,
    visibility: "private",
    deletedAt: record.deletedAt,
    metadata: record.metadata,
    environmentStage: typeof record.metadata.environmentStage === "string" ? record.metadata.environmentStage : undefined,
  };
}

async function persistAssociations(record: FileUploadRecord, userId: string) {
  const associations = await listOwnedFileUploadAssociations(record.id, userId);
  return associations.map(toFileUploadAssociationApiRecord);
}

async function ensureUploadRecord(input: FileUploadInput, tenantId: string): Promise<FileUploadRecord> {
  const validation = validateFileUploadInput(input);
  const initialLifecycle = [createFileUploadLifecycleEvent("selected", "Upload selected.")];
  if (validation.normalized.retryUploadId) {
    const existing = await getOwnedFileUploadRecord(input.userId, validation.normalized.retryUploadId, true);
    if (!existing) {
      throw new Error("Retry upload record was not found.");
    }
    return updateFileUploadRecord(
      transitionFileUpload(existing, "selected", {
        note: "Retry requested.",
        retryCount: existing.retryCount + 1,
        lastErrorCode: undefined,
        lastErrorMessage: undefined,
        deletedAt: undefined,
      }),
    );
  }

  return createFileUploadRecord(
    createNewFileUploadRecord({
      userId: input.userId,
      tenantId,
      source: input.source,
      status: "selected",
      usageContext: validation.normalized.usageContext ?? inferUsageContextFromSource(input.source),
      originalFilename: validation.normalized.fileName,
      mimeType: validation.normalized.mimeType,
      mediaType: validation.normalized.mediaType,
      fileSizeBytes: input.fileSizeBytes,
      linkedContentId: validation.normalized.linkedContentId,
      linkedContentType: validation.normalized.linkedContentType,
      metadata: {
        ...validation.normalized.metadata,
        environmentStage: createScopedUserStorageActor(input.userId, tenantId).environmentStage,
      },
      lifecycle: initialLifecycle,
    }),
  );
}

export async function uploadOwnedFile(input: FileUploadInput): Promise<FileUploadResult> {
  const startedAt = Date.now();
  const tenantId = resolveTenantId(input.userId, input.tenantId);
  const actor = createScopedUserStorageActor(input.userId, tenantId);
  const validation = validateFileUploadInput(input);
  let record = await ensureUploadRecord(input, tenantId);
  let uploadedMediaId: string | undefined;

  try {
    await assertStorageUploadPermission(actor, {
      resourceType: "file_upload",
      tenantId,
      linkedContentId: validation.normalized.linkedContentId,
      linkedContentType: validation.normalized.linkedContentType,
      metadata: validation.normalized.metadata,
    });

    record = await updateFileUploadRecord(transitionFileUpload(record, "validating", { note: "Server-side validation started." }));

    if (!validation.ok) {
      throw new Error(validation.errors.join(" "));
    }

    record = await updateFileUploadRecord(transitionFileUpload(record, "uploading", { note: "Upload to storage provider started." }));

    const uploaded = await uploadOwnedMedia({
      userId: input.userId,
      tenantId,
      fileName: validation.normalized.fileName,
      mimeType: validation.normalized.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      bytes: input.bytes,
      mediaType: validation.normalized.mediaType,
      linkedContentId: validation.normalized.linkedContentId,
      linkedContentType: validation.normalized.linkedContentType,
      usageContext: validation.normalized.usageContext,
      metadata: {
        source: validation.normalized.source,
        ...validation.normalized.metadata,
        environmentStage: actor.environmentStage,
      },
    });
    uploadedMediaId = uploaded.media.id;

    const summary = buildFileUploadAssociationSummary({
      source: validation.normalized.source,
      linkedContentId: validation.normalized.linkedContentId,
      linkedContentType: validation.normalized.linkedContentType,
      associations: validation.normalized.associations,
    });

    record = await updateFileUploadRecord(
      transitionFileUpload(record, "uploaded", {
        note: "Upload completed successfully.",
        mediaId: uploaded.media.id,
        linkedContentId: validation.normalized.linkedContentId,
        linkedContentType: validation.normalized.linkedContentType,
        associationSummary: summary,
        completedAt: new Date().toISOString(),
      }),
    );

    const savedAssociations = await Promise.all(
      validation.normalized.associations.map((association) =>
        saveFileUploadAssociation(
          createFileUploadAssociationRecord({
            uploadId: record.id,
            userId: input.userId,
            tenantId,
            associationType: association.associationType,
            associationId: association.associationId,
            contentId: association.contentId,
            contentType: association.contentType,
            metadata: association.metadata,
          }),
        ),
      ),
    );

    const permissions = buildStoragePermissionMatrix(actor, toFileUploadResource(record));

    logFileUploadEvent("upload", {
      userId: input.userId,
      tenantId,
      uploadId: record.id,
      mediaId: uploaded.media.id,
      source: validation.normalized.source,
      fileSizeBytes: input.fileSizeBytes,
      retryCount: record.retryCount,
    });

    return {
      upload: toFileUploadApiRecord(record, permissions),
      associations: savedAssociations.map(toFileUploadAssociationApiRecord),
      media: uploaded.media,
      signed: uploaded.signed,
    };
  } catch (error) {
    if (uploadedMediaId) {
      await deleteOwnedMedia({ userId: input.userId, mediaId: uploadedMediaId });
    }

    record = await updateFileUploadRecord(
      transitionFileUpload(record, "failed", {
        note: "Upload failed.",
        lastErrorCode: "upload_failed",
        lastErrorMessage: error instanceof Error ? error.message : "Upload failed.",
      }),
    );

    logFileUploadFailure("upload", error, {
      userId: input.userId,
      tenantId,
      uploadId: record.id,
      source: input.source,
      fileName: input.fileName,
      fileSizeBytes: input.fileSizeBytes,
      retryCount: record.retryCount,
    });
    throw error;
  } finally {
    recordFileUploadDuration("upload", Date.now() - startedAt);
  }
}

export async function uploadOwnedFileBatch(input: FileUploadBatchInput): Promise<FileUploadBatchItemResult[]> {
  const startedAt = Date.now();
  try {
    const results: FileUploadBatchItemResult[] = [];

    for (const file of input.files) {
      try {
        const uploaded = await uploadOwnedFile({
          userId: input.userId,
          tenantId: input.tenantId,
          source: input.source,
          linkedContentId: input.linkedContentId,
          linkedContentType: input.linkedContentType,
          usageContext: input.usageContext,
          associations: input.associations,
          metadata: input.metadata,
          fileName: file.fileName,
          mimeType: file.mimeType,
          fileSizeBytes: file.fileSizeBytes,
          bytes: file.bytes,
        });
        results.push({ ok: true, ...uploaded });
      } catch (error) {
        results.push({
          ok: false,
          error: error instanceof Error ? error.message : "Unable to upload file.",
        });
      }
    }

    logFileUploadEvent("batch", {
      userId: input.userId,
      tenantId: resolveTenantId(input.userId, input.tenantId),
      source: input.source,
      fileCount: input.files.length,
      successCount: results.filter((entry) => entry.ok).length,
      failureCount: results.filter((entry) => !entry.ok).length,
    });

    return results;
  } catch (error) {
    logFileUploadFailure("batch", error, {
      userId: input.userId,
      tenantId: resolveTenantId(input.userId, input.tenantId),
      source: input.source,
      fileCount: input.files.length,
    });
    throw error;
  } finally {
    recordFileUploadDuration("batch", Date.now() - startedAt);
  }
}

export async function getOwnedFileUploadDetail(input: {
  userId: string;
  uploadId: string;
}): Promise<FileUploadDetailResult | null> {
  const startedAt = Date.now();
  const actor = createResourceUserStorageActor(input.userId);
  try {
    const resource = await assertStorageResourcePermission({
      actor,
      operation: "read",
      resourceType: "file_upload",
      resourceId: input.uploadId,
    });
    const record = await getOwnedFileUploadRecord(resource.ownerUserId, input.uploadId, true);
    if (!record) return null;

    const associations = await persistAssociations(record, resource.ownerUserId);
    const media = record.mediaId ? await getOwnedMediaAsset(resource.ownerUserId, record.mediaId, true) : null;

    logFileUploadEvent("get", {
      userId: input.userId,
      uploadId: input.uploadId,
      hasMedia: Boolean(media),
    });

    return {
      upload: toFileUploadApiRecord(record, buildStoragePermissionMatrix(actor, toFileUploadResource(record))),
      associations,
      media: media ? toMediaApiRecord(media) : undefined,
      metadata: record.metadata,
    };
  } catch (error) {
    logFileUploadFailure("get", error, {
      userId: input.userId,
      uploadId: input.uploadId,
    });
    throw error;
  } finally {
    recordFileUploadDuration("get", Date.now() - startedAt);
  }
}

export async function createOwnedFileUploadSignedUrl(input: {
  userId: string;
  uploadId: string;
  expiresInSeconds?: number;
}) {
  const startedAt = Date.now();
  const actor = createResourceUserStorageActor(input.userId);
  try {
    const resource = await assertStorageResourcePermission({
      actor,
      operation: "signed_url",
      resourceType: "file_upload",
      resourceId: input.uploadId,
    });
    const record = await getOwnedFileUploadRecord(resource.ownerUserId, input.uploadId, true);
    if (!record?.mediaId || record.deletedAt) {
      throw new Error("Uploaded file not found.");
    }

    const signed = await createOwnedMediaSignedUrl({
      userId: resource.ownerUserId,
      mediaId: record.mediaId,
      expiresInSeconds: input.expiresInSeconds,
    });

    logFileUploadEvent("signed_url", {
      userId: input.userId,
      uploadId: input.uploadId,
      mediaId: record.mediaId,
    });

    return signed;
  } catch (error) {
    logFileUploadFailure("signed_url", error, {
      userId: input.userId,
      uploadId: input.uploadId,
    });
    throw error;
  } finally {
    recordFileUploadDuration("signed_url", Date.now() - startedAt);
  }
}

export async function deleteOwnedFileUpload(input: {
  userId: string;
  uploadId: string;
}): Promise<{ deleted: boolean; upload?: FileUploadResult["upload"] }> {
  const startedAt = Date.now();
  const actor = createResourceUserStorageActor(input.userId);
  try {
    const resource = await assertStorageResourcePermission({
      actor,
      operation: "delete",
      resourceType: "file_upload",
      resourceId: input.uploadId,
    });
    const record = await getOwnedFileUploadRecord(resource.ownerUserId, input.uploadId, true);
    if (!record || record.deletedAt) {
      return { deleted: false };
    }

    if (record.mediaId) {
      await deleteOwnedMedia({ userId: resource.ownerUserId, mediaId: record.mediaId });
    }

    const status = record.mediaId ? record.status : "canceled";
    const updated = await updateFileUploadRecord(
      transitionFileUpload(record, status, {
        note: record.mediaId ? "Uploaded file deleted." : "Upload canceled before completion.",
        canceledAt: status === "canceled" ? new Date().toISOString() : record.canceledAt,
        deletedAt: new Date().toISOString(),
      }),
    );

    logFileUploadEvent("delete", {
      userId: input.userId,
      uploadId: input.uploadId,
      mediaId: record.mediaId,
    });

    return { deleted: true, upload: toFileUploadApiRecord(updated, buildStoragePermissionMatrix(actor, toFileUploadResource(updated))) };
  } catch (error) {
    logFileUploadFailure("delete", error, {
      userId: input.userId,
      uploadId: input.uploadId,
    });
    throw error;
  } finally {
    recordFileUploadDuration("delete", Date.now() - startedAt);
  }
}
