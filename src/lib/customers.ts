import { useEffect, useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

export type PaymentStatus = "Paid" | "Unpaid";

export type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  netMb: number;
  fees: number;
  date: string;
  status: PaymentStatus;
  createdAt: number;
};

const getDB = () => {
  return (env as any).customers_db;
};

export const getCustomers = createServerFn({ method: "GET" }).handler(async () => {
  const db = getDB();
  const { results } = await db
    .prepare("SELECT * FROM customers ORDER BY name COLLATE NOCASE ASC")
    .all();
  return results as Customer[];
});

export const addCustomer = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: Omit<Customer, "id" | "createdAt"> }) => {
    const db = getDB();
    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      name: data.name ?? "",
      phone: data.phone ?? "",
      address: data.address ?? "",
      netMb: Number(data.netMb) || 0,
      fees: Number(data.fees) || 0,
      date: data.date ?? "",
      status: data.status ?? "Unpaid",
    };
    await db
      .prepare(
        "INSERT INTO customers (id, name, phone, address, netMb, fees, date, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(
        newCustomer.id, newCustomer.name, newCustomer.phone, newCustomer.address,
        newCustomer.netMb, newCustomer.fees, newCustomer.date, newCustomer.status, newCustomer.createdAt
      )
      .run();
    return newCustomer;
  }
);

export const removeCustomer = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: string }) => {
    const db = getDB();
    await db.prepare("DELETE FROM customers WHERE id = ?").bind(data).run();
    return { success: true };
  }
);

export const removeAllCustomers = createServerFn({ method: "POST" }).handler(async () => {
  const db = getDB();
  await db.prepare("DELETE FROM customers").run();
  return { success: true };
});

export const updateCustomer = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { id: string; patch: Partial<Omit<Customer, "id" | "createdAt">> } }) => {
    const db = getDB();
    const fields = Object.keys(data.patch).map((k) => `${k} = ?`).join(", ");
    const values = [...Object.values(data.patch), data.id];
    await db.prepare(`UPDATE customers SET ${fields} WHERE id = ?`).bind(...values).run();
    return { success: true };
  }
);

export const toggleCustomerStatus = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { id: string; currentStatus: PaymentStatus } }) => {
    const db = getDB();
    const newStatus = data.currentStatus === "Paid" ? "Unpaid" : "Paid";
    await db.prepare("UPDATE customers SET status = ? WHERE id = ?").bind(newStatus, data.id).run();
    return { success: true };
  }
);

export const setAllStatus = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: PaymentStatus }) => {
    const db = getDB();
    await db.prepare("UPDATE customers SET status = ?").bind(data).run();
    return { success: true };
  }
);

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  const refresh = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data ?? []);
    } catch {
      setCustomers([]);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return {
    customers,
    refresh,
    add: async (c: Omit<Customer, "id" | "createdAt">) => {
      await addCustomer({ data: c });
      await refresh();
    },
    remove: async (id: string) => {
      await removeCustomer({ data: id });
      await refresh();
    },
    removeAll: async () => {
      await removeAllCustomers();
      await refresh();
    },
    update: async (id: string, patch: Partial<Omit<Customer, "id" | "createdAt">>) => {
      await updateCustomer({ data: { id, patch } });
      await refresh();
    },
    toggleStatus: async (id: string) => {
      const c = customers.find((c) => c.id === id);
      if (!c) return;
      await toggleCustomerStatus({ data: { id, currentStatus: c.status } });
      await refresh();
    },
    setStatusAll: async (status: PaymentStatus) => {
      await setAllStatus({ data: status });
      await refresh();
    },
  };
}