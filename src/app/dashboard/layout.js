import { headers, cookies } from 'next/headers';
import DashboardShell from '@/components/DashboardShell';
import { verifyToken, ROLE_ID_MAP } from '@/lib/auth';

export default async function DashboardLayout({ children }) {
  const reqHeaders = await headers();
  let userEmail = reqHeaders.get('x-user-email') || 'user@transitops.com';
  let userRole = reqHeaders.get('x-user-role') || 'Driver';

  const cookieStore = await cookies();
  const token = cookieStore.get('transitops_token')?.value;
  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      userEmail = payload.email || userEmail;
      userRole = payload.roleName || ROLE_ID_MAP[payload.roleId] || userRole;
    }
  }

  return (
    <DashboardShell userRole={userRole} userEmail={userEmail}>
      {children}
    </DashboardShell>
  );
}
