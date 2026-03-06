import { X, GripVertical, Clock, MapPin, AlertCircle, Trash2, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useDraggable } from '../../hooks/useDraggable'
import { usePanelContext } from '../../contexts/PanelContext'
import { CUSTOMER_COMPLAINTS } from '../../data/customerComplaints'
import { useState, useMemo } from 'react'
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'

export default function LeakageEventDashboardPanel({ eventId, onClose }) {
  const { position, isDragging, dragRef, handleMouseDown } = useDraggable({ 
    x: window.innerWidth / 2 - 450, 
    y: window.innerHeight / 2 - 300 
  })
  const { leakageEvents, removeComplaintFromEvent, setSelectedComplaint } = usePanelContext()
  const [activeView, setActiveView] = useState('list') // 'list' | 'timeline'
  const [sorting, setSorting] = useState([])

  const event = leakageEvents.find(e => e.id === eventId)
  
  if (!event) return null

  // Get all complaints linked to this event
  const linkedComplaints = useMemo(() => {
    return CUSTOMER_COMPLAINTS.features
      .filter(c => event.complaintIds.includes(c.id))
      .sort((a, b) => {
        // Sort by timestamp, newest first
        return new Date(b.properties.reportedTimestamp) - new Date(a.properties.reportedTimestamp)
      })
  }, [event.complaintIds])

  // Calculate statistics
  const stats = useMemo(() => {
    const priorityCounts = { High: 0, Medium: 0, Low: 0 }
    linkedComplaints.forEach(c => {
      priorityCounts[c.properties.priority] = (priorityCounts[c.properties.priority] || 0) + 1
    })
    
    const dates = linkedComplaints.map(c => new Date(c.properties.reportedTimestamp))
    const firstDate = dates.length > 0 ? new Date(Math.min(...dates)) : null
    const lastDate = dates.length > 0 ? new Date(Math.max(...dates)) : null
    
    return {
      total: linkedComplaints.length,
      highPriority: priorityCounts.High || 0,
      mediumPriority: priorityCounts.Medium || 0,
      lowPriority: priorityCounts.Low || 0,
      firstReported: firstDate,
      lastReported: lastDate,
      timeSpan: firstDate && lastDate ? lastDate - firstDate : 0
    }
  }, [linkedComplaints])

  // Calculate elapsed time
  const calculateElapsedTime = (timestamp) => {
    const now = new Date()
    const reported = new Date(timestamp)
    const diff = now - reported
    
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      const remainingHours = hours % 24
      const remainingMinutes = minutes % 60
      return `${days}d ${remainingHours}h ${remainingMinutes}m`
    } else if (hours > 0) {
      const remainingMinutes = minutes % 60
      return `${hours}h ${remainingMinutes}m`
    } else if (minutes > 0) {
      return `${minutes}m`
    } else {
      return `${seconds}s`
    }
  }

  // Priority badge component
  const PriorityBadge = ({ priority }) => {
    const colors = {
      High: { bg: 'var(--color-red-600)', text: 'var(--color-white)' },
      Medium: { bg: 'var(--color-orange-500)', text: 'var(--color-white)' },
      Low: { bg: 'var(--color-yellow-600)', text: 'var(--color-white)' }
    }
    const color = colors[priority] || colors.Medium
    
    return (
      <span
        className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase"
        style={{ backgroundColor: color.bg, color: color.text }}
      >
        {priority}
      </span>
    )
  }

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (date) => {
    if (!date) return ''
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  // Define table columns using TanStack Table
  const columnHelper = createColumnHelper()
  
  const columns = useMemo(() => [
    columnHelper.accessor('properties.complaintId', {
      id: 'complaintId',
      header: 'Complaint ID',
      cell: (info) => (
        <button
          onClick={() => setSelectedComplaint(info.row.original)}
          className="text-xs font-semibold hover:underline text-left truncate w-full"
          style={{ color: 'var(--sand-teal)' }}
        >
          {info.getValue()}
        </button>
      ),
    }),
    columnHelper.accessor('properties.themeName', {
      id: 'themeName',
      header: 'Type',
      cell: (info) => (
        <p className="text-xs truncate w-full" style={{ color: 'var(--color-gray-300)' }}>
          {info.getValue()}
        </p>
      ),
    }),
    columnHelper.accessor('properties.priority', {
      id: 'priority',
      header: 'Priority',
      cell: (info) => <PriorityBadge priority={info.getValue()} />,
      sortingFn: (rowA, rowB) => {
        const priorityOrder = { High: 3, Medium: 2, Low: 1 }
        return priorityOrder[rowA.original.properties.priority] - priorityOrder[rowB.original.properties.priority]
      }
    }),
    columnHelper.accessor('properties.reportedTimestamp', {
      id: 'reported',
      header: 'Reported',
      cell: (info) => (
        <div className="text-xs w-full" style={{ color: 'var(--color-gray-400)' }}>
          <div className="truncate">{info.row.original.properties.reportedDate}</div>
          <div className="text-[10px] truncate" style={{ color: 'var(--color-gray-500)' }}>
            {info.row.original.properties.reportedTime}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('properties.reportedTimestamp', {
      id: 'elapsed',
      header: 'Elapsed',
      cell: (info) => (
        <span className="text-xs truncate block w-full" style={{ color: 'var(--color-gray-400)' }}>
          {calculateElapsedTime(info.getValue())} ago
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Action',
      cell: (info) => (
        <button
          onClick={() => removeComplaintFromEvent(info.row.original.id, eventId)}
          className="p-1.5 rounded text-xs transition-colors flex-shrink-0"
          style={{
            color: 'var(--color-red-400)',
            backgroundColor: 'transparent'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-red-900)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          title="Remove from event"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    }),
  ], [eventId, removeComplaintFromEvent, setSelectedComplaint])

  // Create table instance
  const table = useReactTable({
    data: linkedComplaints,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div
      ref={dragRef}
      className="fixed z-50 w-[900px] max-h-[80vh] rounded-xl border shadow-xl flex flex-col overflow-hidden"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        backgroundColor: 'var(--sand-surface)',
        borderColor: 'var(--color-gray-700)',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      role="region"
      aria-label="Leakage Event Dashboard"
    >
      {/* Header - draggable */}
      <div
        className="flex justify-between items-center p-4 border-b select-none shrink-0"
        style={{
          borderColor: 'var(--color-gray-700)',
          cursor: 'grab',
          backgroundColor: 'var(--sand-surface)'
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-3">
          <GripVertical className="h-4 w-4 shrink-0" style={{ color: 'var(--color-gray-400)' }} aria-hidden="true" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--color-gray-400)' }}>
              LEAKAGE EVENT DASHBOARD
            </p>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-gray-100)' }}>
              {event.name}
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-gray-400)' }}>
              Status: <span style={{ color: 'var(--sand-teal)', textTransform: 'capitalize' }}>{event.status}</span>
            </p>
          </div>
        </div>
        <button
          className="rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
          style={{ color: 'var(--color-gray-400)' }}
          onClick={onClose}
          aria-label="Close dashboard"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-gray-700)', backgroundColor: 'var(--color-gray-850)' }}>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-[10px] uppercase font-medium mb-1" style={{ color: 'var(--color-gray-400)' }}>
              Total Complaints
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--sand-teal)' }}>
              {stats.total}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase font-medium mb-1" style={{ color: 'var(--color-gray-400)' }}>
              High Priority
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-red-400)' }}>
              {stats.highPriority}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase font-medium mb-1" style={{ color: 'var(--color-gray-400)' }}>
              Medium Priority
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-orange-400)' }}>
              {stats.mediumPriority}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase font-medium mb-1" style={{ color: 'var(--color-gray-400)' }}>
              Low Priority
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-yellow-400)' }}>
              {stats.lowPriority}
            </p>
          </div>
        </div>
        {stats.firstReported && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-gray-700)' }}>
            <p className="text-xs" style={{ color: 'var(--color-gray-400)' }}>
              <Clock className="w-3 h-3 inline mr-1" />
              First reported: {formatDate(stats.firstReported)} at {formatTime(stats.firstReported)}
              {stats.timeSpan > 0 && (
                <span className="ml-2">
                  • Span: {Math.floor(stats.timeSpan / (1000 * 60 * 60))} hours
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* View Tabs */}
      <div className="flex border-b shrink-0" style={{ borderColor: 'var(--color-gray-700)' }}>
        <button
          onClick={() => setActiveView('list')}
          className="flex-1 px-4 py-2 text-sm font-medium transition-colors"
          style={{
            color: activeView === 'list' ? 'var(--sand-teal)' : 'var(--color-gray-400)',
            borderBottom: activeView === 'list' ? `2px solid var(--sand-teal)` : '2px solid transparent'
          }}
        >
          Complaints List
        </button>
        <button
          onClick={() => setActiveView('timeline')}
          className="flex-1 px-4 py-2 text-sm font-medium transition-colors"
          style={{
            color: activeView === 'timeline' ? 'var(--sand-teal)' : 'var(--color-gray-400)',
            borderBottom: activeView === 'timeline' ? `2px solid var(--sand-teal)` : '2px solid transparent'
          }}
        >
          Timeline
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeView === 'list' ? (
          <div>
            {linkedComplaints.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--color-gray-400)' }}>
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No complaints linked to this event yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div style={{ minWidth: '640px' }}>
                  {/* Table Header */}
                  <div 
                    className="grid gap-3 px-4 py-3 border-b sticky top-0 z-10"
                    style={{ 
                      gridTemplateColumns: '120px 180px 90px 140px 110px 70px',
                      backgroundColor: 'var(--color-gray-800)', 
                      borderColor: 'var(--color-gray-700)' 
                    }}
                  >
                    {table.getHeaderGroups().map(headerGroup => (
                      headerGroup.headers.map(header => (
                        <div 
                          key={header.id}
                          className="text-[10px] uppercase font-semibold flex items-center gap-1 overflow-hidden"
                          style={{ 
                            color: 'var(--color-gray-400)',
                            cursor: header.column.getCanSort() ? 'pointer' : 'default',
                            justifyContent: header.id === 'actions' ? 'flex-end' : 'flex-start',
                            minWidth: 0
                          }}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span className="truncate">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {header.column.getCanSort() && (
                            <span style={{ opacity: 0.5, flexShrink: 0 }}>
                              {{
                                asc: <ArrowUp className="w-3 h-3" />,
                                desc: <ArrowDown className="w-3 h-3" />,
                              }[header.column.getIsSorted()] ?? <ArrowUpDown className="w-3 h-3" />}
                            </span>
                          )}
                        </div>
                      ))
                    ))}
                  </div>
                  
                  {/* Table Rows */}
                  <div>
                    {table.getRowModel().rows.map(row => (
                      <div
                        key={row.id}
                        className="grid gap-3 px-4 py-3 border-b transition-colors"
                        style={{
                          gridTemplateColumns: '120px 180px 90px 140px 110px 70px',
                          borderColor: 'var(--color-gray-700)'
                        }}
                        onMouseEnter={(e) => { 
                          e.currentTarget.style.backgroundColor = 'var(--color-gray-850)'
                        }}
                        onMouseLeave={(e) => { 
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        {row.getVisibleCells().map(cell => (
                          <div 
                            key={cell.id} 
                            className="flex items-center overflow-hidden"
                            style={{
                              justifyContent: cell.column.id === 'actions' ? 'flex-end' : 'flex-start',
                              minWidth: 0
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 px-4">
            {linkedComplaints.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--color-gray-400)' }}>
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No timeline data available.</p>
              </div>
            ) : (
              <div className="relative pl-8">
                {/* Timeline line */}
                <div
                  className="absolute left-4 top-0 bottom-0 w-0.5"
                  style={{ backgroundColor: 'var(--color-gray-700)' }}
                />
                
                {/* Timeline items */}
                {linkedComplaints.map((complaint, index) => (
                  <div key={complaint.id} className="relative mb-6">
                    {/* Timeline dot */}
                    <div
                      className="absolute left-[-1.125rem] w-4 h-4 rounded-full border-2"
                      style={{
                        backgroundColor: 'var(--sand-surface)',
                        borderColor: complaint.properties.priority === 'High' ? 'var(--color-red-500)' : 
                                    complaint.properties.priority === 'Medium' ? 'var(--color-orange-500)' : 
                                    'var(--color-yellow-500)'
                      }}
                    />
                    
                    {/* Timeline content */}
                    <div
                      className="p-3 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--color-gray-850)',
                        borderColor: 'var(--color-gray-700)'
                      }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <button
                          onClick={() => setSelectedComplaint(complaint)}
                          className="text-sm font-semibold hover:underline"
                          style={{ color: 'var(--sand-teal)' }}
                        >
                          {complaint.properties.complaintId}
                        </button>
                        <PriorityBadge priority={complaint.properties.priority} />
                      </div>
                      <p className="text-xs mb-1" style={{ color: 'var(--color-gray-300)' }}>
                        {complaint.properties.themeName}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-gray-400)' }}>
                        {complaint.properties.reportedDate} at {complaint.properties.reportedTime}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-gray-500)' }}>
                        {calculateElapsedTime(complaint.properties.reportedTimestamp)} ago
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-3 border-t shrink-0 flex gap-2" style={{ borderColor: 'var(--color-gray-700)' }}>
        <button
          className="flex-1 px-4 py-2 rounded-md font-medium transition-colors border flex items-center justify-center gap-2"
          style={{
            fontSize: 'var(--text-sm)',
            backgroundColor: 'var(--color-gray-700)',
            color: 'var(--color-gray-200)',
            borderColor: 'var(--color-gray-600)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-600)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-700)' }}
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-md font-medium transition-colors"
          style={{
            fontSize: 'var(--text-sm)',
            backgroundColor: 'var(--sand-teal)',
            color: 'var(--color-white)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--sand-teal-light)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--sand-teal)' }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
