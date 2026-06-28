"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RequirePermission } from "@/components/auth/Guard";
import { useActor } from "@/lib/auth/AuthProvider";
import { PageHeader, Card, CardBody, useToast } from "@/components/ui";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { createCustomer, type NewCustomer } from "@/lib/db/repositories/customers";

export default function NewCustomerPage() {
  return (
    <RequirePermission permission="customers.create">
      <NewCustomerForm />
    </RequirePermission>
  );
}

function NewCustomerForm() {
  const router = useRouter();
  const actor = useActor();
  const { success, error: toastError } = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(data: NewCustomer) {
    setSubmitting(true);
    try {
      const id = await createCustomer(data, actor);
      success(`Customer "${data.fullName}" created.`);
      router.push(`/customers/${id}`);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to create customer.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link
        href="/customers"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to customers
      </Link>

      <PageHeader
        title="New Customer"
        description="Create a customer profile owned by Liberty Cargo Movers."
      />

      <Card>
        <CardBody>
          <CustomerForm onSubmit={handleSubmit} submitting={submitting} />
        </CardBody>
      </Card>
    </div>
  );
}
