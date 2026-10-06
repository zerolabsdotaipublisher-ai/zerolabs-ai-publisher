import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { WebsiteStructure } from "@/lib/ai/structure";
import {
  adaptWebsiteStructureToEditorDocument,
  projectEditorDocumentNavigation,
  projectEditorDocumentSeo,
  projectEditorDocumentToWebsiteStructure,
  trustedWebsiteStructureState,
  type EditorProjectionResult,
} from "@/lib/editor/document";
import { createCanonicalWebsiteVersionSnapshot } from "@/lib/versions/snapshot-contract";
import { createStandardMarketingSiteFixture } from "@/tests/fixtures/editor-document";
import {
  applyIsolatedAtomicTestSchema,
  isPsqlAvailable,
  removeIsolatedAtomicTestSchema,
  resolveIsolatedTestEnvironment,
  type IsolatedTestTarget,
} from "@/tests/integration/support/isolated-environment";

type SavePayload = {
  p_structure_id: string;
  p_expected_revision: number;
  p_document: object;
  p_compatibility_structure: object;
  p_navigation: object;
  p_seo_rows: object[];
  p_snapshot: object;
};

type StoredState = {
  structure: {
    structure: object;
    editorDocument: object | null;
    editorRevision: number;
    version: number;
  } | null;
  navigation: object | null;
  seo: object[];
  versions: object[];
};

function projected<T>(result: EditorProjectionResult<T>): T {
  if (!result.ok) {
    throw new Error(result.issues.map((entry) => `${entry.path}: ${entry.message}`).join("; "));
  }
  return result.value;
}

function testClient(target: IsolatedTestTarget, key: string): SupabaseClient {
  return createClient(target.supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

function testStructure(structureId: string, ownerId: string): WebsiteStructure {
  const structure = structuredClone(createStandardMarketingSiteFixture());
  structure.id = structureId;
  structure.userId = ownerId;
  return structure;
}

function savePayload(structure: WebsiteStructure, expectedRevision: number): SavePayload {
  const document = adaptWebsiteStructureToEditorDocument(structure);
  const trusted = trustedWebsiteStructureState(structure);
  const compatibilityStructure = projected(projectEditorDocumentToWebsiteStructure(document, trusted));
  const navigation = projected(projectEditorDocumentNavigation(document));
  const seo = projected(projectEditorDocumentSeo(document, trusted));
  const snapshot = createCanonicalWebsiteVersionSnapshot({
    structure: compatibilityStructure,
    canonicalDocument: document,
    editorRevision: expectedRevision + 1,
    capturedAt: "2026-10-06T00:00:00.000Z",
  });

  return {
    p_structure_id: structure.id,
    p_expected_revision: expectedRevision,
    p_document: document,
    p_compatibility_structure: compatibilityStructure,
    p_navigation: navigation,
    p_seo_rows: seo.rows,
    p_snapshot: snapshot,
  };
}

function expectedSeoRows(payload: SavePayload): object[] {
  return [...payload.p_seo_rows].sort((left, right) => {
    const leftId = typeof (left as { id?: unknown }).id === "string" ? (left as { id: string }).id : "";
    const rightId = typeof (right as { id?: unknown }).id === "string" ? (right as { id: string }).id : "";
    return leftId.localeCompare(rightId);
  });
}

const environment = resolveIsolatedTestEnvironment();
const psqlAvailable = isPsqlAvailable();

if (!environment.available || !psqlAvailable) {
  const readinessFailure = !environment.available
    ? environment.reason
    : "psql is required to establish the disposable Slice 3B schema.";
  describe("isolated save_editor_document atomic persistence", () => {
    it.skip(readinessFailure, () => undefined);
  });
} else {
  const target = environment.target;
  const service = testClient(target, target.serviceRoleKey);
  const anonymous = testClient(target, target.anonKey);
  const emailSuffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const password = `Slice3B-${emailSuffix}-NotForProduction`;
  let ownerId = "";
  let nonOwnerId = "";
  let owner: SupabaseClient;
  let nonOwner: SupabaseClient;

  async function callHelper(functionName: string, args: Record<string, unknown> = {}): Promise<unknown> {
    const result = await service.rpc(functionName, args);
    if (result.error) throw new Error(`Test-only helper ${functionName} failed: ${result.error.message}`);
    return result.data;
  }

  async function state(structureId: string): Promise<StoredState> {
    return await callHelper("zero_slice3b_read_state", { p_structure_id: structureId }) as StoredState;
  }

  async function seed(structureId: string): Promise<WebsiteStructure> {
    const structure = testStructure(structureId, ownerId);
    await callHelper("zero_slice3b_seed_structure", {
      p_id: structure.id,
      p_user_id: structure.userId,
      p_structure: structure,
    });
    return structure;
  }

  async function createSignedInClient(email: string): Promise<{ id: string; client: SupabaseClient }> {
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error || !created.data.user) {
      throw new Error(`Could not create isolated integration-test user: ${created.error?.message ?? "missing user"}`);
    }
    const client = testClient(target, target.anonKey);
    const signedIn = await client.auth.signInWithPassword({ email, password });
    if (signedIn.error || !signedIn.data.session) {
      throw new Error(`Could not sign in isolated integration-test user: ${signedIn.error?.message ?? "missing session"}`);
    }
    return { id: created.data.user.id, client };
  }

  async function save(client: SupabaseClient, payload: SavePayload) {
    return await client.rpc("save_editor_document", payload);
  }

  async function saveInitial(structureId: string): Promise<{ structure: WebsiteStructure; payload: SavePayload; state: StoredState }> {
    const structure = await seed(structureId);
    const payload = savePayload(structure, 0);
    const result = await save(owner, payload);
    expect(result.error).toBeNull();
    expect(result.data).toEqual([{ status: "saved", editor_revision: 1, version: 2 }]);
    return { structure, payload, state: await state(structureId) };
  }

  describe.sequential("isolated save_editor_document atomic persistence", () => {
    beforeAll(async () => {
      await applyIsolatedAtomicTestSchema(target);
      const ownerAccount = await createSignedInClient(`slice3b-owner-${emailSuffix}@example.test`);
      ownerId = ownerAccount.id;
      owner = ownerAccount.client;
      const nonOwnerAccount = await createSignedInClient(`slice3b-non-owner-${emailSuffix}@example.test`);
      nonOwnerId = nonOwnerAccount.id;
      nonOwner = nonOwnerAccount.client;
    });

    afterAll(async () => {
      const userIds = [ownerId, nonOwnerId].filter(Boolean);
      await removeIsolatedAtomicTestSchema(target);
      await Promise.all(userIds.map(async (id) => {
        const result = await service.auth.admin.deleteUser(id);
        if (result.error) throw new Error(`Could not remove isolated integration-test user: ${result.error.message}`);
      }));
    });

    it("commits the owner document, derived navigation and SEO, v2 snapshot, and one revision together", async () => {
      const structureId = crypto.randomUUID();
      const { payload, state: persisted } = await saveInitial(structureId);

      expect(persisted).toMatchObject({
        structure: { editorDocument: payload.p_document, structure: payload.p_compatibility_structure, editorRevision: 1, version: 2 },
        navigation: payload.p_navigation,
        seo: expectedSeoRows(payload),
        versions: [payload.p_snapshot],
      });
      expect((persisted.versions[0] as { canonicalDocument?: unknown }).canonicalDocument).toEqual(payload.p_document);
      expect((persisted.versions[0] as { structure?: unknown }).structure).toEqual(payload.p_compatibility_structure);
    });

    it("returns a locked stale-revision conflict without changing any artifact", async () => {
      const structureId = crypto.randomUUID();
      const structure = await seed(structureId);
      const before = await state(structureId);
      const result = await save(owner, savePayload(structure, 1));

      expect(result.error).toBeNull();
      expect(result.data).toEqual([{ status: "conflict", editor_revision: 0, version: 1 }]);
      expect(await state(structureId)).toEqual(before);
    });

    it("leaves state unchanged for anonymous and non-owner callers", async () => {
      const structureId = crypto.randomUUID();
      const structure = await seed(structureId);
      const payload = savePayload(structure, 0);
      const before = await state(structureId);

      const anonymousResult = await save(anonymous, payload);
      expect(anonymousResult.error).not.toBeNull();
      expect(await state(structureId)).toEqual(before);

      const nonOwnerResult = await save(nonOwner, payload);
      expect(nonOwnerResult.error).not.toBeNull();
      expect(await state(structureId)).toEqual(before);
      expect(nonOwnerId).not.toBe(ownerId);
    });

    it("rejects invalid canonical input before any write", async () => {
      const structureId = crypto.randomUUID();
      const structure = await seed(structureId);
      const payload = savePayload(structure, 0);
      const before = await state(structureId);

      const result = await save(owner, { ...payload, p_document: {} });
      expect(result.error).not.toBeNull();
      expect(await state(structureId)).toEqual(before);
    });

    it("does not trust a browser-supplied compatibility user ID", async () => {
      const structureId = crypto.randomUUID();
      const structure = await seed(structureId);
      const payload = savePayload(structure, 0);
      const before = await state(structureId);
      const forgedStructure = { ...payload.p_compatibility_structure, userId: nonOwnerId };
      const forgedSnapshot = { ...payload.p_snapshot, structure: forgedStructure };

      const result = await save(owner, {
        ...payload,
        p_compatibility_structure: forgedStructure,
        p_snapshot: forgedSnapshot,
      });
      expect(result.error).not.toBeNull();
      expect(await state(structureId)).toEqual(before);
    });

    it("stops unprojectable canonical documents before the database transaction begins", async () => {
      const structureId = crypto.randomUUID();
      const structure = await seed(structureId);
      const document = adaptWebsiteStructureToEditorDocument(structure);
      const root = document.nodes[document.pages[0].rootNodeIds[0]];
      document.nodes.unprojectable_test_container = {
        id: "unprojectable_test_container",
        type: "layout.container",
        kind: "container",
        props: {},
        visibility: { base: true },
        slots: { default: { name: "default", childIds: [] } },
      };
      root.slots.default.childIds.push("unprojectable_test_container");
      const before = await state(structureId);

      const projection = projectEditorDocumentToWebsiteStructure(document, trustedWebsiteStructureState(structure));
      expect(projection.ok).toBe(false);
      expect(await state(structureId)).toEqual(before);
    });

    it.each(["structure", "navigation", "seo", "version"] as const)(
      "rolls back every prior artifact when the test-only %s stage fails",
      async (stage) => {
        const structureId = crypto.randomUUID();
        const { structure, state: before } = await saveInitial(structureId);
        await callHelper("zero_slice3b_set_failpoint", { p_structure_id: structureId, p_stage: stage });

        const result = await save(owner, savePayload(structure, 1));
        expect(result.error).not.toBeNull();
        expect(await state(structureId)).toEqual(before);
        await callHelper("zero_slice3b_clear_failpoint", { p_structure_id: structureId });
      },
    );

    it("changes editor_revision exactly once on success, never on failure, and invalidates a stale session after a legacy write", async () => {
      const structureId = crypto.randomUUID();
      const { structure, state: afterSave } = await saveInitial(structureId);
      expect(afterSave.structure?.editorRevision).toBe(1);

      await callHelper("zero_slice3b_set_failpoint", { p_structure_id: structureId, p_stage: "version" });
      const failed = await save(owner, savePayload(structure, 1));
      expect(failed.error).not.toBeNull();
      expect((await state(structureId)).structure?.editorRevision).toBe(1);
      await callHelper("zero_slice3b_clear_failpoint", { p_structure_id: structureId });

      expect(await callHelper("zero_slice3b_legacy_touch", { p_structure_id: structureId })).toBe(2);
      const beforeStale = await state(structureId);
      const stale = await save(owner, savePayload(structure, 1));
      expect(stale.error).toBeNull();
      expect(stale.data).toEqual([{ status: "conflict", editor_revision: 2, version: 2 }]);
      expect(await state(structureId)).toEqual(beforeStale);
    });

    it("keeps the tested RPC as SECURITY INVOKER and grants execution only to authenticated", async () => {
      const contract = await callHelper("zero_slice3b_security_contract") as {
        securityDefiner: boolean;
        anonCanExecute: boolean;
        authenticatedCanExecute: boolean;
      };
      expect(contract).toEqual({
        securityDefiner: false,
        anonCanExecute: false,
        authenticatedCanExecute: true,
      });
    });
  });
}
