import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import {
  fromFileUploadAssociationRow,
  fromFileUploadRow,
  toFileUploadAssociationRow,
  toFileUploadRow,
} from "./model";
import type {
  FileUploadAssociation,
  FileUploadAssociationRow,
  FileUploadRecord,
  FileUploadRecordRow,
} from "./types";

export async function createFileUploadRecord(record: FileUploadRecord): Promise<FileUploadRecord> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from("file_uploads").insert(toFileUploadRow(record)).select("*").single();
  if (error) throw error;
  return fromFileUploadRow(data as FileUploadRecordRow);
}

export async function getOwnedFileUploadRecord(
  userId: string,
  uploadId: string,
  includeDeleted = false,
): Promise<FileUploadRecord | null> {
  const supabase = getSupabaseServiceClient();
  let query = supabase.from("file_uploads").select("*").eq("user_id", userId).eq("id", uploadId);
  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ? fromFileUploadRow(data as FileUploadRecordRow) : null;
}

export async function updateFileUploadRecord(record: FileUploadRecord): Promise<FileUploadRecord> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("file_uploads")
    .update(toFileUploadRow(record))
    .eq("id", record.id)
    .eq("user_id", record.userId)
    .select("*")
    .single();

  if (error) throw error;
  return fromFileUploadRow(data as FileUploadRecordRow);
}

export async function saveFileUploadAssociation(record: FileUploadAssociation): Promise<FileUploadAssociation> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("file_upload_associations")
    .upsert(toFileUploadAssociationRow(record), {
      onConflict: "upload_id,association_type,association_id,content_id,content_type",
    })
    .select("*")
    .single();

  if (error) throw error;
  return fromFileUploadAssociationRow(data as FileUploadAssociationRow);
}

export async function listOwnedFileUploadAssociations(uploadId: string, userId: string): Promise<FileUploadAssociation[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("file_upload_associations")
    .select("*")
    .eq("upload_id", uploadId)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as FileUploadAssociationRow[]).map(fromFileUploadAssociationRow);
}
