"use server";

import { redirect } from "next/navigation";
import {
  hashPassword,
  verifyPassword,
  createSession,
  setSessionCookie,
  destroySession,
  getSession,
} from "./auth";
import { query } from "./db";

// ─── Auth Actions ───

export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Užpildykite visus laukus" };
  }

  const result = await query<{
    id: string;
    password_hash: string;
    is_active: boolean;
  }>("SELECT id, password_hash, is_active FROM users WHERE email = $1", [
    email,
  ]);

  if (result.rows.length === 0) {
    return { error: "Neteisingas el. paštas arba slaptažodis" };
  }

  const user = result.rows[0];
  if (!user.is_active) {
    return { error: "Paskyra deaktyvuota" };
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return { error: "Neteisingas el. paštas arba slaptažodis" };
  }

  const token = await createSession(user.id);
  await setSessionCookie(token);

  redirect("/dashboard");
}

export async function registerAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const workspaceName = (formData.get("workspace") as string)?.trim();
  const inviteToken = (formData.get("invite") as string)?.trim();

  if (!name || !email || !password) {
    return { error: "Užpildykite visus laukus" };
  }

  if (password.length < 6) {
    return { error: "Slaptažodis turi būti bent 6 simbolių" };
  }

  const existing = await query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );
  if (existing.rows.length > 0) {
    return { error: "Šis el. pašto adresas jau registruotas" };
  }

  const passwordHash = await hashPassword(password);

  // Check if user was invited to a workspace
  if (inviteToken) {
    const invite = await query<{
      id: string;
      workspace_id: string;
      role: string;
      email: string;
    }>(
      `SELECT id, workspace_id, role, email FROM workspace_invites
       WHERE id = $1 AND accepted_at IS NULL AND expires_at > NOW()`,
      [inviteToken]
    );

    if (invite.rows.length > 0 && invite.rows[0].email === email) {
      const inv = invite.rows[0];
      const userResult = await query<{ id: string }>(
        `INSERT INTO users (email, password_hash, name, workspace_id, role)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [email, passwordHash, name, inv.workspace_id, inv.role]
      );

      await query(
        "UPDATE workspace_invites SET accepted_at = NOW() WHERE id = $1",
        [inv.id]
      );

      const token = await createSession(userResult.rows[0].id);
      await setSessionCookie(token);
      redirect("/dashboard");
    }

    return { error: "Pakvietimas negalioja arba el. paštas nesutampa" };
  }

  // Create new workspace + user
  if (!workspaceName) {
    return { error: "Įveskite darbo erdvės pavadinimą" };
  }

  const wsResult = await query<{ id: string }>(
    "INSERT INTO workspaces (name, business_type) VALUES ($1, 'iv') RETURNING id",
    [workspaceName]
  );
  const workspaceId = wsResult.rows[0].id;

  const userResult = await query<{ id: string }>(
    `INSERT INTO users (email, password_hash, name, workspace_id, role)
     VALUES ($1, $2, $3, $4, 'owner') RETURNING id`,
    [email, passwordHash, name, workspaceId]
  );

  await query(
    "INSERT INTO workspace_settings (workspace_id) VALUES ($1)",
    [workspaceId]
  );

  const token = await createSession(userResult.rows[0].id);
  await setSessionCookie(token);

  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

// ─── Income Actions ───

export async function addIncomeAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Neprisijungta" };
  if (session.role === "viewer") return { error: "Neturite teisės" };

  const year = parseInt(formData.get("year") as string);
  const month = parseInt(formData.get("month") as string);
  const amount = parseFloat(formData.get("amount") as string);
  const description = (formData.get("description") as string)?.trim() || null;

  if (!year || !month || isNaN(amount) || amount < 0) {
    return { error: "Neteisingi duomenys" };
  }

  // Upsert — update if exists for this month, otherwise insert
  const existing = await query(
    `SELECT id FROM income_records WHERE workspace_id = $1 AND year = $2 AND month = $3`,
    [session.workspaceId, year, month]
  );

  if (existing.rows.length > 0) {
    await query(
      `UPDATE income_records SET amount = $1, description = $2, updated_at = NOW()
       WHERE workspace_id = $3 AND year = $4 AND month = $5`,
      [amount, description, session.workspaceId, year, month]
    );
  } else {
    await query(
      `INSERT INTO income_records (workspace_id, year, month, amount, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [session.workspaceId, year, month, amount, description, session.id]
    );
  }

  return { success: true };
}

export async function deleteIncomeAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Neprisijungta" };
  if (session.role === "viewer") return { error: "Neturite teisės" };

  const id = formData.get("id") as string;
  await query(
    "DELETE FROM income_records WHERE id = $1 AND workspace_id = $2",
    [id, session.workspaceId]
  );

  return { success: true };
}

// ─── Expense Actions ───

export async function addExpenseAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Neprisijungta" };
  if (session.role === "viewer") return { error: "Neturite teisės" };

  const year = parseInt(formData.get("year") as string);
  const month = parseInt(formData.get("month") as string);
  const amount = parseFloat(formData.get("amount") as string);
  const category = (formData.get("category") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;

  if (!year || !month || isNaN(amount) || amount <= 0) {
    return { error: "Neteisingi duomenys" };
  }

  await query(
    `INSERT INTO expense_records (workspace_id, year, month, amount, category, description, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [session.workspaceId, year, month, amount, category, description, session.id]
  );

  return { success: true };
}

export async function deleteExpenseAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Neprisijungta" };
  if (session.role === "viewer") return { error: "Neturite teisės" };

  const id = formData.get("id") as string;
  await query(
    "DELETE FROM expense_records WHERE id = $1 AND workspace_id = $2",
    [id, session.workspaceId]
  );

  return { success: true };
}

// ─── Settings Actions ───

export async function updateSettingsAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Neprisijungta" };
  if (session.role !== "owner") return { error: "Tik savininkas gali keisti nustatymus" };

  const businessType = formData.get("business_type") as string;
  const expenseMethod = formData.get("expense_method") as string;
  const additionalPension = formData.get("additional_pension") === "on";
  const employedElsewhere = formData.get("employed_elsewhere") === "on";
  const pvmRegistered = formData.get("pvm_registered") === "on";

  await query(
    `UPDATE workspaces SET business_type = $1, updated_at = NOW() WHERE id = $2`,
    [businessType || "iv", session.workspaceId]
  );

  await query(
    `UPDATE workspace_settings
     SET expense_method = $1, additional_pension = $2, employed_elsewhere = $3, pvm_registered = $4, updated_at = NOW()
     WHERE workspace_id = $5`,
    [expenseMethod || "30percent", additionalPension, employedElsewhere, pvmRegistered, session.workspaceId]
  );

  return { success: true };
}

export async function updateProfileAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Neprisijungta" };

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!name || !email) return { error: "Užpildykite visus laukus" };

  // Check email uniqueness
  const existing = await query(
    "SELECT id FROM users WHERE email = $1 AND id != $2",
    [email, session.id]
  );
  if (existing.rows.length > 0) {
    return { error: "Šis el. paštas jau naudojamas" };
  }

  await query(
    "UPDATE users SET name = $1, email = $2, updated_at = NOW() WHERE id = $3",
    [name, email, session.id]
  );

  return { success: true };
}

export async function changePasswordAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Neprisijungta" };

  const currentPassword = formData.get("current_password") as string;
  const newPassword = formData.get("new_password") as string;

  if (!currentPassword || !newPassword) return { error: "Užpildykite visus laukus" };
  if (newPassword.length < 6) return { error: "Naujas slaptažodis turi būti bent 6 simbolių" };

  const result = await query<{ password_hash: string }>(
    "SELECT password_hash FROM users WHERE id = $1",
    [session.id]
  );

  const valid = await verifyPassword(currentPassword, result.rows[0].password_hash);
  if (!valid) return { error: "Neteisingas dabartinis slaptažodis" };

  const hash = await hashPassword(newPassword);
  await query(
    "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
    [hash, session.id]
  );

  return { success: true };
}

export async function inviteMemberAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Neprisijungta" };
  if (session.role !== "owner") return { error: "Tik savininkas gali kviesti narius" };

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = (formData.get("role") as string) || "member";

  if (!email) return { error: "Įveskite el. paštą" };

  // Check if already a member
  const existing = await query(
    "SELECT id FROM users WHERE email = $1 AND workspace_id = $2",
    [email, session.workspaceId]
  );
  if (existing.rows.length > 0) return { error: "Šis naudotojas jau yra komandoje" };

  // Check pending invite
  const pendingInvite = await query(
    `SELECT id FROM workspace_invites WHERE email = $1 AND workspace_id = $2 AND accepted_at IS NULL AND expires_at > NOW()`,
    [email, session.workspaceId]
  );
  if (pendingInvite.rows.length > 0) return { error: "Pakvietimas jau išsiųstas" };

  await query(
    `INSERT INTO workspace_invites (workspace_id, email, role, invited_by)
     VALUES ($1, $2, $3, $4)`,
    [session.workspaceId, email, role, session.id]
  );

  return { success: true, message: `Pakvietimas išsiųstas: ${email}` };
}

export async function removeMemberAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Neprisijungta" };
  if (session.role !== "owner") return { error: "Tik savininkas gali šalinti narius" };

  const userId = formData.get("user_id") as string;
  if (userId === session.id) return { error: "Negalite pašalinti savęs" };

  await query(
    "UPDATE users SET is_active = false, workspace_id = NULL WHERE id = $1 AND workspace_id = $2",
    [userId, session.workspaceId]
  );

  return { success: true };
}

export async function cancelInviteAction(formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Neprisijungta" };
  if (session.role !== "owner") return { error: "Tik savininkas gali atšaukti pakvietimus" };

  const inviteId = formData.get("invite_id") as string;
  await query(
    "DELETE FROM workspace_invites WHERE id = $1 AND workspace_id = $2",
    [inviteId, session.workspaceId]
  );

  return { success: true };
}
