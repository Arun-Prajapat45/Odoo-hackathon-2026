import './globals.css';

export const metadata = {
  title: 'TransitOps — Fleet Management Platform',
  description: 'Fleet operations, driver management, and real-time logistics platform.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
