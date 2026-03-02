"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateSettingsAction,
  updateProfileAction,
  changePasswordAction,
  inviteMemberAction,
  removeMemberAction,
  cancelInviteAction,
} from "@/lib/actions";
import type { SessionUser } from "@/lib/auth";

interface Props {
  session: SessionUser;
  settings: {
    expense_method: string;
    additional_pension: boolean;
    employed_elsewhere: boolean;
    pvm_registered: boolean;
  };
  members: { id: string; name: string; email: string; role: string }[];
  invites: { id: string; email: string; role: string; created_at: string }[];
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-5 text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Toggle({
  name,
  label,
  defaultChecked,
  disabled,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
  disabled?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <label className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => setChecked(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-emerald-accent" : "bg-border"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <input type="hidden" name={name} value={checked ? "on" : "off"} />
    </label>
  );
}

export default function SettingsClient({
  session,
  settings,
  members,
  invites,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [settingsMsg, setSettingsMsg] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [teamMsg, setTeamMsg] = useState("");

  const isOwner = session.role === "owner";

  async function handleSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSettingsMsg("");
    const formData = new FormData(e.currentTarget);
    const result = await updateSettingsAction(formData);
    if (result?.error) {
      setSettingsMsg("error:" + result.error);
    } else {
      setSettingsMsg("success:Nustatymai išsaugoti");
      startTransition(() => router.refresh());
    }
  }

  async function handleProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileMsg("");
    const formData = new FormData(e.currentTarget);
    const result = await updateProfileAction(formData);
    if (result?.error) {
      setProfileMsg("error:" + result.error);
    } else {
      setProfileMsg("success:Profilis atnaujintas");
      startTransition(() => router.refresh());
    }
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordMsg("");
    const formData = new FormData(e.currentTarget);
    const result = await changePasswordAction(formData);
    if (result?.error) {
      setPasswordMsg("error:" + result.error);
    } else {
      setPasswordMsg("success:Slaptažodis pakeistas");
      (e.target as HTMLFormElement).reset();
    }
  }

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTeamMsg("");
    const formData = new FormData(e.currentTarget);
    const result = await inviteMemberAction(formData);
    if (result?.error) {
      setTeamMsg("error:" + result.error);
    } else {
      setTeamMsg("success:" + (result?.message || "Pakvietimas išsiųstas"));
      (e.target as HTMLFormElement).reset();
      startTransition(() => router.refresh());
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm("Ar tikrai norite pašalinti šį narį?")) return;
    const formData = new FormData();
    formData.set("user_id", userId);
    const result = await removeMemberAction(formData);
    if (result?.error) {
      setTeamMsg("error:" + result.error);
    } else {
      startTransition(() => router.refresh());
    }
  }

  async function handleCancelInvite(inviteId: string) {
    const formData = new FormData();
    formData.set("invite_id", inviteId);
    await cancelInviteAction(formData);
    startTransition(() => router.refresh());
  }

  function Msg({ msg }: { msg: string }) {
    if (!msg) return null;
    const isError = msg.startsWith("error:");
    const text = msg.replace(/^(error|success):/, "");
    return (
      <div
        className={`mb-4 rounded-lg border p-3 text-sm ${
          isError
            ? "border-red-accent/30 bg-red-accent/10 text-red-accent"
            : "border-emerald-border bg-emerald-muted text-emerald-accent"
        }`}
      >
        {text}
      </div>
    );
  }

  const ROLE_LABELS: Record<string, string> = {
    owner: "Savininkas",
    member: "Narys",
    viewer: "Stebėtojas",
  };

  return (
    <div className="space-y-6">
      {/* Workspace Settings */}
      <Section title="Darbo erdvės nustatymai">
        <Msg msg={settingsMsg} />
        <form onSubmit={handleSettings} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Veiklos tipas</label>
            <select
              name="business_type"
              defaultValue={session.businessType}
              disabled={!isOwner}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-accent disabled:opacity-50"
            >
              <option value="iv">Individuali veikla (IV)</option>
              <option value="mb">Mažoji bendrija (MB)</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Sąnaudų metodas</label>
            <select
              name="expense_method"
              defaultValue={settings.expense_method}
              disabled={!isOwner}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-accent disabled:opacity-50"
            >
              <option value="30percent">30% fiksuotas atskaitymas</option>
              <option value="actual">Faktinės sąnaudos</option>
            </select>
          </div>

          <div className="space-y-1 border-t border-border pt-4">
            <Toggle
              name="additional_pension"
              label="Papildomas pensijos kaupimas (+3% VSD)"
              defaultChecked={settings.additional_pension}
              disabled={!isOwner}
            />
            <Toggle
              name="employed_elsewhere"
              label="Dirbu pagal darbo sutartį (PSD neprivaloma)"
              defaultChecked={settings.employed_elsewhere}
              disabled={!isOwner}
            />
            <Toggle
              name="pvm_registered"
              label="PVM mokėtojas"
              defaultChecked={settings.pvm_registered}
              disabled={!isOwner}
            />
          </div>

          {isOwner && (
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-emerald-accent px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-emerald-light disabled:opacity-50"
            >
              Išsaugoti
            </button>
          )}
        </form>
      </Section>

      {/* Profile */}
      <Section title="Profilis">
        <Msg msg={profileMsg} />
        <form onSubmit={handleProfile} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Vardas</label>
            <input
              name="name"
              type="text"
              defaultValue={session.name}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-accent"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">El. paštas</label>
            <input
              name="email"
              type="email"
              defaultValue={session.email}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-accent"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-emerald-accent px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-emerald-light disabled:opacity-50"
          >
            Atnaujinti profilį
          </button>
        </form>
      </Section>

      {/* Change Password */}
      <Section title="Keisti slaptažodį">
        <Msg msg={passwordMsg} />
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Dabartinis slaptažodis
            </label>
            <input
              name="current_password"
              type="password"
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-accent"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Naujas slaptažodis
            </label>
            <input
              name="new_password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-accent"
              placeholder="Mažiausiai 6 simboliai"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-emerald-accent px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-emerald-light disabled:opacity-50"
          >
            Pakeisti slaptažodį
          </button>
        </form>
      </Section>

      {/* Team Management */}
      <Section title="Komanda">
        <Msg msg={teamMsg} />

        {/* Members list */}
        <div className="mb-6 space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border border-border p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-muted text-sm font-bold text-emerald-accent">
                  {(member.name || member.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{member.name || member.email}</p>
                  <p className="text-xs text-muted">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-muted px-2 py-0.5 text-xs text-emerald-accent">
                  {ROLE_LABELS[member.role] || member.role}
                </span>
                {isOwner && member.id !== session.id && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={isPending}
                    className="rounded px-2 py-1 text-xs text-red-accent hover:bg-red-accent/10"
                  >
                    Šalinti
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pending invites */}
        {invites.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-medium text-muted">Laukiantys pakvietimai</h3>
            <div className="space-y-2">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between rounded-lg border border-border border-dashed p-3"
                >
                  <div>
                    <p className="text-sm">{invite.email}</p>
                    <p className="text-xs text-muted">
                      {ROLE_LABELS[invite.role] || invite.role} — laukiama
                    </p>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleCancelInvite(invite.id)}
                      disabled={isPending}
                      className="rounded px-2 py-1 text-xs text-red-accent hover:bg-red-accent/10"
                    >
                      Atšaukti
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite form */}
        {isOwner && (
          <div className="border-t border-border pt-4">
            <h3 className="mb-3 text-sm font-medium">Pakviesti narį</h3>
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                name="email"
                type="email"
                required
                placeholder="nario@email.lt"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-accent"
              />
              <select
                name="role"
                className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald-accent"
              >
                <option value="member">Narys</option>
                <option value="viewer">Stebėtojas</option>
              </select>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-emerald-accent px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-emerald-light disabled:opacity-50"
              >
                Pakviesti
              </button>
            </form>
            <p className="mt-2 text-xs text-muted">
              Pakviestas naudotojas galės registruotis su nuoroda ir prisijungti prie jūsų darbo erdvės.
            </p>
          </div>
        )}
      </Section>
    </div>
  );
}
