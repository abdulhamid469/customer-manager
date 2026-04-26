import { createFileRoute } from "@tanstack/react-router";
import { AllCustomersPage } from "@/components/AllCustomersPage";
import { TopNav } from "@/components/TopNav";

export const Route = createFileRoute("/customers")({
  component: CustomersRoute,
  head: () => ({
    meta: [
      { title: "All Customers | Customer Manager" },
      {
        name: "description",
        content: "View, manage, and track all customers and their payment status.",
      },
    ],
  }),
});

function CustomersRoute() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <AllCustomersPage />
    </div>
  );
}
