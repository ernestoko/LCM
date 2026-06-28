"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Save, Trash2, Users } from "lucide-react";
import type {
  CommissionRule,
  CurrencyCode,
  CustomerSource,
  PayoutAccount,
  PlatformSettings,
} from "@/types";
import { RequirePermission } from "@/components/auth/Guard";
import { useActor } from "@/lib/auth/AuthProvider";
import { usePlatformSettings, savePlatformSettings } from "@/lib/db/repositories/settings";
import { useRoutes } from "@/lib/db/repositories/routes";
import {
  PageHeader,
  Button,
  Card,
  CardHeader,
  CardBody,
  Field,
  Input,
  Textarea,
  Select,
  Checkbox,
  Table,
  THead,
  TH,
  TBody,
  TR,
  TD,
  LoadingState,
  EmptyState,
  useToast,
} from "@/components/ui";
import { CUSTOMER_SOURCE_LABELS } from "@/constants/statuses";

const CURRENCIES: CurrencyCode[] = ["USD", "GHS", "NGN", "EUR", "GBP"];
const CUSTOMER_SOURCES = Object.keys(CUSTOMER_SOURCE_LABELS) as CustomerSource[];

const PAYOUT_TYPES: { value: PayoutAccount["type"]; label: string }[] = [
  { value: "mobile_money", label: "Mobile Money" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "zelle", label: "Zelle" },
  { value: "cashapp", label: "Cash App" },
  { value: "other", label: "Other" },
];

type DispatchGuardKey = keyof PlatformSettings["dispatchGuards"];

const DISPATCH_GUARDS: { key: DispatchGuardKey; label: string }[] = [
  { key: "requirePhoto", label: "Require package photo" },
  { key: "requireWeight", label: "Require weight" },
  { key: "requireInvoice", label: "Require invoice" },
  { key: "requirePaymentConfirmed", label: "Require payment confirmed" },
  { key: "requireManifest", label: "Require manifest" },
];

/** Parse a string input into a finite number (falls back to 0). */
function num(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function SettingsForm() {
  const actor = useActor();
  const { success, error: errorToast } = useToast();
  const { settings, loading } = usePlatformSettings();
  const { data: routes, loading: lRoutes } = useRoutes();

  // --- Form state ----------------------------------------------------------
  const [companyName, setCompanyName] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>("USD");
  const [defaultCommissionPercent, setDefaultCommissionPercent] = useState(0);
  const [defaultPlatformFeePerShipment, setDefaultPlatformFeePerShipment] = useState(0);
  const [monthlySupportFee, setMonthlySupportFee] = useState(0);
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
  const [serviceFeeAmount, setServiceFeeAmount] = useState(0);
  const [serviceFeeByRoute, setServiceFeeByRoute] = useState<Record<string, boolean>>({});
  const [dispatchGuards, setDispatchGuards] = useState<PlatformSettings["dispatchGuards"]>({
    requirePhoto: true,
    requireWeight: true,
    requireInvoice: true,
    requirePaymentConfirmed: true,
    requireManifest: true,
  });
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [payoutAccounts, setPayoutAccounts] = useState<PayoutAccount[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCompanyName(settings.companyName);
    setDefaultCurrency(settings.defaultCurrency);
    setDefaultCommissionPercent(settings.defaultCommissionPercent);
    setDefaultPlatformFeePerShipment(settings.defaultPlatformFeePerShipment);
    setMonthlySupportFee(settings.monthlySupportFee);
    setCommissionRules(settings.commissionRules.map((r) => ({ ...r })));
    setServiceFeeAmount(settings.serviceFeeAmount);
    setServiceFeeByRoute({ ...settings.serviceFeeByRoute });
    setDispatchGuards({ ...settings.dispatchGuards });
    setPaymentInstructions(settings.paymentInstructions);
    setPayoutAccounts((settings.payoutAccounts ?? []).map((a) => ({ ...a })));
  }, [settings]);

  // --- Payout account editors ---------------------------------------------
  function updateAccount(index: number, patch: Partial<PayoutAccount>) {
    setPayoutAccounts((accts) => accts.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  }
  function addAccount() {
    setPayoutAccounts((accts) => [
      ...accts,
      {
        id: `acct-${accts.length + 1}-${Math.random().toString(36).slice(2, 7)}`,
        type: "mobile_money",
        label: "",
        enabled: true,
      },
    ]);
  }
  function removeAccount(index: number) {
    setPayoutAccounts((accts) => accts.filter((_, i) => i !== index));
  }

  // --- Commission rule editors --------------------------------------------
  function updateRule(index: number, patch: Partial<CommissionRule>) {
    setCommissionRules((rules) =>
      rules.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  }

  function addRule() {
    setCommissionRules((rules) => [
      ...rules,
      { commissionPercent: defaultCommissionPercent, platformFeePerShipment: defaultPlatformFeePerShipment },
    ]);
  }

  function removeRule(index: number) {
    setCommissionRules((rules) => rules.filter((_, i) => i !== index));
  }

  function toggleRouteFee(code: string, enabled: boolean) {
    setServiceFeeByRoute((m) => ({ ...m, [code]: enabled }));
  }

  function setGuard(key: DispatchGuardKey, value: boolean) {
    setDispatchGuards((g) => ({ ...g, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const partial: Partial<PlatformSettings> = {
        companyName: companyName.trim(),
        defaultCurrency,
        defaultCommissionPercent,
        defaultPlatformFeePerShipment,
        monthlySupportFee,
        commissionRules: commissionRules.map((r) => ({
          ...(r.customerSource ? { customerSource: r.customerSource } : {}),
          ...(r.routeCode ? { routeCode: r.routeCode } : {}),
          ...(r.itemCategory ? { itemCategory: r.itemCategory } : {}),
          commissionPercent: r.commissionPercent,
          platformFeePerShipment: r.platformFeePerShipment,
          ...(r.note ? { note: r.note } : {}),
        })),
        serviceFeeAmount,
        serviceFeeByRoute,
        dispatchGuards,
        paymentInstructions: paymentInstructions.trim(),
        payoutAccounts: payoutAccounts
          .filter((a) => a.label.trim())
          .map((a) => ({
            id: a.id,
            type: a.type,
            label: a.label.trim(),
            enabled: a.enabled,
            ...(a.accountName ? { accountName: a.accountName } : {}),
            ...(a.accountNumber ? { accountNumber: a.accountNumber } : {}),
            ...(a.bankOrProvider ? { bankOrProvider: a.bankOrProvider } : {}),
            ...(a.instructions ? { instructions: a.instructions } : {}),
          })),
      };
      await savePlatformSettings(partial, actor);
      success("Settings saved.");
    } catch (err) {
      errorToast(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || lRoutes) return <LoadingState label="Loading settings…" />;

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Platform Settings"
        description="Company, commission, service fee and dispatch configuration."
        actions={
          <Link href="/settings/users">
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4" /> User Management
            </Button>
          </Link>
        }
      />

      {/* Company */}
      <Card>
        <CardHeader title="Company" subtitle="Identity and default currency." />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Company Name" htmlFor="company-name" required>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </Field>
            <Field label="Default Currency" htmlFor="default-currency">
              <Select
                id="default-currency"
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value as CurrencyCode)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </CardBody>
      </Card>

      {/* Commission defaults */}
      <Card>
        <CardHeader
          title="Commission Defaults"
          subtitle="Applied when no specific rule matches a shipment."
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Default Commission %" htmlFor="default-commission">
              <Input
                id="default-commission"
                type="number"
                min={0}
                step="0.1"
                value={defaultCommissionPercent}
                onChange={(e) => setDefaultCommissionPercent(num(e.target.value))}
              />
            </Field>
            <Field label="Platform Fee / Shipment" htmlFor="default-platform-fee">
              <Input
                id="default-platform-fee"
                type="number"
                min={0}
                step="0.01"
                value={defaultPlatformFeePerShipment}
                onChange={(e) => setDefaultPlatformFeePerShipment(num(e.target.value))}
              />
            </Field>
            <Field label="Monthly Support Fee" htmlFor="monthly-support-fee">
              <Input
                id="monthly-support-fee"
                type="number"
                min={0}
                step="0.01"
                value={monthlySupportFee}
                onChange={(e) => setMonthlySupportFee(num(e.target.value))}
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      {/* Commission rules editor */}
      <Card>
        <CardHeader
          title="Commission Rules"
          subtitle="Override the defaults for specific sources, routes or item categories."
          action={
            <Button variant="outline" size="sm" onClick={addRule}>
              <Plus className="h-4 w-4" /> Add Rule
            </Button>
          }
        />
        <CardBody className="p-0">
          {commissionRules.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No commission rules"
                description="The default commission applies to every shipment."
                action={
                  <Button variant="outline" size="sm" onClick={addRule}>
                    <Plus className="h-4 w-4" /> Add Rule
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Customer Source</TH>
                  <TH>Route Code</TH>
                  <TH>Item Category</TH>
                  <TH>Commission %</TH>
                  <TH>Platform Fee</TH>
                  <TH>Note</TH>
                  <TH />
                </TR>
              </THead>
              <TBody>
                {commissionRules.map((rule, i) => (
                  <TR key={i}>
                    <TD>
                      <Select
                        value={rule.customerSource ?? ""}
                        onChange={(e) =>
                          updateRule(i, {
                            customerSource: e.target.value
                              ? (e.target.value as CustomerSource)
                              : undefined,
                          })
                        }
                      >
                        <option value="">Any</option>
                        {CUSTOMER_SOURCES.map((s) => (
                          <option key={s} value={s}>
                            {CUSTOMER_SOURCE_LABELS[s]}
                          </option>
                        ))}
                      </Select>
                    </TD>
                    <TD>
                      <Input
                        value={rule.routeCode ?? ""}
                        placeholder="Any"
                        onChange={(e) =>
                          updateRule(i, { routeCode: e.target.value || undefined })
                        }
                      />
                    </TD>
                    <TD>
                      <Input
                        value={rule.itemCategory ?? ""}
                        placeholder="Any"
                        onChange={(e) =>
                          updateRule(i, { itemCategory: e.target.value || undefined })
                        }
                      />
                    </TD>
                    <TD>
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        value={rule.commissionPercent}
                        onChange={(e) =>
                          updateRule(i, { commissionPercent: num(e.target.value) })
                        }
                      />
                    </TD>
                    <TD>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={rule.platformFeePerShipment}
                        onChange={(e) =>
                          updateRule(i, { platformFeePerShipment: num(e.target.value) })
                        }
                      />
                    </TD>
                    <TD>
                      <Input
                        value={rule.note ?? ""}
                        placeholder="Optional"
                        onChange={(e) => updateRule(i, { note: e.target.value || undefined })}
                      />
                    </TD>
                    <TD>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRule(i)}
                        aria-label="Remove rule"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Service fee */}
      <Card>
        <CardHeader
          title="Service Fee"
          subtitle="Flat fee plus per-route toggles (e.g. waived for Nigeria)."
        />
        <CardBody className="space-y-4">
          <Field label="Service Fee Amount" htmlFor="service-fee-amount" className="sm:max-w-xs">
            <Input
              id="service-fee-amount"
              type="number"
              min={0}
              step="0.01"
              value={serviceFeeAmount}
              onChange={(e) => setServiceFeeAmount(num(e.target.value))}
            />
          </Field>

          <div>
            <p className="mb-2 text-xs font-medium text-navy-700">Per-route service fee</p>
            {routes.length === 0 ? (
              <p className="text-sm text-navy-400">No routes configured yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {routes.map((route) => (
                  <Checkbox
                    key={route.id}
                    checked={serviceFeeByRoute[route.code] ?? false}
                    onChange={(e) => toggleRouteFee(route.code, e.target.checked)}
                    label={
                      <span>
                        <span className="font-mono text-xs">{route.code}</span>
                        <span className="ml-1 text-navy-500">— {route.countryName}</span>
                      </span>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Dispatch guards */}
      <Card>
        <CardHeader
          title="Dispatch Guards"
          subtitle="Conditions that must be met before a shipment can be dispatched."
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {DISPATCH_GUARDS.map((g) => (
              <Checkbox
                key={g.key}
                checked={dispatchGuards[g.key]}
                onChange={(e) => setGuard(g.key, e.target.checked)}
                label={g.label}
              />
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Payment instructions */}
      <Card>
        <CardHeader title="Payment Instructions" subtitle="Shown to customers on invoices." />
        <CardBody>
          <Field label="Instructions" htmlFor="payment-instructions">
            <Textarea
              id="payment-instructions"
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              className="min-h-[120px]"
            />
          </Field>
        </CardBody>
      </Card>

      {/* Payout accounts */}
      <Card>
        <CardHeader
          title="Payout Accounts"
          subtitle="Bank, mobile-money and Zelle accounts appended to every invoice's payment instructions."
          action={
            <Button variant="outline" size="sm" onClick={addAccount}>
              <Plus className="h-4 w-4" /> Add Account
            </Button>
          }
        />
        <CardBody className="space-y-4">
          {payoutAccounts.length === 0 ? (
            <EmptyState
              title="No payout accounts"
              description="Add a mobile-money, bank or Zelle account so customers know where to pay."
              action={
                <Button variant="outline" size="sm" onClick={addAccount}>
                  <Plus className="h-4 w-4" /> Add Account
                </Button>
              }
            />
          ) : (
            payoutAccounts.map((acct, i) => (
              <div key={acct.id} className="rounded-lg border border-navy-100 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Label" htmlFor={`acct-label-${i}`} required>
                    <Input
                      id={`acct-label-${i}`}
                      value={acct.label}
                      placeholder="MTN MoMo (Ghana)"
                      onChange={(e) => updateAccount(i, { label: e.target.value })}
                    />
                  </Field>
                  <Field label="Type" htmlFor={`acct-type-${i}`}>
                    <Select
                      id={`acct-type-${i}`}
                      value={acct.type}
                      onChange={(e) => updateAccount(i, { type: e.target.value as PayoutAccount["type"] })}
                    >
                      {PAYOUT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Account name" htmlFor={`acct-name-${i}`}>
                    <Input
                      id={`acct-name-${i}`}
                      value={acct.accountName ?? ""}
                      onChange={(e) => updateAccount(i, { accountName: e.target.value })}
                    />
                  </Field>
                  <Field label="Account number / handle" htmlFor={`acct-number-${i}`}>
                    <Input
                      id={`acct-number-${i}`}
                      value={acct.accountNumber ?? ""}
                      onChange={(e) => updateAccount(i, { accountNumber: e.target.value })}
                    />
                  </Field>
                  <Field label="Bank / provider" htmlFor={`acct-provider-${i}`}>
                    <Input
                      id={`acct-provider-${i}`}
                      value={acct.bankOrProvider ?? ""}
                      onChange={(e) => updateAccount(i, { bankOrProvider: e.target.value })}
                    />
                  </Field>
                  <Field label="Extra instructions" htmlFor={`acct-instr-${i}`}>
                    <Input
                      id={`acct-instr-${i}`}
                      value={acct.instructions ?? ""}
                      onChange={(e) => updateAccount(i, { instructions: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Checkbox
                    checked={acct.enabled}
                    onChange={(e) => updateAccount(i, { enabled: e.target.checked })}
                    label="Show on invoices"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAccount(i)}
                    aria-label="Remove account"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" /> Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-10 flex justify-end">
        <div className="flex items-center gap-3 rounded-xl border border-navy-100 bg-white px-4 py-3 shadow-card-hover">
          <span className="text-sm text-navy-500">Apply changes to the platform.</span>
          <Button onClick={handleSave} loading={saving}>
            <Save className="h-4 w-4" /> Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RequirePermission permission="settings.manage">
      <SettingsForm />
    </RequirePermission>
  );
}
