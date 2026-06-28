"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { RequirePermission } from "@/components/auth/Guard";
import { useActor } from "@/lib/auth/AuthProvider";
import { MANAGEABLE_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/constants/roles";
import { MODULES, defaultModulesForRole } from "@/constants/modules";
import { useRoleModules, saveRoleModules } from "@/lib/db/repositories/roleConfig";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Button,
  Checkbox,
  LoadingState,
  InfoBanner,
  useToast,
} from "@/components/ui";
import type { Role } from "@/types";

export default function RolesPage() {
  return (
    <RequirePermission permission="users.manage">
      <RolesManager />
    </RequirePermission>
  );
}

function RolesManager() {
  const actor = useActor();
  const { success, error } = useToast();
  const { roleModules, loading } = useRoleModules();

  // Editable per-role module selection: role -> Set<moduleKey>.
  const [sel, setSel] = useState<Record<string, Set<string>>>({});
  const [savingRole, setSavingRole] = useState<Role | null>(null);

  // (Re)initialise the local selection whenever the saved config loads/changes.
  useEffect(() => {
    const next: Record<string, Set<string>> = {};
    for (const role of MANAGEABLE_ROLES) {
      next[role] = new Set(roleModules[role] ?? defaultModulesForRole(role));
    }
    setSel(next);
  }, [roleModules]);

  function toggle(role: Role, key: string) {
    setSel((prev) => {
      const set = new Set(prev[role] ?? []);
      if (set.has(key)) set.delete(key);
      else set.add(key);
      return { ...prev, [role]: set };
    });
  }

  async function save(role: Role) {
    setSavingRole(role);
    try {
      await saveRoleModules(role, [...(sel[role] ?? [])], actor);
      success(`Updated access for ${ROLE_LABELS[role]}.`);
    } catch (e) {
      error(e instanceof Error ? e.message : "Failed to save role access.");
    } finally {
      setSavingRole(null);
    }
  }

  if (loading) return <LoadingState label="Loading roles…" />;

  return (
    <div>
      <PageHeader
        title="Roles & Access"
        description="Grant or remove modules for each staff role. Changes take effect the next time those users sign in."
      />
      <InfoBanner tone="info" className="mb-6">
        The Liberty Super Admin always has full access and customers are managed separately.
        Toggle the modules a role can use, then Save that role.
      </InfoBanner>

      <div className="space-y-5">
        {MANAGEABLE_ROLES.map((role) => (
          <Card key={role}>
            <CardHeader
              title={ROLE_LABELS[role]}
              subtitle={ROLE_DESCRIPTIONS[role]}
              action={
                <Button size="sm" onClick={() => save(role)} loading={savingRole === role}>
                  <Save className="h-4 w-4" /> Save
                </Button>
              }
            />
            <CardBody>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {MODULES.map((m) => {
                  const on = sel[role]?.has(m.key) ?? false;
                  return (
                    <div
                      key={m.key}
                      className={`flex items-start gap-2.5 rounded-lg border p-3 transition-colors ${
                        on ? "border-brand-300 bg-brand-50/40" : "border-navy-100"
                      }`}
                    >
                      <Checkbox checked={on} onChange={() => toggle(role, m.key)} />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-navy-800">{m.label}</span>
                        <span className="block text-xs text-navy-400">{m.description}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
