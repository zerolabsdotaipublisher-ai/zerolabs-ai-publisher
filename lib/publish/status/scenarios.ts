export interface PublishStatusScenario {
  id: string;
  name: string;
  expectedBehavior: string;
}

export const publishStatusScenarios: PublishStatusScenario[] = [
  {
    id: "draft-state",
    name: "Draft website",
    expectedBehavior: "A never-published website maps to Draft with publish action enabled when eligible.",
  },
  {
    id: "publishing-state",
    name: "Publishing in progress",
    expectedBehavior: "Active publish jobs map to Publishing and disable publish action until completion.",
  },
  {
    id: "updating-state",
    name: "Updating in progress",
    expectedBehavior: "Deployment updates map to Publishing badge with updating semantics and action disabled.",
  },
  {
    id: "live-state",
    name: "Live website",
    expectedBehavior: "Published websites with no pending changes map to Live and show last published timestamp.",
  },
  {
    id: "unpublished-changes",
    name: "Updates pending",
    expectedBehavior: "Published websites with saved draft changes map to Updates pending and show Publish updates call-to-action.",
  },
  {
    id: "failed-state",
    name: "Failed publish/update",
    expectedBehavior: "Failed publication states show Failed label and surface backend error message where available.",
  },
  {
    id: "archived-state",
    name: "Archived website",
    expectedBehavior: "Archived websites map to Archived and block publish actions.",
  },
  {
    id: "deleted-state",
    name: "Deleted website",
    expectedBehavior: "Soft-deleted/deleted websites map to Deleted and block publish actions.",
  },
];
