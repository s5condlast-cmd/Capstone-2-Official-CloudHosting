import React from 'react';
import { Link } from 'react-router-dom';

export const authInputClass = 'w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 dark:border-zinc-700';
export const authButtonClass = 'w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed';
export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return <main className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100 flex items-center justify-center p-6">
    <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <Link to="/" className="text-sm font-semibold text-blue-700 dark:text-blue-400">STI Marikina · Practicum Portal</Link>
      <h1 className="mt-6 mb-5 text-2xl font-semibold">{title}</h1>
      {children}
    </section>
  </main>;
}
