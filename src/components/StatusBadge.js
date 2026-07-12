export default function StatusBadge({ value, type = 'driver' }) {
  if (!value) return null;
  const v = value.toUpperCase().replace(/_/g, '-');

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

  const cls = map[v] || 'badge-off-duty';
  return <span className={`badge ${cls}`}>{value.replace(/_/g, ' ')}</span>;
}
