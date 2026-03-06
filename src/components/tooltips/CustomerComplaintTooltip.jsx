import { usePanelContext } from '../../contexts/PanelContext'

export default function CustomerComplaintTooltip({ complaint, position, onClose }) {
  const { selectedPersona, selectedCharacteristic } = usePanelContext()
  const isLeakageManagerDark = selectedPersona === 'Leakage Manager' && selectedCharacteristic === 'Dark'
  
  if (!complaint || !position) return null

  // Calculate elapsed time from reported timestamp
  const calculateElapsedTime = (timestamp) => {
    if (!timestamp) return null
    
    const reportedDate = new Date(timestamp)
    const now = new Date()
    const diffMs = now - reportedDate
    
    const seconds = Math.floor(diffMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)
    
    const parts = []
    
    if (years > 0) {
      parts.push(`${years}y`)
    }
    if (months % 12 > 0 && years > 0) {
      parts.push(`${months % 12}mo`)
    } else if (months > 0 && years === 0) {
      parts.push(`${months}mo`)
    }
    if (days % 30 > 0 && (months > 0 || years > 0)) {
      parts.push(`${days % 30}d`)
    } else if (days > 0 && months === 0 && years === 0) {
      parts.push(`${days}d`)
    }
    if (hours % 24 > 0 && days > 0) {
      parts.push(`${hours % 24}h`)
    } else if (hours > 0 && days === 0) {
      parts.push(`${hours}h`)
    }
    if (minutes % 60 > 0 && hours > 0) {
      parts.push(`${minutes % 60}m`)
    } else if (minutes > 0 && hours === 0) {
      parts.push(`${minutes}m`)
    }
    if (seconds % 60 > 0 && minutes > 0 && parts.length < 3) {
      parts.push(`${seconds % 60}s`)
    } else if (seconds > 0 && minutes === 0) {
      parts.push(`${seconds}s`)
    }
    
    // Return the first 3 most significant units
    return parts.slice(0, 3).join(' ') || '0s'
  }

  const elapsed = isLeakageManagerDark ? calculateElapsedTime(complaint.properties?.reportedTimestamp) : null
  const reportedTime = complaint.properties?.reportedTime
  const reportedDate = complaint.properties?.reportedDate

  return (
    <div
      className="customer-complaint-tooltip-container"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        pointerEvents: 'auto'
      }}
      onMouseEnter={() => {
        // Keep tooltip visible when hovering over it
      }}
      onMouseLeave={() => {
        if (onClose) {
          setTimeout(onClose, 100)
        }
      }}
    >
      <div
        className="customer-complaint-tooltip"
        style={{
          backgroundColor: 'rgba(26, 29, 34, 0.95)',
          border: '1px solid var(--color-gray-700)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          minWidth: '200px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          fontFamily: 'var(--font-family-primary)',
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: '14px',
            fontWeight: 'var(--font-weight-bold)',
            color: 'white',
            marginBottom: '8px',
          }}
        >
          Customer Complaints
        </div>

        {/* Complaint Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Complaint Type */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--color-gray-300)' }}>Complaint:</span>
            <span style={{ color: 'white', fontWeight: 'var(--font-weight-medium)' }}>
              {complaint.properties?.themeName || 'Unknown'}
            </span>
          </div>

          {/* Priority */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--color-gray-300)' }}>Priority:</span>
            <span style={{ color: 'white', fontWeight: 'var(--font-weight-medium)' }}>
              {complaint.properties?.priority || 'Unknown'}
            </span>
          </div>

          {/* Reported Date and Time */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--color-gray-300)' }}>Reported:</span>
            <span style={{ color: 'white', fontWeight: 'var(--font-weight-medium)' }}>
              {isLeakageManagerDark && reportedTime 
                ? `${reportedDate} ${reportedTime}`
                : reportedDate || 'Unknown'}
            </span>
          </div>

          {/* Elapsed Time (only for Leakage Manager + Dark) */}
          {isLeakageManagerDark && elapsed && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '2px' }}>
              <span style={{ color: 'var(--color-gray-400)', fontStyle: 'italic' }}>Elapsed:</span>
              <span style={{ color: 'var(--color-gray-300)', fontStyle: 'italic', fontWeight: 'var(--font-weight-medium)' }}>
                {elapsed} ago
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
