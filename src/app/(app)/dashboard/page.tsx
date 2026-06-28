"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLE_LABELS } from "@/constants/roles";
import { isLiberty, isSeal, isFinance, isCustomer } from "@/lib/auth/permissions";
import { PageHeader, LoadingState } from "@/components/ui";
import { LibertyDashboard } from "@/components/dashboard/LibertyDashboard";
import { SealDashboard } from "@/components/dashboard/SealDashboard";
import { FinanceDashboard } from "@/components/dashboard/FinanceDashboard";
import { CustomerDashboard } from "@/components/dashboard/CustomerDashboard";

export default function DashboardPage() {
  const { user, role, loading } = useAuth();

  if (loading) return <LoadingState />;

  const greeting = getGreeting();
  const firstName = user?.displayName?.split(" ")[0] ?? "there";

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${firstName}`}
        description={role ? `${ROLE_LABELS[role]} · Liberty & Liberty Logistics Platform` : undefined}
      />
      {isFinance(role) ? (
        <FinanceDashboard />
      ) : isSeal(role) ? (
        <SealDashboard />
      ) : isCustomer(role) ? (
        <CustomerDashboard />
      ) : isLiberty(role) ? (
        <LibertyDashboard />
      ) : (
        <LoadingState />
      )}
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
