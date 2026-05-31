import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";
import { Search, Bell } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-xl px-4">
            <SidebarTrigger />
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search collections, assets…"
                className="w-full h-9 rounded-md border border-border bg-surface pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-raised transition">
                <Bell className="h-4 w-4" />
              </button>
              <div className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-border bg-surface text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                <span className="text-muted-foreground">Markets</span>
                <span className="font-mono tabular-nums">Open</span>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
