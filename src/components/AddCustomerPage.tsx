import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useCustomers } from "@/lib/customers";
import { Toaster } from "@/components/ui/sonner";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  phone: z.string().trim().min(1, "Phone is required").max(30),
  address: z.string().trim().min(1, "Address is required").max(255),
  netMb: z.coerce.number().min(0, "Must be ≥ 0").max(1000000),
  fees: z.coerce.number().min(0, "Must be ≥ 0").max(10000000),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["Paid", "Unpaid"]),
});

const today = () => new Date().toISOString().slice(0, 10);

export function AddCustomerPage() {
  const { add } = useCustomers();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    netMb: "",
    fees: "",
    date: today(),
    status: "Unpaid" as "Paid" | "Unpaid",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    await add(result.data);
    toast.success("Customer added");
    navigate({ to: "/customers" });
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <Toaster richColors position="top-right" />
      <header className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Add New Customer
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in the details below and click submit to save.
          </p>
        </div>
      </header>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Customer Name">
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Enter full name"
              maxLength={100}
              className={inputCls}
            />
          </Field>
          <Field label="Phone Number">
            <input
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="Phone Number"
              maxLength={30}
              className={inputCls}
            />
          </Field>

          <Field label="Address" className="sm:col-span-2">
            <input
              type="text"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Address"
              maxLength={255}
              className={inputCls}
            />
          </Field>

          <Field label="Net MB">
            <input
              type="number"
              inputMode="numeric"
              value={form.netMb}
              onChange={(e) => update("netMb", e.target.value)}
              placeholder="e.g. 500"
              className={inputCls}
            />
          </Field>
          <Field label="Fees (Amount)">
            <input
              type="number"
              inputMode="numeric"
              value={form.fees}
              onChange={(e) => update("fees", e.target.value)}
              placeholder="e.g. 1000"
              className={inputCls}
            />
          </Field>

          <Field label="Date">
            <input
              type="date"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Payment Status">
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value as "Paid" | "Unpaid")}
              className={inputCls}
            >
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
            </select>
          </Field>
        </div>

        <button
          type="submit"
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-button)] transition-colors hover:bg-[var(--primary-hover)]"
        >
          <UserPlus className="h-4 w-4" />
          Add Customer
        </button>
      </form>
    </main>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold text-foreground">{label}</span>
      {children}
    </label>
  );
}
