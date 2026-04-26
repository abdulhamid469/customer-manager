import * as XLSX from "xlsx";
import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  Trash2,
  UserPlus,
  Pencil,
  Search,
  RefreshCw,
  PencilLine,
  ChevronDown,
  ChevronUp,
  Phone,
  MapPin,
  Receipt,
  Share2,
  Download,
  User,
  Wifi,
  CalendarDays,
} from "lucide-react";
import { useCustomers, updateCustomer, type Customer, type PaymentStatus } from "@/lib/customers";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { EditCustomerDialog } from "@/components/EditCustomerDialog";
import paidStamp from "@/assets/paid-stamp.png";
import billBanner from "@/assets/bill-banner.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Filter = "All" | PaymentStatus;

type ConfirmState = {
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass?: string;
  onConfirm: () => void;
} | null;

function formatBillDate(date: string) {
  if (!date) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function AllCustomersPage() {
  const { customers, remove, update, toggleStatus, refresh } = useCustomers();
  const [editing, setEditing] = useState<Customer | null>(null);
  const [billing, setBilling] = useState<Customer | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) => {
      if (filter !== "All" && c.status !== filter) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
    });
  }, [customers, query, filter]);

  const stats = useMemo(() => {
    let totalFees = 0;
    let paid = 0;
    let unpaid = 0;
    let paidFees = 0;
    let remainingFees = 0;
    for (const c of customers) {
      const fee = Number(c.fees) || 0;
      totalFees += fee;
      if (c.status === "Paid") {
        paid++;
        paidFees += fee;
      } else {
        unpaid++;
        remainingFees += fee;
      }
    }
    return { totalFees, paid, unpaid, paidFees, remainingFees };
  }, [customers]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function showConfirm(opts: {
    title: string;
    description: string;
    confirmLabel: string;
    confirmClass?: string;
    onConfirm: () => void;
  }) {
    setConfirm(opts);
  }

  function handleExport() {
    if (customers.length === 0) {
      toast.error("Koi customer nahi hai export karne ke liye");
      return;
    }
    const data = customers.map((c) => ({
      Name: c.name,
      Phone: c.phone,
      Address: c.address,
      "Net MB": c.netMb,
      Fees: c.fees,
      Date: c.date,
      Status: c.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, `muna-customers-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Excel file download ho gayi!");
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  }

  function handleBulk(status: PaymentStatus) {
    if (selected.size === 0) return;
    const count = selected.size;
    showConfirm({
      title: `Mark as ${status}?`,
      description: `${count} selected customer(s) will be marked as ${status}.`,
      confirmLabel: `Yes, Mark ${status}`,
      confirmClass:
        status === "Paid"
          ? "rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          : "rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700",
      onConfirm: async () => {
        await Promise.all(
          [...selected].map((id) => updateCustomer({ data: { id, patch: { status } } })),
        );
        await refresh();
        setSelected(new Set());
        setConfirm(null);
        toast.success(`${count} customer(s) marked as ${status}`);
      },
    });
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <Toaster richColors position="top-right" />

      <header className="mb-5 flex flex-wrap items-start justify-between gap-3 sm:mb-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground sm:h-12 sm:w-12">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              All Customers
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {customers.length} total record{customers.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              await refresh();
              toast.success("Refreshed");
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-[var(--shadow-card)] transition-colors hover:bg-muted sm:px-3.5"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-[var(--shadow-card)] transition-colors hover:bg-muted sm:px-3.5"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </header>

      {customers.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <PencilLine className="h-4 w-4" />
            Edit Selected Status:
          </span>
          <button
            type="button"
            onClick={() => handleBulk("Paid")}
            disabled={selected.size === 0}
            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
          >
            Mark Selected Paid
          </button>
          <button
            type="button"
            onClick={() => handleBulk("Unpaid")}
            disabled={selected.size === 0}
            className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300"
          >
            Mark Selected Unpaid
          </button>
          {selected.size > 0 && (
            <span className="text-sm text-muted-foreground">{selected.size} selected</span>
          )}
        </div>
      )}

      {customers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No customers yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by adding your first customer.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-button)] transition-colors hover:bg-[var(--primary-hover)]"
          >
            <UserPlus className="h-4 w-4" />
            Add Customer
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or phone..."
                className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-3.5 text-sm text-foreground shadow-[var(--shadow-card)] placeholder:text-muted-foreground/70 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
              className="rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium text-foreground shadow-[var(--shadow-card)] focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>

          {/* Mobile: card list */}
          <div className="space-y-3 sm:hidden">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-[var(--shadow-card)]">
                No customers match your filters.
              </div>
            ) : (
              filtered.map((c) => (
                <CustomerCard
                  key={c.id}
                  c={c}
                  isSelected={selected.has(c.id)}
                  onSelect={() => toggleSelect(c.id)}
                  onEdit={() => setEditing(c)}
                  onDelete={() => {
                    showConfirm({
                      title: "Delete Customer?",
                      description: `"${c.name}" permanently delete ho jayega. Yeh action undo nahi ho sakta.`,
                      confirmLabel: "Delete",
                      confirmClass:
                        "rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-destructive/90",
                      onConfirm: async () => {
                        await remove(c.id);
                        setConfirm(null);
                        toast.success("Customer removed");
                      },
                    });
                  }}
                  onCycleStatus={() => toggleStatus(c.id)}
                  onPrint={() => setBilling(c)}
                />
              ))
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 text-left font-semibold">
                      <input
                        type="checkbox"
                        checked={filtered.length > 0 && selected.size === filtered.length}
                        onChange={toggleSelectAll}
                        className="rounded border-border cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Phone</th>
                    <th className="px-4 py-3 text-left font-semibold">Net MB</th>
                    <th className="px-4 py-3 text-left font-semibold">Fees</th>
                    <th className="px-4 py-3 text-left font-semibold">Address</th>
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        No customers match your filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => {
                      const isOpen = expanded === c.id;
                      return (
                        <FragmentRow
                          key={c.id}
                          c={c}
                          isOpen={isOpen}
                          isSelected={selected.has(c.id)}
                          onSelect={() => toggleSelect(c.id)}
                          onToggle={() => setExpanded(isOpen ? null : c.id)}
                          onEdit={() => setEditing(c)}
                          onDelete={() => {
                            showConfirm({
                              title: "Delete Customer?",
                              description: `"${c.name}" permanently delete ho jayega. Yeh action undo nahi ho sakta.`,
                              confirmLabel: "Delete",
                              confirmClass:
                                "rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-destructive/90",
                              onConfirm: async () => {
                                await remove(c.id);
                                setConfirm(null);
                                toast.success("Customer removed");
                              },
                            });
                          }}
                          onCycleStatus={() => toggleStatus(c.id)}
                          onPrint={() => setBilling(c)}
                        />
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <footer className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:mt-6 sm:p-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 sm:gap-6">
              <RingStat
                label="Total Customers"
                value={customers.length}
                percent={100}
                display={String(customers.length)}
                tone="primary"
              />
              <RingStat
                label="Paid"
                value={stats.paid}
                percent={customers.length ? (stats.paid / customers.length) * 100 : 0}
                tone="emerald"
              />
              <RingStat
                label="Unpaid"
                value={stats.unpaid}
                percent={customers.length ? (stats.unpaid / customers.length) * 100 : 0}
                tone="rose"
              />
              <RingStat
                label="Total Fees"
                value={stats.totalFees}
                percent={100}
                display={stats.totalFees.toLocaleString()}
                tone="foreground"
              />
              <RingStat
                label="Paid Fees"
                value={stats.paidFees}
                percent={stats.totalFees ? (stats.paidFees / stats.totalFees) * 100 : 0}
                display={stats.paidFees.toLocaleString()}
                tone="emerald"
              />
              <RingStat
                label="Remaining Fees"
                value={stats.remainingFees}
                percent={stats.totalFees ? (stats.remainingFees / stats.totalFees) * 100 : 0}
                display={stats.remainingFees.toLocaleString()}
                tone="amber"
              />
            </div>
          </footer>
        </>
      )}

      <EditCustomerDialog
        customer={editing}
        onClose={() => setEditing(null)}
        onSave={(id, patch) => update(id, patch)}
      />

      <BillDialog customer={billing} onClose={() => setBilling(null)} />

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ""}
        description={confirm?.description ?? ""}
        confirmLabel={confirm?.confirmLabel ?? ""}
        confirmClass={confirm?.confirmClass}
        onConfirm={confirm?.onConfirm ?? (() => {})}
        onCancel={() => setConfirm(null)}
      />
    </main>
  );
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              confirmClass ??
              "rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function BillDialog({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  const slipRef = useRef<HTMLDivElement | null>(null);
  const [busy, setBusy] = useState<"share" | "save" | null>(null);

  async function captureSlip(): Promise<Blob | null> {
    const node = slipRef.current;
    if (!node) return null;
    const { toBlob } = await import("html-to-image");
    return await toBlob(node, { pixelRatio: 2, cacheBust: true, backgroundColor: "#ffffff" });
  }

  function buildBillText(c: Customer) {
    return (
      `*Muna Networking*\n\n` +
      `Name: ${c.name}\n` +
      `Net MB: ${c.netMb} MB\n` +
      `Date: ${formatBillDate(c.date)}\n` +
      `Bill: ${c.fees}\n` +
      `Status: ${c.status}`
    );
  }

  function openWhatsAppText(c: Customer) {
    const text = encodeURIComponent(buildBillText(c));
    const phone = c.phone.replace(/[^\d]/g, "");
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleWhatsApp() {
    if (!customer || busy) return;
    setBusy("share");
    try {
      const blob = await captureSlip();
      if (blob) {
        const file = new File([blob], `bill-${customer.name}.png`, { type: "image/png" });
        const navAny = navigator as any;
        if (navAny.canShare?.({ files: [file] })) {
          try {
            await navAny.share({ files: [file], title: "Bill", text: buildBillText(customer) });
            return;
          } catch (err: any) {
            if (err?.name === "AbortError") return;
          }
        }
      }
      openWhatsAppText(customer);
    } catch (err) {
      console.error(err);
      toast.error("Could not share bill");
    } finally {
      setBusy(null);
    }
  }

  async function handleSave() {
    if (!customer || busy) return;
    setBusy("save");
    try {
      const blob = await captureSlip();
      if (!blob) {
        toast.error("Could not generate image");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bill-${customer.name.replace(/\s+/g, "_")}-${customer.date || "slip"}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Saved to your device");
    } catch (err) {
      console.error(err);
      toast.error("Could not save bill");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={!!customer} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-sm overflow-hidden p-0">
        {customer && (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>Muna Networking Bill</DialogTitle>
            </DialogHeader>
            <div ref={slipRef} className="bg-card">
              <img
                src={billBanner}
                alt="Muna Networking"
                className="block w-full h-auto object-cover"
              />
              <div className="h-1.5 w-full bg-gradient-to-r from-primary via-emerald-500 to-primary" />
              <div className="relative px-6 pb-6 pt-5">
                <div className="overflow-hidden rounded-xl border border-border bg-muted/40">
                  <BillRow
                    icon={<User className="h-3.5 w-3.5" />}
                    label="Name"
                    value={customer.name}
                  />
                  <BillRow
                    icon={<Wifi className="h-3.5 w-3.5" />}
                    label="Net MB"
                    value={`${customer.netMb} MB`}
                  />
                  <BillRow
                    icon={<CalendarDays className="h-3.5 w-3.5" />}
                    label="Date"
                    value={formatBillDate(customer.date)}
                    last
                  />
                </div>
                <div className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-emerald-500 p-[1.5px] shadow-[var(--shadow-card)]">
                  <div className="relative overflow-hidden rounded-[15px] bg-card px-5 py-5">
                    <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
                    <div className="pointer-events-none absolute -left-6 -bottom-8 h-20 w-20 rounded-full bg-emerald-500/10 blur-2xl" />
                    <div className="relative flex items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary/80">
                          Amount Due
                        </span>
                        <span className="mt-1 text-xs font-medium text-muted-foreground">
                          Monthly subscription
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="bg-gradient-to-br from-primary to-emerald-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
                          {Number(customer.fees).toLocaleString()}
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          PKR
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 border-t border-dashed border-border pt-3">
                  <p className="text-center text-[12px] font-bold text-black dark:text-white">
                    Thank you for choosing Muna Networking
                  </p>
                </div>
                {customer.status === "Paid" && (
                  <img
                    src={paidStamp}
                    alt="Paid stamp"
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-1/3 h-40 w-40 -translate-x-1/2 -translate-y-1/2 -rotate-12 select-none opacity-80"
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 px-6 pb-6">
              <button
                type="button"
                onClick={handleWhatsApp}
                disabled={busy !== null}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition-colors hover:bg-emerald-600 disabled:opacity-60"
              >
                <Share2 className="h-4 w-4" />
                {busy === "share" ? "Sharing..." : "WhatsApp"}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={busy !== null}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm font-semibold text-foreground shadow-[var(--shadow-card)] transition-colors hover:bg-muted disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {busy === "save" ? "Saving..." : "Save"}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function BillRow({
  label,
  value,
  icon,
  last,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 text-sm ${last ? "" : "border-b border-border/60"}`}
    >
      <span className="flex items-center gap-2 font-medium text-muted-foreground">
        {icon ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            {icon}
          </span>
        ) : null}
        {label}
      </span>
      <span className="text-right font-bold text-foreground">{value}</span>
    </div>
  );
}

type StatTone = "primary" | "foreground" | "emerald" | "rose" | "amber";

const TONE_COLORS: Record<StatTone, { stroke: string; track: string; text: string }> = {
  primary: { stroke: "stroke-primary", track: "stroke-primary/15", text: "text-primary" },
  foreground: {
    stroke: "stroke-foreground",
    track: "stroke-foreground/15",
    text: "text-foreground",
  },
  emerald: {
    stroke: "stroke-emerald-500",
    track: "stroke-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  rose: {
    stroke: "stroke-rose-500",
    track: "stroke-rose-500/15",
    text: "text-rose-600 dark:text-rose-400",
  },
  amber: {
    stroke: "stroke-amber-500",
    track: "stroke-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
  },
};

function RingStat({
  label,
  percent,
  display,
  value,
  tone,
}: {
  label: string;
  percent: number;
  value: number;
  display?: string;
  tone: StatTone;
}) {
  const t = TONE_COLORS[tone];
  const size = 96;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className={t.track}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${t.stroke} transition-[stroke-dashoffset] duration-500`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
          <span className={`text-[11px] font-extrabold tabular-nums ${t.text}`}>
            {display ?? value}
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground">
            {Math.round(clamped)}%
          </span>
        </div>
      </div>
      <span className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function StatusPill({ status }: { status: PaymentStatus }) {
  const cls =
    status === "Paid"
      ? "border-emerald-400/60 bg-transparent text-emerald-600 dark:border-emerald-500/50 dark:text-emerald-400"
      : "border-rose-400/60 bg-transparent text-rose-600 dark:border-rose-500/50 dark:text-rose-400";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${cls}`}
    >
      {status}
    </span>
  );
}

function FragmentRow({
  c,
  isOpen,
  isSelected,
  onSelect,
  onToggle,
  onEdit,
  onDelete,
  onCycleStatus,
  onPrint,
}: {
  c: Customer;
  isOpen: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCycleStatus: () => void;
  onPrint: () => void;
}) {
  return (
    <>
      <tr
        className={`border-b border-border last:border-b-0 transition-colors hover:bg-muted/30 ${isSelected ? "bg-primary/5" : ""}`}
      >
        <td className="px-4 py-3.5">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="rounded border-border cursor-pointer"
          />
        </td>
        <td className="px-4 py-3.5 font-bold text-foreground">{c.name}</td>
        <td className="px-4 py-3.5 text-muted-foreground">{c.phone}</td>
        <td className="px-4 py-3.5 font-medium text-foreground">{c.netMb} MB</td>
        <td className="px-4 py-3.5 font-bold text-foreground">{c.fees}</td>
        <td className="px-4 py-3.5 text-muted-foreground">{c.address || "—"}</td>
        <td className="px-4 py-3.5 text-muted-foreground">{c.date || "—"}</td>
        <td className="px-4 py-3.5">
          <button type="button" onClick={onCycleStatus} aria-label="Cycle status">
            <StatusPill status={c.status} />
          </button>
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={onToggle}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <Receipt className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
      {isOpen && (
        <tr className="border-b border-border bg-muted/20">
          <td colSpan={9} className="px-4 py-4">
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span className="text-foreground">{c.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-foreground">{c.address || "No address provided"}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function CustomerCard({
  c,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onCycleStatus,
  onPrint,
}: {
  c: Customer;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCycleStatus: () => void;
  onPrint: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] ${isSelected ? "ring-2 ring-primary/30" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="mt-1 rounded border-border cursor-pointer"
          />
          <div className="min-w-0">
            <h3 className="truncate text-[17px] font-bold leading-tight text-foreground">
              {c.name}
            </h3>
            <p className="mt-1 truncate text-[13px] text-muted-foreground">{c.phone}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCycleStatus}
          aria-label="Cycle status"
          className="shrink-0"
        >
          <StatusPill status={c.status} />
        </button>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4">
        <CardField label="NET MB" value={`${c.netMb} MB`} />
        <CardField label="FEES" value={String(c.fees)} bold />
      </div>
      <div className="mt-5">
        <CardField label="ADDRESS" value={c.address || "—"} multiline />
      </div>
      <div className="mt-5">
        <CardField label="DATE" value={formatBillDate(c.date)} />
      </div>
      <div className="mt-5 flex items-center justify-end gap-1 border-t border-border pt-3">
        <button
          type="button"
          onClick={onPrint}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
        >
          <Receipt className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Pencil className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  );
}

function CardField({
  label,
  value,
  bold,
  multiline,
}: {
  label: string;
  value: string;
  bold?: boolean;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1.5 text-[15px] text-foreground ${bold ? "font-bold" : "font-semibold"} ${multiline ? "break-words leading-snug" : "truncate"}`}
      >
        {value}
      </p>
    </div>
  );
}
