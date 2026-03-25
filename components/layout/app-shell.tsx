import type { ReactNode } from "react";

type AppShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function AppShell({ title, subtitle, children, actions }: AppShellProps) {
  return (
    <main className="grid-surface min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-kiosk backdrop-blur lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex rounded-full border border-brand-100 bg-brand-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              University Equipment Services
            </span>
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950">{title}</h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">{subtitle}</p>
            </div>
          </div>
          {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </main>
  );
}

