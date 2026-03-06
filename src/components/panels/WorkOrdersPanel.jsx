import { X, GripVertical, Clock, CheckCircle, AlertCircle, Circle, ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown, Maximize2, Check, Square } from 'lucide-react'
import { useDraggable } from '../../hooks/useDraggable'
import { useResizable } from '../../hooks/useResizable'
import { usePanelContext } from '../../contexts/PanelContext'
import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  getExpandedRowModel
} from '@tanstack/react-table'

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    'New': { bg: 'var(--color-blue-600)', text: 'var(--color-white)' },
    'Assigned': { bg: 'var(--color-purple-600)', text: 'var(--color-white)' },
    'In Progress': { bg: 'var(--color-orange-600)', text: 'var(--color-white)' },
    'Completed': { bg: 'var(--color-green-600)', text: 'var(--color-white)' },
    'Cancelled': { bg: 'var(--color-gray-600)', text: 'var(--color-white)' }
  }
  
  const config = statusConfig[status] || statusConfig['New']
  
  return (
    <span
      className="px-2 py-0.5 rounded text-[10px] font-semibold"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {status}
    </span>
  )
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

export default function WorkOrdersPanel({ onClose }) {
  const { position, isDragging, dragRef, handleMouseDown } = useDraggable({ 
    x: window.innerWidth / 2 - 450, 
    y: window.innerHeight / 2 - 300 
  })
  const { size, isResizing, handleResizeStart } = useResizable(
    { width: 900, height: 600 },
    { width: 700, height: 400 }
  )
  const { workOrders, setWorkOrders } = usePanelContext()
  const [sorting, setSorting] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [expanded, setExpanded] = useState({})

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  // Parse instructions to extract actions
  const parseActions = (instructions) => {
    const actions = []
    const lines = instructions.split('\n')
    
    // Extract recommended actions (before "Custom Actions:")
    const customActionsIndex = lines.findIndex(line => line.includes('Custom Actions:'))
    const recommendedLines = customActionsIndex > 0 ? lines.slice(0, customActionsIndex) : lines
    
    // Parse recommended actions
    const recommendedText = recommendedLines.join('\n')
    if (recommendedText.includes('meter test')) {
      actions.push({ text: 'Perform meter test', type: 'recommended', completed: false })
    }
    if (recommendedText.includes('curb stop isolation')) {
      actions.push({ text: 'Curb stop isolation', type: 'recommended', completed: false })
    }
    if (recommendedText.includes('Visual inspection')) {
      actions.push({ text: 'Visual inspection of nearby pipe', type: 'recommended', completed: false })
    }
    if (recommendedText.includes('valve operation')) {
      actions.push({ text: 'Check valve operation', type: 'recommended', completed: false })
    }
    
    // Parse custom actions
    if (customActionsIndex > 0) {
      const customLines = lines.slice(customActionsIndex + 1)
      customLines.forEach(line => {
        const trimmed = line.trim()
        if (trimmed.startsWith('•')) {
          actions.push({ 
            text: trimmed.substring(1).trim(), 
            type: 'custom', 
            completed: false 
          })
        }
      })
    }
    
    return actions
  }

  // Toggle action completion
  const toggleActionCompletion = (workOrderId, actionIndex) => {
    setWorkOrders(prev => prev.map(wo => {
      if (wo.id === workOrderId) {
        // Get current action states or initialize them
        const currentStates = wo.actionStates || []
        const actions = parseActions(wo.instructions)
        
        // Initialize states if not present
        if (currentStates.length === 0) {
          currentStates.length = actions.length
          currentStates.fill(false)
        }
        
        // Toggle the specific action
        const newStates = [...currentStates]
        newStates[actionIndex] = !newStates[actionIndex]
        
        // Store updated action states in work order
        return {
          ...wo,
          actionStates: newStates
        }
      }
      return wo
    }))
  }

  // Get actions with their completion state
  const getActionsWithState = (workOrder) => {
    const actions = parseActions(workOrder.instructions)
    if (workOrder.actionStates) {
      actions.forEach((action, idx) => {
        if (workOrder.actionStates[idx] !== undefined) {
          action.completed = workOrder.actionStates[idx]
        }
      })
    }
    return actions
  }

  // Calculate stats
  const stats = useMemo(() => {
    const total = workOrders.length
    const newOrders = workOrders.filter(wo => wo.status === 'New').length
    const inProgress = workOrders.filter(wo => wo.status === 'In Progress' || wo.status === 'Assigned').length
    const completed = workOrders.filter(wo => wo.status === 'Completed').length
    
    return { total, newOrders, inProgress, completed }
  }, [workOrders])

  // Define table columns
  const columnHelper = createColumnHelper()
  
  const columns = useMemo(() => [
    columnHelper.display({
      id: 'expander',
      header: () => null,
      cell: ({ row }) => (
        <button
          onClick={() => row.toggleExpanded()}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          style={{ color: 'var(--color-gray-400)' }}
        >
          {row.getIsExpanded() ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      ),
    }),
    columnHelper.accessor('id', {
      id: 'workOrderId',
      header: 'Work Order ID',
      cell: (info) => (
        <p className="text-xs font-mono font-semibold truncate w-full" style={{ color: 'var(--sand-teal)' }}>
          {info.getValue()}
        </p>
      ),
      enableSorting: true,
    }),
    columnHelper.accessor('type', {
      id: 'type',
      header: 'Type',
      cell: (info) => (
        <p className="text-xs truncate w-full" style={{ color: 'var(--color-gray-300)' }}>
          {info.getValue()}
        </p>
      ),
      enableSorting: true,
    }),
    columnHelper.accessor('priority', {
      id: 'priority',
      header: 'Priority',
      cell: (info) => <PriorityBadge priority={info.getValue()} />,
      sortingFn: (rowA, rowB) => {
        const priorityOrder = { High: 3, Medium: 2, Low: 1 }
        return priorityOrder[rowA.original.priority] - priorityOrder[rowB.original.priority]
      },
      enableSorting: true,
    }),
    columnHelper.accessor('status', {
      id: 'status',
      header: 'Status',
      cell: (info) => <StatusBadge status={info.getValue()} />,
      enableSorting: true,
    }),
    columnHelper.accessor('createdAt', {
      id: 'created',
      header: 'Created',
      cell: (info) => (
        <p className="text-xs" style={{ color: 'var(--color-gray-300)' }}>
          {formatDate(info.getValue())}
        </p>
      ),
      enableSorting: true,
    }),
    columnHelper.accessor('location', {
      id: 'location',
      header: 'Location',
      cell: (info) => (
        <p className="text-xs truncate w-full" style={{ color: 'var(--color-gray-300)' }}>
          {info.getValue()}
        </p>
      ),
      enableSorting: true,
    }),
  ], [])

  const table = useReactTable({
    data: workOrders,
    columns,
    state: {
      sorting,
      globalFilter,
      expanded,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    globalFilterFn: 'includesString',
  })

  return (
    <div
      ref={dragRef}
      className="fixed z-50 rounded-xl border shadow-xl flex flex-col overflow-hidden"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        backgroundColor: 'var(--sand-surface)',
        borderColor: 'var(--color-gray-700)',
        cursor: isDragging ? 'grabbing' : isResizing ? 'nwse-resize' : 'default'
      }}
      role="region"
      aria-label="Work Orders"
    >
      {/* Header */}
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
              FIELD WORK MANAGEMENT
            </p>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-gray-100)' }}>
              Work Orders
            </h2>
          </div>
        </div>
        <button
          className="rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
          style={{ color: 'var(--color-gray-400)' }}
          onClick={onClose}
          aria-label="Close work orders panel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-gray-700)', backgroundColor: 'var(--color-gray-850)' }}>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-[10px] uppercase font-medium mb-1" style={{ color: 'var(--color-gray-400)' }}>
              Total Orders
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--sand-teal)' }}>
              {stats.total}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase font-medium mb-1" style={{ color: 'var(--color-gray-400)' }}>
              New
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-blue-400)' }}>
              {stats.newOrders}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase font-medium mb-1" style={{ color: 'var(--color-gray-400)' }}>
              In Progress
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-orange-400)' }}>
              {stats.inProgress}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase font-medium mb-1" style={{ color: 'var(--color-gray-400)' }}>
              Completed
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-green-400)' }}>
              {stats.completed}
            </p>
          </div>
        </div>
      </div>

      {/* Content Area - Table */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {workOrders.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--color-gray-400)' }}>
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No work orders yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-gray-500)' }}>
              Work orders will appear here when created from complaints
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div style={{ minWidth: '700px' }}>
              {/* Table Header */}
              <div 
                className="grid gap-3 px-4 py-3 border-b sticky top-0 z-10"
                style={{ 
                  gridTemplateColumns: '40px minmax(120px, 1.2fr) minmax(140px, 1.5fr) minmax(80px, 0.8fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(120px, 1.2fr)',
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
                  <div key={row.id}>
                    {/* Main Row */}
                    <div
                      className="grid gap-3 px-4 py-3 border-b transition-colors"
                      style={{
                        gridTemplateColumns: '40px minmax(120px, 1.2fr) minmax(140px, 1.5fr) minmax(80px, 0.8fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(120px, 1.2fr)',
                        borderColor: 'var(--color-gray-700)',
                        backgroundColor: row.getIsExpanded() ? 'var(--color-gray-850)' : 'transparent'
                      }}
                      onMouseEnter={(e) => { 
                        if (!row.getIsExpanded()) e.currentTarget.style.backgroundColor = 'var(--color-gray-850)'
                      }}
                      onMouseLeave={(e) => { 
                        if (!row.getIsExpanded()) e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      {row.getVisibleCells().map(cell => (
                        <div 
                          key={cell.id} 
                          className="flex items-center overflow-hidden"
                          style={{ minWidth: 0 }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      ))}
                    </div>
                    
                    {/* Expanded Row Content */}
                    {row.getIsExpanded() && (
                      <div 
                        className="px-4 py-4 border-b"
                        style={{
                          backgroundColor: 'var(--color-gray-800)',
                          borderColor: 'var(--color-gray-700)'
                        }}
                      >
                        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
                          {/* Actions Checklist */}
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: 'var(--color-gray-400)' }}>
                              <CheckCircle className="w-3.5 h-3.5" />
                              Action Items
                            </h4>
                            <div className="space-y-2">
                              {getActionsWithState(row.original).map((action, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-2 p-2 rounded transition-colors"
                                  style={{
                                    backgroundColor: action.type === 'custom' ? 'var(--color-purple-900)' : 'var(--color-blue-900)',
                                    borderLeft: `3px solid ${action.completed ? 'var(--color-green-500)' : 'var(--color-gray-600)'}`
                                  }}
                                >
                                  <button
                                    onClick={() => toggleActionCompletion(row.original.id, idx)}
                                    className="shrink-0 mt-0.5 transition-colors"
                                  >
                                    {action.completed ? (
                                      <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-green-400)' }} />
                                    ) : (
                                      <Square className="w-4 h-4" style={{ color: 'var(--color-gray-500)' }} />
                                    )}
                                  </button>
                                  <div className="flex-1">
                                    <p 
                                      className="text-xs font-medium"
                                      style={{ 
                                        color: action.completed ? 'var(--color-gray-400)' : 'var(--color-gray-200)',
                                        textDecoration: action.completed ? 'line-through' : 'none'
                                      }}
                                    >
                                      {action.text}
                                    </p>
                                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-gray-500)' }}>
                                      {action.type === 'custom' ? 'Custom Action' : 'Recommended Action'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Progress indicator */}
                            <div className="mt-3 p-2 rounded" style={{ backgroundColor: 'var(--color-gray-850)' }}>
                              <div className="flex justify-between items-center mb-1">
                                <p className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-gray-400)' }}>
                                  Progress
                                </p>
                                <p className="text-[10px] font-semibold" style={{ color: 'var(--sand-teal)' }}>
                                  {getActionsWithState(row.original).filter(a => a.completed).length} / {getActionsWithState(row.original).length}
                                </p>
                              </div>
                              <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-gray-700)' }}>
                                <div 
                                  className="h-full transition-all duration-300"
                                  style={{ 
                                    width: `${(getActionsWithState(row.original).filter(a => a.completed).length / getActionsWithState(row.original).length) * 100}%`,
                                    backgroundColor: 'var(--sand-teal)'
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Timeline */}
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: 'var(--color-gray-400)' }}>
                              <Clock className="w-3.5 h-3.5" />
                              Timeline
                            </h4>
                            <div className="space-y-3">
                              {row.original.timeline.map((event, idx) => (
                                <div key={idx} className="flex gap-2">
                                  <Circle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--sand-teal)' }} />
                                  <div className="flex-1">
                                    <p className="text-xs font-medium" style={{ color: 'var(--color-gray-200)' }}>
                                      {event.event}
                                    </p>
                                    <p className="text-[10px]" style={{ color: 'var(--color-gray-500)' }}>
                                      {formatDate(event.timestamp)} at {formatTime(event.timestamp)}
                                    </p>
                                    {event.description && (
                                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-gray-400)' }}>
                                        {event.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Complaint reference */}
                            {row.original.complaintId && (
                              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-gray-700)' }}>
                                <p className="text-[10px]" style={{ color: 'var(--color-gray-500)' }}>
                                  Related complaint: <span className="font-mono font-semibold" style={{ color: 'var(--sand-teal)' }}>{row.original.complaintId}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t shrink-0 flex justify-between items-center" style={{ borderColor: 'var(--color-gray-700)' }}>
        <p className="text-xs" style={{ color: 'var(--color-gray-400)' }}>
          Showing {table.getRowModel().rows.length} work order{table.getRowModel().rows.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-md font-medium transition-colors"
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
      
      {/* Resize Handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize group"
        style={{ 
          touchAction: 'none'
        }}
      >
        <Maximize2 
          className="absolute bottom-1 right-1 w-3 h-3 opacity-30 group-hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-gray-400)' }}
        />
      </div>
    </div>
  )
}
