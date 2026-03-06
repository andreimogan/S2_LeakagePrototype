import { X, GripVertical, Plus, ChevronDown, Send } from 'lucide-react'
import { useDraggable } from '../../hooks/useDraggable'
import { usePanelContext } from '../../contexts/PanelContext'
import { useState, useRef, useEffect } from 'react'

export default function ComplaintDetailPanel({ complaint, onClose }) {
  const { position, isDragging, dragRef, handleMouseDown } = useDraggable({ x: 24, y: 80 })
  const { leakageEvents, addComplaintToEvent, openComplaintsListWithExpanded } = usePanelContext()
  const [selectedEventId, setSelectedEventId] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

  if (!complaint) return null

  // Find which event(s) this complaint is already linked to
  const linkedEvents = leakageEvents.filter(event => 
    event.complaintIds.includes(complaint.id)
  )
  
  // Get available events (not already linked)
  const availableEvents = leakageEvents.filter(event => 
    !event.complaintIds.includes(complaint.id)
  )
  
  // Handle adding complaint to selected event
  const handleAddToEvent = () => {
    if (selectedEventId) {
      addComplaintToEvent(complaint.id, selectedEventId)
      setSelectedEventId('')
      setDropdownOpen(false)
    }
  }
  
  // Calculate dropdown position when opening
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      })
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      updateDropdownPosition()
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('resize', updateDropdownPosition)
      window.addEventListener('scroll', updateDropdownPosition, true)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        window.removeEventListener('resize', updateDropdownPosition)
        window.removeEventListener('scroll', updateDropdownPosition, true)
      }
    }
  }, [dropdownOpen])

  const formatRecordedAt = (timestamp) => {
    if (!timestamp) return 'N/A'
    return timestamp
  }

  return (
    <div
      ref={dragRef}
      className="fixed z-50 w-[380px] max-h-[calc(100vh-8rem)] rounded-xl border shadow-xl flex flex-col overflow-hidden"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        backgroundColor: 'var(--sand-surface)',
        borderColor: 'var(--color-gray-700)',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      role="region"
      aria-label="Customer Complaint Details"
    >
      {/* Header - draggable */}
      <div
        className="flex justify-between items-center p-3 border-b select-none shrink-0"
        style={{
          borderColor: 'var(--color-gray-700)',
          cursor: 'grab',
          backgroundColor: 'var(--sand-surface)'
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 shrink-0" style={{ color: 'var(--color-gray-400)' }} aria-hidden="true" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--color-gray-400)' }}>
              CUSTOMER COMPLAINTS
            </p>
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-gray-100)' }}>
              Complaint #{complaint.properties?.complaintId || 'N/A'}
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-gray-400)' }}>
              {complaint.properties?.themeName || 'Unknown'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
            style={{ color: 'var(--color-gray-400)' }}
            onClick={onClose}
            aria-label="Close complaint details panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {/* Summary Details */}
        <div className="space-y-3">
          {/* Complaint Type */}
          <div
            className="p-2.5 rounded-md border"
            style={{
              backgroundColor: 'var(--color-gray-850)',
              borderColor: 'var(--color-gray-700)'
            }}
          >
            <h4 className="text-[10px] uppercase font-medium mb-1" style={{ color: 'var(--color-gray-400)' }}>
              COMPLAINT TYPE
            </h4>
            <p className="font-medium text-sm" style={{ color: 'var(--color-gray-100)' }}>
              {complaint.properties?.themeName || 'Unknown'}
            </p>
          </div>

          {/* Priority */}
          <div
            className="p-2.5 rounded-md border"
            style={{
              backgroundColor: 'var(--color-gray-850)',
              borderColor: 'var(--color-gray-700)'
            }}
          >
            <h4 className="text-[10px] uppercase font-medium mb-1" style={{ color: 'var(--color-gray-400)' }}>
              PRIORITY
            </h4>
            <p className="font-medium text-sm" style={{ color: 'var(--color-gray-100)' }}>
              {complaint.properties?.priority || 'Unknown'}
            </p>
          </div>

          {/* Reported */}
          <div
            className="p-2.5 rounded-md border"
            style={{
              backgroundColor: 'var(--color-gray-850)',
              borderColor: 'var(--color-gray-700)'
            }}
          >
            <h4 className="text-[10px] uppercase font-medium mb-1" style={{ color: 'var(--color-gray-400)' }}>
              REPORTED
            </h4>
            <p className="font-medium text-sm" style={{ color: 'var(--color-gray-100)' }}>
              {complaint.properties?.reportedDate || 'Unknown'}
            </p>
          </div>
        </div>

        {/* Separator */}
        <div
          className="my-4"
          style={{
            height: '1px',
            backgroundColor: 'var(--color-gray-700)'
          }}
        />

        {/* Additional Details */}
        <div>
          <h3 className="text-[10px] uppercase font-semibold tracking-wide mb-3" style={{ color: 'var(--color-gray-400)' }}>
            ADDITIONAL DETAILS
          </h3>

          <div className="space-y-3">
            {/* ID */}
            <div
              className="p-2.5 rounded-md border"
              style={{
                backgroundColor: 'var(--color-gray-850)',
                borderColor: 'var(--color-gray-700)'
              }}
            >
              <h4 className="text-[10px] uppercase font-medium mb-1" style={{ color: 'var(--color-gray-400)' }}>
                ID
              </h4>
              <p className="font-medium text-sm" style={{ color: 'var(--color-gray-100)' }}>
                {complaint.id?.toString().replace('complaint-', '') || 'N/A'}
              </p>
            </div>

            {/* Request ID */}
            <div
              className="p-2.5 rounded-md border"
              style={{
                backgroundColor: 'var(--color-gray-850)',
                borderColor: 'var(--color-gray-700)'
              }}
            >
              <h4 className="text-[10px] uppercase font-medium mb-1" style={{ color: 'var(--color-gray-400)' }}>
                REQUEST ID
              </h4>
              <p className="font-medium text-sm" style={{ color: 'var(--color-gray-100)' }}>
                {complaint.properties?.complaintId || 'N/A'}
              </p>
            </div>

            {/* Complaint Theme */}
            <div
              className="p-2.5 rounded-md border"
              style={{
                backgroundColor: 'var(--color-gray-850)',
                borderColor: 'var(--color-gray-700)'
              }}
            >
              <h4 className="text-[10px] uppercase font-medium mb-1" style={{ color: 'var(--color-gray-400)' }}>
                COMPLAINT THEME
              </h4>
              <p className="font-medium text-sm" style={{ color: 'var(--color-gray-100)' }}>
                {complaint.properties?.themeName || 'Unknown'}
              </p>
            </div>

            {/* Recorded At */}
            <div
              className="p-2.5 rounded-md border"
              style={{
                backgroundColor: 'var(--color-gray-850)',
                borderColor: 'var(--color-gray-700)'
              }}
            >
              <h4 className="text-[10px] uppercase font-medium mb-1" style={{ color: 'var(--color-gray-400)' }}>
                RECORDED AT
              </h4>
              <p className="font-medium text-sm break-all" style={{ color: 'var(--color-gray-100)' }}>
                {formatRecordedAt(complaint.properties?.reportedTimestamp)}
              </p>
            </div>

            {/* City ID */}
            <div
              className="p-2.5 rounded-md border"
              style={{
                backgroundColor: 'var(--color-gray-850)',
                borderColor: 'var(--color-gray-700)'
              }}
            >
              <h4 className="text-[10px] uppercase font-medium mb-1" style={{ color: 'var(--color-gray-400)' }}>
                CITY ID
              </h4>
              <p className="font-medium text-sm" style={{ color: 'var(--color-gray-100)' }}>
                stlouis-mo
              </p>
            </div>
          </div>
        </div>
        
        {/* Leakage Event Linking Section */}
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-gray-700)' }}>
          <h3 className="text-[10px] uppercase font-semibold tracking-wide mb-3" style={{ color: 'var(--color-gray-400)' }}>
            LEAKAGE EVENT LINKING
          </h3>
          
          {/* Show current linked event(s) */}
          {linkedEvents.length > 0 ? (
            <div className="mb-3 space-y-2">
              {linkedEvents.map(event => (
                <div 
                  key={event.id}
                  className="p-2.5 rounded-md border"
                  style={{
                    backgroundColor: 'var(--color-gray-850)',
                    borderColor: 'var(--sand-teal)'
                  }}
                >
                  <p className="text-[10px] uppercase font-medium mb-1" style={{ color: 'var(--color-gray-400)' }}>
                    Currently linked to:
                  </p>
                  <p className="text-sm font-medium" style={{ color: 'var(--sand-teal)' }}>
                    {event.name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs mb-3" style={{ color: 'var(--color-gray-400)' }}>
              This complaint is not linked to any leakage event.
            </p>
          )}
          
          {/* Add to Event Section */}
          {availableEvents.length > 0 ? (
            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-medium mb-1.5" style={{ color: 'var(--color-gray-400)' }}>
                Select Leakage Event
              </label>
              
              {/* Dropdown */}
              <div className="relative">
                <button
                  ref={buttonRef}
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full px-3 py-2 pr-8 rounded border text-left transition-all"
                  style={{
                    fontSize: 'var(--text-sm)',
                    backgroundColor: 'var(--color-gray-700)',
                    borderColor: dropdownOpen ? 'var(--sand-teal)' : 'var(--color-gray-600)',
                    color: selectedEventId ? 'var(--color-gray-200)' : 'var(--color-gray-400)',
                  }}
                >
                  {selectedEventId 
                    ? leakageEvents.find(e => e.id === selectedEventId)?.name 
                    : 'Choose an event...'}
                </button>
                <ChevronDown
                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--color-gray-400)' }}
                  aria-hidden="true"
                />
              </div>
              
              {/* Dropdown menu */}
              {dropdownOpen && (
                <ul
                  ref={dropdownRef}
                  className="fixed py-1 max-h-52 overflow-auto rounded border z-[60]"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`,
                    backgroundColor: 'var(--color-gray-700)',
                    borderColor: 'var(--color-gray-600)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                  }}
                  role="listbox"
                >
                  {availableEvents.map((event) => (
                    <li key={event.id} role="option" aria-selected={selectedEventId === event.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEventId(event.id)
                          setDropdownOpen(false)
                        }}
                        className="flex items-center justify-between w-full px-3 py-2.5 text-left transition-colors"
                        style={{
                          fontSize: 'var(--text-sm)',
                          backgroundColor: selectedEventId === event.id ? 'var(--sand-teal)' : 'transparent',
                          color: selectedEventId === event.id ? 'var(--color-white)' : 'var(--color-gray-200)',
                        }}
                        onMouseEnter={(e) => {
                          if (selectedEventId !== event.id) {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedEventId !== event.id) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }
                        }}
                      >
                        <span className="truncate">{event.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              
              {/* Add Button */}
              <button
                onClick={handleAddToEvent}
                disabled={!selectedEventId}
                className="w-full px-3 py-2 rounded-md border transition-colors flex items-center justify-center gap-2"
                style={{
                  fontSize: 'var(--text-sm)',
                  backgroundColor: selectedEventId ? 'var(--sand-teal)' : 'var(--color-gray-700)',
                  color: selectedEventId ? 'var(--color-white)' : 'var(--color-gray-500)',
                  borderColor: selectedEventId ? 'var(--sand-teal)' : 'var(--color-gray-600)',
                  cursor: selectedEventId ? 'pointer' : 'not-allowed',
                  opacity: selectedEventId ? 1 : 0.5
                }}
                onMouseEnter={(e) => { 
                  if (selectedEventId) {
                    e.currentTarget.style.backgroundColor = 'var(--sand-teal-light)'
                  }
                }}
                onMouseLeave={(e) => { 
                  if (selectedEventId) {
                    e.currentTarget.style.backgroundColor = 'var(--sand-teal)'
                  }
                }}
              >
                <Plus className="w-4 h-4" />
                Add to Event
              </button>
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'var(--color-gray-400)' }}>
              No available leakage events to link to.
            </p>
          )}
        </div>
        
        {/* Send Recommended Work Order Section */}
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-gray-700)' }}>
          <h3 className="text-[10px] uppercase font-semibold tracking-wide mb-3" style={{ color: 'var(--color-gray-400)' }}>
            WORK ORDER ACTIONS
          </h3>
          
          <button
            onClick={() => {
              openComplaintsListWithExpanded(complaint.id)
              onClose()
            }}
            className="w-full px-4 py-3 rounded-md border transition-colors flex items-center justify-center gap-2"
            style={{
              fontSize: 'var(--text-sm)',
              backgroundColor: 'var(--color-blue-700)',
              color: 'var(--color-white)',
              borderColor: 'var(--color-blue-600)',
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.backgroundColor = 'var(--color-blue-600)'
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.backgroundColor = 'var(--color-blue-700)'
            }}
          >
            <Send className="w-4 h-4" />
            Open Work Order
          </button>
          
          <p className="text-xs mt-2" style={{ color: 'var(--color-gray-500)' }}>
            Opens the complaints overview with recommended actions for this complaint
          </p>
        </div>
      </div>
    </div>
  )
}
