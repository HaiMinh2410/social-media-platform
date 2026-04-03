import React from "react";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function DashboardHeader({ title, description, children }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="grid gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 uppercase">
          {title}
        </h1>
        {description && (
          <p className="text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
