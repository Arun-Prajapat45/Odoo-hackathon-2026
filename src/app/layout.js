import "./globals.css";
import Link from 'next/link';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import ThemeToggle from '@/components/ThemeToggle';
import LogoutButton from '@/components/LogoutButton';
import { LayoutDashboard, Users, Map, Fuel, Receipt, Wrench, Truck, BarChart3, Bell } from 'lucide-react';

export const metadata = {
  title: "TransitOps — Fleet Management",
  description: "Smart Transport Operations Platform",
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('transitops_token')?.value;
  let user = null;
  if (token) {
    user = await verifyToken(token);
  }

  const navItems = [
    { name: 'Dashboard', href: '/', icon: <LayoutDashboard size={18} /> },
    { name: 'Vehicles', href: '/vehicles', icon: <Truck size={18} /> },
    { name: 'Drivers', href: '/drivers', icon: <Users size={18} /> },
    { name: 'Trips', href: '/trips', icon: <Map size={18} /> },
    { name: 'Maintenance', href: '/maintenance', icon: <Wrench size={18} /> },
    { name: 'Fuel Logs', href: '/fuel', icon: <Fuel size={18} /> },
    { name: 'Expenses', href: '/expenses', icon: <Receipt size={18} /> },
    { name: 'Reports', href: '/reports', icon: <BarChart3 size={18} /> },
  ];

  const allowedNavs = user ? navItems : [];

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
        
        {/* ── Sidebar ── */}
        {user && (
          <aside className="w-[260px] flex-shrink-0 hidden md:flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800/60">
            {/* Logo */}
            <div className="px-6 pt-7 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Truck size={18} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white tracking-tight leading-none">TransitOps</h1>
                  <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-0.5">FLEET MANAGEMENT</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.1em] px-3 pb-2 pt-1">Navigation</p>
              {allowedNavs.map((nav) => (
                <Link
                  key={nav.name}
                  href={nav.href}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                >
                  <span className="text-slate-500 group-hover:text-blue-400 transition-colors">{nav.icon}</span>
                  <span className="text-[13px] font-medium">{nav.name}</span>
                </Link>
              ))}
            </nav>
            
            {/* User Card */}
            <div className="px-3 pb-4 pt-3 border-t border-slate-800/60 mt-auto">
              <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white/[0.03]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.roleName}</p>
                </div>
              </div>
              <div className="mt-2 px-1">
                <LogoutButton />
              </div>
            </div>
          </aside>
        )}

        {/* ── Main Content Area ── */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top Bar */}
          {user && (
            <header className="h-14 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/60 flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-2">
                <div className="md:hidden flex items-center gap-2">
                  <Truck size={18} className="text-blue-400" />
                  <span className="font-bold text-white text-sm">TransitOps</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors">
                  <Bell size={18} />
                </button>
                <ThemeToggle />
                <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-300 font-medium">{user.name}</span>
                </div>
              </div>
            </header>
          )}

          {/* Page Content */}
          <div className="flex-1 overflow-auto bg-slate-950">
            <div className="p-6 max-w-[1600px] mx-auto">
              {children}
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
