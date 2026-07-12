import "./globals.css";
import Link from 'next/link';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import ThemeToggle from '@/components/ThemeToggle';
import LogoutButton from '@/components/LogoutButton';
import { LayoutDashboard, Users, Map, Fuel, Receipt, Wrench, Truck, BarChart3 } from 'lucide-react';

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

  // Define navigation rules
  const navItems = [
    { name: 'Dashboard', href: '/', icon: <LayoutDashboard size={20} />, roles: ['Admin', 'Fleet Manager', 'Driver', 'Safety Officer', 'Finance'] },
    { name: 'Vehicles', href: '/vehicles', icon: <Truck size={20} />, roles: ['Admin', 'Fleet Manager'] },
    { name: 'Driver Management', href: '/drivers', icon: <Users size={20} />, roles: ['Admin', 'Fleet Manager', 'Safety Officer'] },
    { name: 'Trip Management', href: '/trips', icon: <Map size={20} />, roles: ['Admin', 'Fleet Manager', 'Driver'] },
    { name: 'Maintenance Logs', href: '/maintenance', icon: <Wrench size={20} />, roles: ['Admin', 'Fleet Manager'] },
    { name: 'Fuel Logs', href: '/fuel', icon: <Fuel size={20} />, roles: ['Admin', 'Fleet Manager', 'Finance', 'Driver'] },
    { name: 'Expenses', href: '/expenses', icon: <Receipt size={20} />, roles: ['Admin', 'Fleet Manager', 'Finance'] },
    { name: 'Reports', href: '/reports', icon: <BarChart3 size={20} />, roles: ['Admin', 'Fleet Manager', 'Finance'] },
  ];

  const allowedNavs = user ? navItems : [];

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors">
        
        {/* Hide sidebar on login page (no user) */}
        {user && (
          <aside className="w-64 bg-slate-900 dark:bg-slate-950 text-white flex-col hidden md:flex border-r border-slate-800">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-blue-400">TransitOps</h1>
              <p className="text-sm text-slate-400 mt-1">Smart Transport Platform</p>
            </div>
            <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto">
              {allowedNavs.map((nav) => (
                <Link key={nav.name} href={nav.href} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
                  <span className="text-slate-400">{nav.icon}</span>
                  <span className="font-medium">{nav.name}</span>
                </Link>
              ))}
            </nav>
            
            <div className="p-4 border-t border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.roleName}</p>
                </div>
              </div>
              <LogoutButton />
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden w-full">
          {/* Topbar */}
          {user && (
            <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 transition-colors shrink-0">
              <div className="font-semibold text-lg md:hidden">TransitOps</div>
              <div className="hidden md:block text-slate-600 dark:text-slate-300 font-medium">Platform Overview</div>
              
              <div className="flex items-center gap-4">
                <ThemeToggle />
              </div>
            </header>
          )}

          <div className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
