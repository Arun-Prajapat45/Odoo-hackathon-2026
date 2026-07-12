import "./globals.css";
import Link from 'next/link';

export const metadata = {
  title: "TransitOps — Fleet Management",
  description: "Smart Transport Operations Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-slate-50 text-slate-900 font-sans">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-blue-400">TransitOps</h1>
            <p className="text-sm text-slate-400 mt-1">Smart Transport Platform</p>
          </div>
          <nav className="flex-1 mt-6 px-4 space-y-2">
            <Link href="/" className="flex items-center px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link href="/drivers" className="flex items-center px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
              <span className="font-medium">Driver Management</span>
            </Link>
            <Link href="/trips" className="flex items-center px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
              <span className="font-medium">Trip Management</span>
            </Link>
            <Link href="/fuel" className="flex items-center px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
              <span className="font-medium">Fuel Logs</span>
            </Link>
            <Link href="/expenses" className="flex items-center px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors">
              <span className="font-medium">Expenses</span>
            </Link>
          </nav>
          <div className="p-4 border-t border-slate-800 text-sm text-slate-400">
            Hackathon Build
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header Mobile / Desktop */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
            <div className="font-semibold text-lg md:hidden">TransitOps</div>
            <div className="hidden md:block text-slate-600 font-medium">Platform Overview</div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                A
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
