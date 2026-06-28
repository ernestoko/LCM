"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Save, ShieldAlert, KeyRound } from "lucide-react";
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useAuth, useActor } from "@/lib/auth/AuthProvider";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { update } from "@/lib/db/firestore";
import { COLLECTIONS } from "@/lib/db/collections";
import { ROLE_LABELS } from "@/constants/roles";
import type { AppUser, Organization } from "@/types";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Field,
  Input,
  Button,
  InfoBanner,
  useToast,
} from "@/components/ui";

const ORG_LABELS: Record<Organization, string> = {
  liberty: "Liberty Cargo Movers",
  seal: "Operations",
  customer: "Customer",
};

/** Map a Firebase Auth error code to a friendly, user-facing message. */
function friendlyAuthError(err: unknown, fallback: string): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Your current password is incorrect.";
      case "auth/weak-password":
        return "The new password is too weak. Use at least 6 characters.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a moment and try again.";
      case "auth/requires-recent-login":
        return "Please re-enter your current password to continue.";
      case "auth/network-request-failed":
        return "Network error. Check your connection and try again.";
      default:
        return err.message || fallback;
    }
  }
  return err instanceof Error ? err.message : fallback;
}

function ProfileSection({ user }: { user: AppUser }) {
  const actor = useActor();
  const { success, error: errorToast } = useToast();

  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [saving, setSaving] = useState(false);

  // Re-sync local state if the underlying profile changes.
  useEffect(() => {
    setDisplayName(user.displayName ?? "");
    setPhone(user.phone ?? "");
  }, [user.displayName, user.phone]);

  async function handleSave() {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      errorToast("Display name cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      const currentUser = getFirebaseAuth().currentUser;
      if (currentUser) {
        await updateProfile(currentUser, { displayName: trimmedName });
      }
      await update<AppUser>(
        COLLECTIONS.users,
        user.id,
        { displayName: trimmedName, phone: phone.trim() },
        actor,
      );
      success("Profile updated.");
    } catch (err) {
      errorToast(friendlyAuthError(err, "Failed to update profile."));
    } finally {
      setSaving(false);
    }
  }

  const dirty =
    displayName.trim() !== (user.displayName ?? "") || phone.trim() !== (user.phone ?? "");

  return (
    <Card>
      <CardHeader title="Profile" subtitle="Your account details and contact information." />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="profile-email" hint="Contact a Super Admin to change your email.">
            <Input id="profile-email" value={user.email} readOnly disabled />
          </Field>
          <Field label="Role" htmlFor="profile-role">
            <Input id="profile-role" value={ROLE_LABELS[user.role]} readOnly disabled />
          </Field>
          <Field label="Organization" htmlFor="profile-org">
            <Input id="profile-org" value={ORG_LABELS[user.organization]} readOnly disabled />
          </Field>
          {user.sealOffice && (
            <Field label="Operations hub" htmlFor="profile-office">
              <Input id="profile-office" value={user.sealOffice} readOnly disabled />
            </Field>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Display Name" htmlFor="profile-name" required>
            <Input
              id="profile-name"
              value={displayName}
              placeholder="Your name"
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </Field>
          <Field label="Phone" htmlFor="profile-phone" hint="Used for shipment and account updates.">
            <Input
              id="profile-phone"
              type="tel"
              value={phone}
              placeholder="+1 555 000 0000"
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving} disabled={!dirty || saving}>
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function PasswordSection({ user }: { user: AppUser }) {
  const { success, error: errorToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const tooShort = newPassword.length > 0 && newPassword.length < 6;

  function clearFields() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleChangePassword() {
    if (!currentPassword) {
      errorToast("Enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      errorToast("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      errorToast("New passwords do not match.");
      return;
    }

    const currentUser = getFirebaseAuth().currentUser;
    if (!currentUser || !currentUser.email) {
      errorToast("You are not signed in. Please sign in again.");
      return;
    }

    setSaving(true);
    try {
      try {
        await updatePassword(currentUser, newPassword);
      } catch (err) {
        if (err instanceof FirebaseError && err.code === "auth/requires-recent-login") {
          // Reauthenticate with the supplied current password, then retry.
          const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
          await reauthenticateWithCredential(currentUser, credential);
          await updatePassword(currentUser, newPassword);
        } else {
          throw err;
        }
      }
      clearFields();
      success("Password changed.");
    } catch (err) {
      errorToast(friendlyAuthError(err, "Failed to change password."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Change Password" subtitle="Update the password you use to sign in." />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Current Password" htmlFor="current-password" required>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Field>
          <Field
            label="New Password"
            htmlFor="new-password"
            required
            hint="At least 6 characters."
            error={tooShort ? "Must be at least 6 characters." : undefined}
          >
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Field>
          <Field
            label="Confirm New Password"
            htmlFor="confirm-password"
            required
            error={mismatch ? "Passwords do not match." : undefined}
          >
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Field>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleChangePassword}
            loading={saving}
            disabled={
              saving ||
              !currentPassword ||
              newPassword.length < 6 ||
              newPassword !== confirmPassword
            }
          >
            <KeyRound className="h-4 w-4" /> Update Password
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function SessionSection() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { error: errorToast } = useToast();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      errorToast(err instanceof Error ? err.message : "Failed to sign out.");
      setSigningOut(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Session" subtitle="Manage your current sign-in." />
      <CardBody className="space-y-4">
        <InfoBanner tone="info">
          Need a different role or expanded access? Contact a Liberty Super Admin — roles and
          permissions can only be changed by an administrator.
        </InfoBanner>
        <div className="flex justify-end">
          <Button variant="danger" onClick={handleSignOut} loading={signingOut}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export default function ProfilePage() {
  const { user, loading } = useAuth();

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Profile & Security"
        description="Manage your personal details, password and session."
      />

      {!loading && !user ? (
        <InfoBanner tone="warning">
          <span className="inline-flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            We couldn&apos;t load your account. Please sign in again to manage your profile.
          </span>
        </InfoBanner>
      ) : user ? (
        <>
          <ProfileSection user={user} />
          <PasswordSection user={user} />
          <SessionSection />
        </>
      ) : (
        <Card>
          <CardBody>
            <p className="text-sm text-navy-400">Loading your profile…</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
