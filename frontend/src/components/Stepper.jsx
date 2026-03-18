const STATUS_ORDER = ['pending', 'processing', 'shipped', 'completed']
const STATUS_LABELS = {
  pending: 'Pending', processing: 'Processing',
  shipped: 'Shipped', completed: 'Completed',
}

export default function Stepper({ currentStatus }) {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus)

  return (
    <div className="stepper">
      {STATUS_ORDER.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div className={`step ${i < currentIdx ? 'done' : i === currentIdx ? 'current' : ''}`}>
            <div className="step-circle">
              {i < currentIdx ? '✓' : i + 1}
            </div>
            <div className="step-label">{STATUS_LABELS[s]}</div>
          </div>
          {i < STATUS_ORDER.length - 1 && (
            <div className={`step-line ${i < currentIdx ? 'done' : ''}`} />
          )}
        </div>
      ))}
    </div>
  )
}