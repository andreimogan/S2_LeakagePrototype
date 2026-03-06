import { useState, useRef, useEffect } from 'react'
import {
  ChevronDown,
  Droplets,
  Pipette,
  Layers,
  Sparkles,
  Ellipsis,
  User,
  Shield,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react'
import { usePanelContext } from '../contexts/PanelContext'

// Notification Badge Component
const NotificationBadge = ({ count }) => {
  if (count === 0) return null
  
  return (
    <span
      className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold"
      style={{
        background: '#ef4444',
        color: 'white',
        marginLeft: '4px',
      }}
    >
      {count}
    </span>
  )
}

export default function NavRight() {
  const [analysisExpanded, setAnalysisExpanded] = useState(false)
  const [moreToolsOpen, setMoreToolsOpen] = useState(false)
  const moreToolsRef = useRef(null)
  const moreToolsButtonRef = useRef(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  
  const { 
    toggleCopilot, 
    toggleEventArea, 
    toggleLayers, 
    toggleApprovalQueue,
    toggleComplaintsList,
    toggleWorkOrders,
    eventAreaCount, 
    pressureCount,
    approvalQueue,
    workOrders
  } = usePanelContext()
  
  const totalAnalysisCount = eventAreaCount + pressureCount

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (moreToolsButtonRef.current) {
      const rect = moreToolsButtonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      })
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreToolsRef.current && !moreToolsRef.current.contains(event.target) &&
          moreToolsButtonRef.current && !moreToolsButtonRef.current.contains(event.target)) {
        setMoreToolsOpen(false)
      }
    }
    if (moreToolsOpen) {
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
  }, [moreToolsOpen])

  return (
    <div className="flex items-center gap-3">
      {/* Analysis dropdown group */}
      <div 
        className="flex items-center h-7 rounded-md border transition-colors duration-200"
        style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <button 
          className="flex items-center h-full text-white text-xs px-2 rounded-md transition-colors whitespace-nowrap"
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          onClick={() => setAnalysisExpanded(!analysisExpanded)}
        >
          Analysis
          {!analysisExpanded && <NotificationBadge count={totalAnalysisCount} />}
          <ChevronDown className="w-3 h-3 ml-1" aria-hidden="true" />
        </button>
        <div 
          className="grid transition-[grid-template-columns] duration-200 ease-out h-full"
          style={{ gridTemplateColumns: analysisExpanded ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden flex items-center min-w-0 h-full">
            <div className="w-px h-3.5 flex-shrink-0" style={{ background: 'rgba(255, 255, 255, 0.15)' }} />
            <button 
              className="flex items-center h-full text-white text-xs px-2 whitespace-nowrap transition-colors rounded-md"
              disabled
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            >
              <Droplets className="w-3 h-3 mr-1" aria-hidden="true" />
              Pressure
              {analysisExpanded && <NotificationBadge count={pressureCount} />}
            </button>
            <button 
              className="flex items-center h-full text-white text-xs px-2 whitespace-nowrap transition-colors rounded-md"
              title="View pipes affected by curated pressure events"
              onClick={(e) => {
                e.stopPropagation()
                toggleEventArea()
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Pipette className="w-3 h-3 mr-1" aria-hidden="true" />
              Event Area
              {analysisExpanded && <NotificationBadge count={eventAreaCount} />}
            </button>
          </div>
        </div>
      </div>

      {/* Layers button */}
      <button 
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors rounded-md text-white text-xs h-7 px-2"
        style={{ background: 'rgba(255, 255, 255, 0.15)' }}
        onClick={toggleLayers}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
      >
        <Layers className="w-3 h-3 mr-1" aria-hidden="true" />
        Layers
      </button>

      {/* Copilot button */}
      <button 
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors rounded-md text-white text-xs h-7 px-2"
        style={{ background: 'rgba(255, 255, 255, 0.15)' }}
        title="Water OS Copilot"
        onClick={toggleCopilot}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
      >
        <Sparkles className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
        Copilot
      </button>

      {/* Actions button */}
      <button 
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors rounded-md text-white text-xs h-7 px-2 relative"
        style={{ background: 'rgba(255, 255, 255, 0.15)' }}
        title="Approval Queue"
        onClick={toggleApprovalQueue}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
      >
        <Shield className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
        Actions
        {approvalQueue.length > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold"
            style={{
              backgroundColor: '#f59e0b',
              color: '#000',
            }}
          >
            {approvalQueue.length}
          </span>
        )}
      </button>

      {/* More tools button with dropdown */}
      <div className="relative">
        <button 
          ref={moreToolsButtonRef}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors text-white h-7 w-7"
          title="More tools"
          type="button"
          onClick={() => setMoreToolsOpen(!moreToolsOpen)}
          style={{ 
            background: moreToolsOpen ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.15)',
          }}
          onMouseEnter={(e) => { if (!moreToolsOpen) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)' }}
          onMouseLeave={(e) => { if (!moreToolsOpen) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)' }}
        >
          <Ellipsis className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
        
        {/* Dropdown menu */}
        {moreToolsOpen && (
          <div
            ref={moreToolsRef}
            className="fixed py-1 min-w-[160px] rounded-md border shadow-xl z-[100]"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
              backgroundColor: 'var(--sand-surface)',
              borderColor: 'var(--color-gray-600)',
            }}
          >
            <button
              onClick={() => {
                toggleComplaintsList()
                setMoreToolsOpen(false)
              }}
              className="w-full px-3 py-2 text-left text-xs font-medium transition-colors flex items-center gap-2"
              style={{
                color: 'var(--color-gray-200)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              Complaints
            </button>
            <button
              onClick={() => {
                toggleWorkOrders()
                setMoreToolsOpen(false)
              }}
              className="w-full px-3 py-2 text-left text-xs font-medium transition-colors flex items-center gap-2"
              style={{
                color: 'var(--color-gray-200)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" />
              Work Orders
              {workOrders && workOrders.length > 0 && (
                <span
                  className="ml-auto flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold"
                  style={{
                    backgroundColor: 'var(--color-blue-600)',
                    color: 'var(--color-white)',
                  }}
                >
                  {workOrders.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* User avatar button */}
      <button 
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors text-white h-7 w-7"
        aria-label="User settings"
        type="button"
        disabled
        style={{ opacity: 0.5, cursor: 'not-allowed' }}
      >
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
          <User className="w-3.5 h-3.5" aria-hidden="true" />
        </div>
      </button>
    </div>
  )
}
