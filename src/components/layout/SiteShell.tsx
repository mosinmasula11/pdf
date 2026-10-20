import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";
import { ToolBreadcrumb } from "@/components/layout/ToolBreadcrumb";
import { CurrencyFormatSelector } from "@/components/tools/CurrencyFormat";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader />
      <main className="min-h-[calc(100vh-200px)]">
        <ToolBreadcrumb />
        <CurrencyFormatSelector />
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
