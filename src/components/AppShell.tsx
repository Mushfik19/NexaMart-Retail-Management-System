'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCustomerDisplay = pathname === '/pos/customer-display';
  const isLogin = pathname === '/login';

  if (isCustomerDisplay) {
    return <main className="min-h-screen bg-slate-950 text-white">{children}</main>;
  }

  if (isLogin) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100  font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-slate-100 ">
          {children}
        </main>
      </div>
    </div>
  );
}
