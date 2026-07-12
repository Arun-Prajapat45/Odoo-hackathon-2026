export default function StatusBadge({ value, type = 'driver' }) {
  if (!value) return null;
  const v = value.toUpperCase().replace(/_/g, '-');
  const displayVal = value.replace(/_/g, ' ');

  // Return solid styled badges matching mockup
  const styleMap = {
    'AVAILABLE': { background: 'var(--go-green)', color: 'white', border: 'none' },
    'ON-TRIP':   { background: 'var(--transit-blue)', color: 'white', border: 'none' },
    'OFF-DUTY':  { background: 'var(--off-duty)', color: 'white', border: 'none' },
    'SUSPENDED': { background: 'var(--orange-solid)', color: 'white', border: 'none' },
    'IN-SHOP':   { background: 'var(--orange-solid)', color: 'white', border: 'none' },
    'COMPLETED': { background: 'var(--go-green)', color: 'white', border: 'none' },
    'ACTIVE':    { background: 'var(--go-green)', color: 'white', border: 'none' },
  };

  const map = {
    'AVAILABLE': 'badge-available',
    'ON-TRIP':   'badge-on-trip',
    'OFF-DUTY':  'badge-off-duty',
    'SUSPENDED': 'badge-suspended',
    'IN-SHOP':   'badge-in-shop',
    'RETIRED':   'badge-retired',
    'ACTIVE':    'badge-active',
    'CLOSED':    'badge-closed',
    'DRAFT':     'badge-draft',
    'DISPATCHED':'badge-dispatched',
    'COMPLETED': 'badge-completed',
    'CANCELLED': 'badge-cancelled',
    'INFO':      'badge-info',
    'WARNING':   'badge-warning',
    'CRITICAL':  'badge-critical',
    'LOW':       'badge-low',
    'MEDIUM':    'badge-medium',
    'HIGH':      'badge-high',
  };

  const cls = map[v] || 'badge-off-duty';
  const customStyle = styleMap[v] || {};
  
  return <span className={`badge ${cls}`} style={customStyle}>{displayVal}</span>;
}
