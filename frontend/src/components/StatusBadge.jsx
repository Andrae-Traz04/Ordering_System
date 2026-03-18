const labels = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  completed: 'Completed',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      {labels[status] || status}
    </span>
  )
}