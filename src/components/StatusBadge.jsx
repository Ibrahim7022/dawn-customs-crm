import { useCrmStore } from '../store/crmStore';

function StatusBadge({ status }) {
  const statuses = useCrmStore((state) => state.statuses);
  const statusData = statuses.find(s => s.id === status);
  
  const color = statusData?.color || '#6366f1';
  const name = statusData?.name || status;

  return (
    <span 
      className="status-badge"
      style={{ 
        backgroundColor: `${color}20`,
        color: color
      }}
    >
      {name}
    </span>
  );
}

export default StatusBadge;
