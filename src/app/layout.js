import "./globals.css";

export const metadata = {
  title: "TransitOps — Fleet Management",
  description: "Smart Transport Operations Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
