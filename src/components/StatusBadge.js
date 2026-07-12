export default function StatusBadge({ value, type = 'driver' }) {
  if (!value) return null;
  const v = value.toUpperCase().replace(/_/g, '-');
  const displayVal = value.replace(/_/g, ' ');

  const map = {
    // Driver statuses
    'AVAILABLE': 'badge-available',
    'ON-TRIP':   'badge-on-trip',
    'OFF-DUTY':  'badge-off-duty',
    'SUSPENDED': 'badge-suspended',
    // Vehicle statuses
    'IN-SHOP':   'badge-in-shop',
    'RETIRED':   'badge-retired',
    // Maintenance
    'ACTIVE':    'badge-active',
    'CLOSED':    'badge-closed',
    // Trips
    'DRAFT':     'badge-draft',
    'DISPATCHED':'badge-dispatched',
    'COMPLETED': 'badge-completed',
    'CANCELLED': 'badge-cancelled',
    // Notification types
    'INFO':      'badge-info',
    'WARNING':   'badge-warning',
    'CRITICAL':  'badge-critical',
    // Priority
    'LOW':       'badge-low',
    'MEDIUM':    'badge-medium',
    'HIGH':      'badge-high',
  };

  let icon = '';
  if (['AVAILABLE', 'ON-TRIP'].includes(v)) icon = '✓ ';
  else if (['SUSPENDED', 'CANCELLED', 'CRITICAL'].includes(v)) icon = '⊗ ';
  else if (['OFF-DUTY', 'RETIRED'].includes(v)) icon = '- ';

  const cls = map[v] || 'badge-off-duty';
  return <span className={`badge ${cls}`}>{icon}{displayVal}</span>;
}
