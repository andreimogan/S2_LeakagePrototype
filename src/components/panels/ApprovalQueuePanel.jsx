import { X, RefreshCw, ChevronDown, ChevronUp, AlertTriangle, Clock, Check, X as XIcon } from 'lucide-react'
import { useState } from 'react'
import { usePanelContext } from '../../contexts/PanelContext'

export default function ApprovalQueuePanel({ onClose }) {
  const { approvalQueue } = usePanelContext()
  const [expandedItemId, setExpandedItemId] = useState(null)
  const [itemStates, setItemStates] = useState({})

  // Get item state or default
  const getItemState = (itemId) => {
    return itemStates[itemId] || {
      status: 'Confirmed',
      reviewNotes: ''
    }
  }

  // Update item state
  const updateItemState = (itemId, updates) => {
    setItemStates(prev => ({
      ...prev,
      [itemId]: {
        ...getItemState(itemId),
        ...updates
      }
    }))
  }

  const toggleExpand = (itemId) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId)
  }

  const handleApprove = (item) => {
    const state = getItemState(item.id)
    console.log('Approving:', item.title, 'Status:', state.status, 'Notes:', state.reviewNotes)
    // Handle approval logic here
    alert(`Approved: ${item.title}`)
  }

  const handleReject = (item) => {
    const state = getItemState(item.id)
    console.log('Rejecting:', item.title, 'Status:', state.status, 'Notes:', state.reviewNotes)
    // Handle rejection logic here
    alert(`Rejected: ${item.title}`)
  }

  const handleRefresh = () => {
    console.log('Refreshing approval queue...')
    // Handle refresh logic here
  }

  const handleShowAll = () => {
    console.log('Showing all items...')
    // Handle show all logic here
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'restricted': return { bg: 'var(--color-red-600)', text: 'var(--color-white)' }
      case 'supervised': return { bg: 'var(--color-yellow-600)', text: 'var(--color-gray-900)' }
      case 'pending': return { bg: 'var(--color-yellow-600)', text: 'var(--color-gray-900)' }
      default: return { bg: 'var(--color-gray-600)', text: 'var(--color-gray-100)' }
    }
  }

  return (
    <div
      className="fixed right-6 z-[100] w-[420px] max-h-[calc(100vh-6rem)] rounded-xl border shadow-2xl flex flex-col overflow-hidden"
      style={{
        top: '80px',
        backgroundColor: 'var(--sand-surface)',
        borderColor: 'var(--color-gray-700)',
      }}
      role="region"
      aria-label="Approval Queue"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b shrink-0"
        style={{
          borderColor: 'var(--color-gray-700)',
          backgroundColor: 'var(--sand-surface)'
        }}
      >
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-3 gap-0.5 w-4 h-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-sm" style={{ backgroundColor: 'var(--color-gray-400)' }} />
            ))}
          </div>
          <svg className="w-4 h-4" style={{ color: 'var(--sand-teal)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-gray-100)' }}>
            Approval Queue
          </h2>
          {approvalQueue.length > 0 && (
            <span
              className="flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[11px] font-bold"
              style={{
                backgroundColor: 'var(--color-yellow-500)',
                color: 'var(--color-gray-900)',
              }}
            >
              {approvalQueue.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShowAll}
            className="text-xs font-medium transition-colors"
            style={{ color: 'var(--sand-teal)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sand-teal-light)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sand-teal)' }}
          >
            Show all
          </button>
          <button
            onClick={handleRefresh}
            className="p-1 rounded transition-colors"
            style={{ color: 'var(--color-gray-400)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-700)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            aria-label="Refresh queue"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors"
            style={{ color: 'var(--color-gray-400)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-700)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content - scrollable list of approval items */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {approvalQueue.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--color-gray-400)' }}>
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No pending approvals</p>
          </div>
        ) : (
          approvalQueue.map((item) => {
            const isExpanded = expandedItemId === item.id
            const state = getItemState(item.id)

            return (
              <div
                key={item.id}
                className="rounded-lg border transition-all"
                style={{
                  backgroundColor: 'var(--color-gray-850)',
                  borderColor: isExpanded ? 'var(--sand-teal)' : 'var(--color-gray-700)',
                  boxShadow: isExpanded ? '0 0 0 1px var(--sand-teal)' : 'none'
                }}
              >
                {/* Item header - always visible */}
                <div
                  className="flex items-start gap-3 p-3 cursor-pointer"
                  onClick={() => toggleExpand(item.id)}
                >
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-orange-500)' }} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-gray-100)' }}>
                      {item.title}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((tag, idx) => {
                        const colors = getStatusColor(tag)
                        return (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                            style={{
                              backgroundColor: colors.bg,
                              color: colors.text
                            }}
                          >
                            {tag}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 shrink-0" style={{ color: 'var(--color-gray-400)' }} />
                  ) : (
                    <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--color-gray-400)' }} />
                  )}
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3">
                    {/* AI Reasoning */}
                    <div>
                      <h4 className="text-[10px] uppercase font-semibold tracking-wide mb-2" style={{ color: 'var(--color-gray-400)' }}>
                        AI REASONING
                      </h4>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-gray-300)' }}>
                        {item.aiReasoning}
                      </p>
                    </div>

                    {/* Action Details */}
                    <div>
                      <h4 className="text-[10px] uppercase font-semibold tracking-wide mb-2" style={{ color: 'var(--color-gray-400)' }}>
                        ACTION DETAILS
                      </h4>
                      <div className="space-y-1">
                        {Object.entries(item.actionDetails).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span style={{ color: 'var(--color-gray-400)' }}>{key}:</span>
                            <span className="font-medium" style={{ color: 'var(--color-gray-100)' }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reference links */}
                    {item.references && (
                      <div className="flex flex-wrap gap-2">
                        {item.references.map((ref, idx) => (
                          <button
                            key={idx}
                            className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                            style={{
                              backgroundColor: 'var(--color-blue-900)',
                              color: 'var(--color-blue-200)',
                              borderColor: 'var(--color-blue-700)',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-blue-800)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-blue-900)' }}
                          >
                            {ref}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-gray-400)' }}>
                      <Clock className="w-3.5 h-3.5" />
                      {item.timestamp}
                    </div>

                    {/* Status selection */}
                    <div>
                      <h4 className="text-[10px] uppercase font-semibold tracking-wide mb-2" style={{ color: 'var(--color-gray-400)' }}>
                        STATUS
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {['Confirmed', 'Partial', 'False Positive', 'Not Investigated'].map((status) => (
                          <button
                            key={status}
                            onClick={(e) => {
                              e.stopPropagation()
                              updateItemState(item.id, { status })
                            }}
                            className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                            style={{
                              backgroundColor: state.status === status ? 'var(--color-green-700)' : 'var(--color-gray-700)',
                              color: 'var(--color-white)',
                            }}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Review notes */}
                    <div>
                      <textarea
                        placeholder="Review notes (optional)..."
                        value={state.reviewNotes}
                        onChange={(e) => {
                          e.stopPropagation()
                          updateItemState(item.id, { reviewNotes: e.target.value })
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-3 py-2 rounded-md border text-xs resize-none"
                        rows="3"
                        style={{
                          backgroundColor: 'var(--color-gray-800)',
                          borderColor: 'var(--color-gray-600)',
                          color: 'var(--color-gray-100)',
                        }}
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleApprove(item)
                        }}
                        className="px-4 py-2.5 rounded-md font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                        style={{
                          backgroundColor: 'var(--color-green-600)',
                          color: 'var(--color-white)',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-green-700)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-green-600)' }}
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReject(item)
                        }}
                        className="px-4 py-2.5 rounded-md font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                        style={{
                          backgroundColor: 'var(--color-red-600)',
                          color: 'var(--color-white)',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-red-700)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-red-600)' }}
                      >
                        <XIcon className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
