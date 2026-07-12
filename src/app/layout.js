import "./globals.css";
import AppLayout from "@/components/AppLayout";

export const metadata = {
  title: "TransitOps — Smart Transport Operations Platform",
  description: "Manage fleet vehicles, documents, and status workflows.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
