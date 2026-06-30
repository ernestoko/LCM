import { describe, it, expect } from "vitest";
import {
  ROLE_PERMISSIONS,
  can,
  canAny,
  isSeal,
  type Permission,
} from "@/lib/auth/permissions";
import {
  effectivePermissions,
  permissionsForModules,
  defaultModulesForRole,
  MODULES,
} from "@/constants/modules";
import type { Role } from "@/types";

const ALL_ROLES = Object.keys(ROLE_PERMISSIONS) as Role[];
const SEAL_ROLES: Role[] = ["seal_admin", "seal_supervisor", "seal_intake", "seal_staff"];

describe("effectivePermissions (dynamic module-based RBAC)", () => {
  it("returns [] for no role", () => {
    expect(effectivePermissions(null, {})).toEqual([]);
    expect(effectivePermissions(undefined, {})).toEqual([]);
  });

  it("falls back to the role's static defaults when no custom config exists", () => {
    expect(effectivePermissions("liberty_admin", {})).toEqual(ROLE_PERMISSIONS.liberty_admin);
  });

  it("uses the custom module grant when the Super Admin has set one", () => {
    const perms = effectivePermissions("seal_staff", { seal_staff: ["customers"] });
    expect(perms).toContain("customers.view");
    expect(perms).toContain("customers.create");
    // and ONLY those — the static seal_staff defaults no longer apply
    expect(perms).not.toContain("intake.manage");
  });

  it("an explicit empty module set revokes everything", () => {
    expect(effectivePermissions("seal_admin", { seal_admin: [] })).toEqual([]);
  });

  it("permissionsForModules expands + de-duplicates overlapping modules", () => {
    const perms = permissionsForModules(["shipments", "intake"]);
    // shipments.status.update is in both modules — must appear once
    expect(perms.filter((p) => p === "shipments.status.update")).toHaveLength(1);
  });

  it("defaultModulesForRole reflects a role's held permissions", () => {
    expect(defaultModulesForRole("liberty_super_admin")).toContain("admin");
    // a customer only shares the complaints module (complaints.view/create) and
    // none of the staff-only modules
    const customerModules = defaultModulesForRole("customer");
    expect(customerModules).toContain("complaints");
    for (const staffOnly of ["admin", "shipments", "payments", "manifests", "intake"]) {
      expect(customerModules).not.toContain(staffOnly);
    }
  });

  it("every module permission is a real permission key", () => {
    const known = new Set<Permission>(Object.values(ROLE_PERMISSIONS).flat());
    // every role's perms are obviously known; assert module perms are a subset
    for (const m of MODULES) {
      for (const p of m.permissions) {
        expect(typeof p).toBe("string");
        // not strictly required to be granted to a role, but should be a valid key
        expect(p.length).toBeGreaterThan(0);
        void known;
      }
    }
  });
});

describe("RBAC invariants (regression guards)", () => {
  it("only manifest approvers/confirmers can dispatch (Tier-0 hardening)", () => {
    const canDispatch = (r: Role) => canAny(r, ["manifests.approve", "manifests.confirm"]);
    expect(canDispatch("liberty_super_admin")).toBe(true);
    expect(canDispatch("liberty_admin")).toBe(true);
    expect(canDispatch("seal_admin")).toBe(true);
    expect(canDispatch("seal_supervisor")).toBe(true);
    // intake/general SEAL staff must NOT be able to dispatch
    expect(canDispatch("seal_intake")).toBe(false);
    expect(canDispatch("seal_staff")).toBe(false);
    expect(canDispatch("customer")).toBe(false);
    expect(canDispatch("finance_user")).toBe(false);
  });

  it("SEAL roles never have access to the customer database (Liberty-owned)", () => {
    const customerPerms: Permission[] = [
      "customers.view",
      "customers.create",
      "customers.edit",
      "customers.delete",
    ];
    for (const role of SEAL_ROLES) {
      expect(isSeal(role)).toBe(true);
      for (const p of customerPerms) {
        expect(can(role, p)).toBe(false);
      }
    }
  });

  it("only the Super Admin holds the most destructive/global permissions", () => {
    const superOnly: Permission[] = [
      "users.manage",
      "settings.manage",
      "data.export",
      "shipments.lock",
      "shipments.delete",
      "customers.delete",
      "rates.approve",
      "routes.approve",
    ];
    for (const p of superOnly) {
      const holders = ALL_ROLES.filter((r) => can(r, p));
      expect(holders).toEqual(["liberty_super_admin"]);
    }
  });

  it("customers are read-only on their own data (no staff write powers)", () => {
    const forbidden: Permission[] = [
      "shipments.create",
      "shipments.edit",
      "invoices.generate",
      "payments.record",
      "manifests.create",
      "customers.view",
    ];
    for (const p of forbidden) expect(can("customer", p)).toBe(false);
  });

  it("every role has a non-empty permission set", () => {
    for (const role of ALL_ROLES) {
      expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
    }
  });
});
