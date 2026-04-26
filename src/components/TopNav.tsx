import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { UserPlus, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import munaLogo from "@/assets/muna-logo.png";

export function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdd = location.pathname === "/";
  const isList = location.pathname === "/customers";

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    navigate({ to: "/login" });
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2 sm:px-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src={munaLogo}
            alt="Muna Networking logo"
            className="h-20 w-auto sm:h-24 object-contain"
          />
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            to="/"
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
              isAdd
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-button)]"
                : "text-foreground hover:bg-muted",
            )}
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Customer</span>
          </Link>
          <Link
            to="/customers"
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
              isList
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-button)]"
                : "text-foreground hover:bg-muted",
            )}
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">All Customers</span>
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
