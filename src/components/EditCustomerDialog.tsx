import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { X } from "lucide-react";
import type { Customer, PaymentStatus } from "@/lib/customers";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  phone: z.string().trim().min(1, "Phone is required").max(30),
  address: z.string().trim().min(1, "Address is required").max(255),
  netMb: z.coerce.number().min(0).max(1000000),
  fees: z.coerce.number().min(0).max(10000000),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["Paid", "Unpaid", "Pending"]),
});

type Props = {
  customer: Customer | null;
  onClose: () => void;
  onSave: (id: string, patch: Omit<Customer, "id" | "createdAt">) => Promise<void>;
};

const inputCls =
  "w-full rounded-lg border border-border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30";

export function EditCustomerDialog({ customer, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    netMb: "",
    fees: "",
    date: "",
    status: "Unpaid" as PaymentStatus,
  });

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        netMb: String(customer.netMb),
        fees: String(customer.fees),
        date: customer.date,
        status: customer.status,
      });
    }
  }, [customer]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (customer) {
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [customer, onClose]);

  if (!customer) return null;

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
    await onSave(customer!.id, result.data);
    toast.success("Customer updated");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold text-foreground">Edit Customer</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Customer Name">
              <input
                className={inputCls}
                value={form.name}
                maxLength={100}
                onChange={(e) => update("name", e.target.value)}
              />
            </Field>
            <Field label="Phone Number">
              <input
                type="tel"
                inputMode="tel"
                className={inputCls}
                value={form.phone}
                maxLength={30}
                onChange={(e) => update("phone", e.target.value)}
              />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <input
                className={inputCls}
                value={form.address}
                maxLength={255}
                onChange={(e) => update("address", e.target.value)}
              />
            </Field>
            <Field label="Net MB">
              <input
                type="number"
                className={inputCls}
                value={form.netMb}
                onChange={(e) => update("netMb", e.target.value)}
              />
            </Field>
            <Field label="Fees (Amount)">
              <input
                type="number"
                className={inputCls}
                value={form.fees}
                onChange={(e) => update("fees", e.target.value)}
              />
            </Field>
            <Field label="Date">
              <input
                type="date"
                className={inputCls}
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
              />
            </Field>
            <Field label="Payment Status">
              <select
                className={inputCls}
                value={form.status}
                onChange={(e) => update("status", e.target.value as PaymentStatus)}
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </select>
            </Field>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-button)] transition-colors hover:bg-[var(--primary-hover)]"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
      <span className="mb-1.5 block text-sm font-semibold text-foreground">{label}</span>
      {children}
    </label>
  );
}
