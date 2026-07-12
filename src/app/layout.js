import "./globals.css";
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import AppNavigation from '@/components/AppNavigation';

export const metadata = {
  title: "TransitOps — Smart Fleet Operations",
  description: "Enterprise Transport Operations Platform with Real-Time AI Telemetry Copilot",
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('transitops_token')?.value;
  let user = null;
  if (token) {
    user = await verifyToken(token);
  }

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden antialiased transition-colors duration-200">
        <AppNavigation user={user}>
          {children}
        </AppNavigation>
      </body>
    </html>
  );
}
