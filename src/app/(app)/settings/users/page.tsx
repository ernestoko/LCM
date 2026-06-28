"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import type { Role } from "@/types";
import { RequirePermission } from "@/components/auth/Guard";
import { useActor } from "@/lib/auth/AuthProvider";
import { useUsers, setUserActive } from "@/lib/db/repositories/users";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  PageHeader,
  Button,
  Card,
  CardBody,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
  Badge,
  Modal,
  Field,
  Input,
  Select,
  Avatar,
  LoadingState,
  ErrorState,
  EmptyState,
  useToast,
} from "@/components/ui";
import {
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ASSIGNABLE_STAFF_ROLES,
} from "@/constants/roles";

/** Roles a Super Admin may assign through this screen. */
const CREATABLE_ROLES: Role[] = ["liberty_super_admin", ...ASSIGNABLE_STAFF_ROLES];

interface NewUserForm {
  displayName: string;
  email: string;
  password: string;
  role: Role;
  phone: string;
  sealOffice: string;
  customerId: string;
}

const EMPTY_FORM: NewUserForm = {
  displayName: "",
  email: "",
  password: "",
  role: "liberty_admin",
  phone: "",
  sealOffice: "",
  customerId: "",
};

function UsersManager() {
  const actor = useActor();
  const { success, error: errorToast } = useToast();
  const { data: users, loading, error } = useUsers();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewUserForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const isSealRole = form.role === "seal_admin" || form.role === "seal_staff";
  const isCustomerRole = form.role === "customer";

  function set<K extends keyof NewUserForm>(key: K, value: NewUserForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openModal() {
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  async function handleToggleActive(id: string, next: boolean) {
    setTogglingId(id);
    try {
      await setUserActive(id, next, actor);
      success(next ? "User activated." : "User deactivated.");
    } catch (err) {
      errorToast(err instanceof Error ? err.message : "Failed to update user.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleCreate() {
    if (!form.displayName.trim() || !form.email.trim() || !form.password) {
      errorToast("Name, email and password are required.");
      return;
    }
    setSubmitting(true);
    try {
      const token = await getFirebaseAuth().currentUser?.getIdToken();
      if (!token) {
        errorToast("Your session has expired. Please sign in again.");
        return;
      }
      const payload = {
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        ...(isSealRole && form.sealOffice.trim() ? { sealOffice: form.sealOffice.trim() } : {}),
        ...(isCustomerRole && form.customerId.trim() ? { customerId: form.customerId.trim() } : {}),
      };
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data: { ok: boolean; error?: string } = await res.json();
      if (!res.ok || !data.ok) {
        errorToast(data.error ?? "Failed to create user.");
        return;
      }
      success(`User ${form.displayName.trim()} created.`);
      setOpen(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      errorToast(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  }

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [users],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Create staff accounts and control platform access."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" /> Settings
              </Button>
            </Link>
            <Button size="sm" onClick={openModal}>
              <UserPlus className="h-4 w-4" /> Add User
            </Button>
          </div>
        }
      />

      <Card>
        <CardBody className="p-0">
          {loading ? (
            <LoadingState label="Loading users…" />
          ) : error ? (
            <div className="p-5">
              <ErrorState message={error.message} />
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No users yet"
                description="Add the first staff account to get started."
                action={
                  <Button size="sm" onClick={openModal}>
                    <UserPlus className="h-4 w-4" /> Add User
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Role</TH>
                  <TH>Organization</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Active</TH>
                </TR>
              </THead>
              <TBody>
                {sortedUsers.map((u) => (
                  <TR key={u.id}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.displayName} src={u.photoURL} />
                        <span className="font-medium text-navy-900">{u.displayName}</span>
                      </div>
                    </TD>
                    <TD className="text-navy-600">{u.email}</TD>
                    <TD>{ROLE_LABELS[u.role] ?? u.role}</TD>
                    <TD className="capitalize">{u.organization}</TD>
                    <TD>
                      <Badge tone={u.active ? "success" : "neutral"}>
                        {u.active ? "Active" : "Inactive"}
                      </Badge>
                    </TD>
                    <TD className="text-right">
                      <Button
                        variant={u.active ? "outline" : "success"}
                        size="sm"
                        loading={togglingId === u.id}
                        onClick={() => handleToggleActive(u.id, !u.active)}
                      >
                        {u.active ? "Deactivate" : "Activate"}
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add User"
        description="Create a Firebase Auth account with a platform role."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={submitting}>
              Create User
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full Name" htmlFor="nu-name" required>
              <Input
                id="nu-name"
                value={form.displayName}
                onChange={(e) => set("displayName", e.target.value)}
              />
            </Field>
            <Field label="Phone" htmlFor="nu-phone">
              <Input
                id="nu-phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="nu-email" required>
              <Input
                id="nu-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field label="Password" htmlFor="nu-password" required>
              <Input
                id="nu-password"
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
              />
            </Field>
          </div>

          <Field
            label="Role"
            htmlFor="nu-role"
            required
            hint={ROLE_DESCRIPTIONS[form.role]}
          >
            <Select
              id="nu-role"
              value={form.role}
              onChange={(e) => set("role", e.target.value as Role)}
            >
              {CREATABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </Field>

          {isSealRole && (
            <Field label="SEAL Office" htmlFor="nu-seal-office" hint="Office this user is attached to.">
              <Input
                id="nu-seal-office"
                value={form.sealOffice}
                onChange={(e) => set("sealOffice", e.target.value)}
              />
            </Field>
          )}

          {isCustomerRole && (
            <Field
              label="Customer ID"
              htmlFor="nu-customer-id"
              hint="The linked customer document id."
            >
              <Input
                id="nu-customer-id"
                value={form.customerId}
                onChange={(e) => set("customerId", e.target.value)}
              />
            </Field>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function UsersPage() {
  return (
    <RequirePermission permission="users.manage">
      <UsersManager />
    </RequirePermission>
  );
}
