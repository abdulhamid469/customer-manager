import { createFileRoute } from "@tanstack/react-router";
import { AddCustomerPage } from "@/components/AddCustomerPage";
import { TopNav } from "@/components/TopNav";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Add Customer | Customer Manager" },
      { name: "description", content: "Add a new customer with billing details and payment status." },
    ],
  }),
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <AddCustomerPage />
    </div>
  );
}
