"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RequirePermission } from "@/components/auth/Guard";
import { PageHeader, InfoBanner } from "@/components/ui";
import { CsvImport } from "@/components/customers/CsvImport";

export default function ImportCustomersPage() {
  return (
    <RequirePermission permission="customers.create">
      <ImportCustomers />
    </RequirePermission>
  );
}

function ImportCustomers() {
  const router = useRouter();

  return (
    <div>
      <Link
        href="/customers"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to customers
      </Link>

      <PageHeader
        title="Import Customers"
        description="Bulk-onboard customers from a CSV file or pasted spreadsheet content."
      />

      <div className="space-y-6">
        <InfoBanner tone="info">
          <p className="font-medium">CSV format</p>
          <p className="mt-1">
            Include a header row with these columns (case-insensitive):{" "}
            <span className="font-mono">
              fullName, phone, email, country, customerType, source, city, address
            </span>
            . <span className="font-mono">fullName</span> and{" "}
            <span className="font-mono">phone</span> are required; everything else is optional.
            Unknown or blank <span className="font-mono">customerType</span> defaults to{" "}
            <span className="font-mono">individual</span>, and{" "}
            <span className="font-mono">source</span> defaults to{" "}
            <span className="font-mono">walk_in</span>.
          </p>
          <p className="mt-1">
            Every imported record is owned by Liberty Cargo Movers. Use the “Download template”
            button below for a ready-made starting point.
          </p>
        </InfoBanner>

        <CsvImport onDone={() => router.push("/customers")} />
      </div>
    </div>
  );
}
