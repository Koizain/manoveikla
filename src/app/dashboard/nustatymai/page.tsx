import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/prisijungti");

  const [settingsResult, membersResult, invitesResult] = await Promise.all([
    query<{
      expense_method: string;
      additional_pension: boolean;
      employed_elsewhere: boolean;
      pvm_registered: boolean;
    }>("SELECT * FROM workspace_settings WHERE workspace_id = $1", [session.workspaceId]),
    query<{ id: string; name: string; email: string; role: string }>(
      "SELECT id, name, email, role FROM users WHERE workspace_id = $1 AND is_active = true ORDER BY created_at",
      [session.workspaceId]
    ),
    query<{ id: string; email: string; role: string; created_at: string }>(
      "SELECT id, email, role, created_at FROM workspace_invites WHERE workspace_id = $1 AND accepted_at IS NULL AND expires_at > NOW() ORDER BY created_at DESC",
      [session.workspaceId]
    ),
  ]);

  const settings = settingsResult.rows[0] || {
    expense_method: "30percent",
    additional_pension: false,
    employed_elsewhere: false,
    pvm_registered: false,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold">Nustatymai</h1>

      <SettingsClient
        session={session}
        settings={settings}
        members={membersResult.rows}
        invites={invitesResult.rows}
      />
    </div>
  );
}
