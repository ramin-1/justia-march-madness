import { clearTeamSlotAssignmentAction, saveTeamSlotAssignmentAction } from "@/app/admin/team-slots/actions";
import { PageShell } from "@/components/page-shell";
import { getCanonicalTeamSlots, getTeamLabel } from "@/lib/brackets/registry";
import { getManualTeamSlotAssignments, getTeamLabelOverridesByKey } from "@/lib/brackets/team-labels";

export const dynamic = "force-dynamic";

const noticeMessages = {
  saved: "Team slot assignment saved.",
  cleared: "Team slot assignment cleared.",
} as const;

const errorMessages = {
  invalid_team_key: "Unable to save because the team slot key was invalid.",
  missing_team_name: "Team name is required to save an assignment.",
} as const;

function getSingleSearchParam(value: string | string[] | undefined) {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
}

type TeamSlotsPageProps = {
  searchParams: Promise<{
    notice?: string | string[];
    error?: string | string[];
  }>;
};

export default async function AdminTeamSlotsPage({ searchParams }: TeamSlotsPageProps) {
  const params = await searchParams;
  const noticeKey = getSingleSearchParam(params.notice);
  const errorKey = getSingleSearchParam(params.error);

  const [manualAssignments, teamLabelOverridesByKey] = await Promise.all([
    getManualTeamSlotAssignments(),
    getTeamLabelOverridesByKey(),
  ]);

  const manualAssignmentByKey = new Map(
    manualAssignments.map((assignment) => [assignment.teamKey, assignment.teamName]),
  );

  const slots = getCanonicalTeamSlots();
  const noticeMessage =
    noticeKey && noticeKey in noticeMessages
      ? noticeMessages[noticeKey as keyof typeof noticeMessages]
      : null;
  const errorMessage =
    errorKey && errorKey in errorMessages
      ? errorMessages[errorKey as keyof typeof errorMessages]
      : null;

  return (
    <PageShell
      title="Admin Team Slots"
      description="Set manual team names for canonical slot keys when sync data is missing or needs override."
    >
      {noticeMessage ? (
        <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {noticeMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {errorMessage}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Slot Key</th>
              <th className="px-4 py-3 font-semibold">Default Slot Label</th>
              <th className="px-4 py-3 font-semibold">Current Display Label</th>
              <th className="px-4 py-3 font-semibold">Source</th>
              <th className="px-4 py-3 font-semibold">Manual Assignment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slots.map((slot) => {
              const manualAssignment = manualAssignmentByKey.get(slot.key) ?? "";
              const displayLabel = getTeamLabel(slot.key, teamLabelOverridesByKey);
              const source = manualAssignment
                ? "Manual override"
                : displayLabel !== slot.label
                  ? "Synced/derived"
                  : "Placeholder";

              return (
                <tr key={slot.key}>
                  <td className="px-4 py-3 font-medium text-slate-900">{slot.key}</td>
                  <td className="px-4 py-3 text-slate-700">{slot.label}</td>
                  <td className="px-4 py-3 text-slate-900">{displayLabel}</td>
                  <td className="px-4 py-3 text-slate-700">{source}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={saveTeamSlotAssignmentAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="teamKey" value={slot.key} />
                        <input
                          name="teamName"
                          defaultValue={manualAssignment}
                          placeholder="Set manual team name"
                          className="w-56 rounded-md border border-slate-300 px-3 py-2 text-sm"
                        />
                        <button
                          type="submit"
                          className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white"
                        >
                          Save
                        </button>
                      </form>

                      <form action={clearTeamSlotAssignmentAction}>
                        <input type="hidden" name="teamKey" value={slot.key} />
                        <button
                          type="submit"
                          className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                        >
                          Clear
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
