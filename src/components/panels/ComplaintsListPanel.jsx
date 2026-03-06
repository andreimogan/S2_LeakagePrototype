import { X, GripVertical, ArrowUpDown, ArrowUp, ArrowDown, Search, ExternalLink, ChevronDown, ChevronUp, MapPin, Clock, User, Wrench, Activity, Plus, AlertCircle, Maximize2, Trash2 } from 'lucide-react'
import { useDraggable } from '../../hooks/useDraggable'
import { useResizable } from '../../hooks/useResizable'
import { usePanelContext } from '../../contexts/PanelContext'
import { CUSTOMER_COMPLAINTS } from '../../data/customerComplaints'
import { useState, useMemo, useEffect } from 'react'
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  getExpandedRowModel
} from '@tanstack/react-table'

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (coord1, coord2) => {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = coord1[1] * Math.PI / 180
  const φ2 = coord2[1] * Math.PI / 180
  const Δφ = (coord2[1] - coord1[1]) * Math.PI / 180
  const Δλ = (coord2[0] - coord1[0]) * Math.PI / 180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c // Distance in meters
}

// Helper function to create a seeded random number generator
const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Helper function to get a consistent hash from string
const hashString = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// Helper function to find nearby assets (mock data for now)
const findNearbyAssets = (coordinates, complaintId) => {
  // In a real system, this would query a spatial database
  // For now, generating consistent mock data based on complaint ID
  const seed = hashString(complaintId)
  const assets = []
  
  // Mock pipes within 50m (always present)
  assets.push({
    type: 'pipe',
    id: `PIPE-${complaintId}-001`,
    name: 'Main Line - 12" Cast Iron',
    distance: Math.floor(seededRandom(seed) * 30) + 10,
    material: 'Cast Iron',
    diameter: '12"',
    age: '45 years',
    condition: 'Fair'
  })
  
  // Mock valve (consistent based on complaint ID)
  if (seededRandom(seed + 1) > 0.5) {
    assets.push({
      type: 'valve',
      id: `VALVE-${complaintId}`,
      name: 'Gate Valve #4521',
      distance: Math.floor(seededRandom(seed + 2) * 40) + 15,
      status: 'Operational',
      lastMaintenance: '03/2025'
    })
  }
  
  // Mock hydrant (consistent based on complaint ID)
  if (seededRandom(seed + 3) > 0.3) {
    assets.push({
      type: 'hydrant',
      id: `HYD-${complaintId}`,
      name: 'Fire Hydrant #892',
      distance: Math.floor(seededRandom(seed + 4) * 50) + 20,
      status: 'Active',
      lastInspection: '01/2026'
    })
  }
  
  return assets.sort((a, b) => a.distance - b.distance)
}

// Helper function to check for affected SCADA sensors (mock data)
const checkAffectedSensors = (coordinates, complaintId) => {
  // In dark areas (low sensor density), this often returns empty
  // Simulating 20% chance of having nearby sensors (consistent based on complaint ID)
  const seed = hashString(complaintId)
  if (seededRandom(seed + 5) > 0.8) {
    return [{
      id: `SCADA-${complaintId}`,
      name: 'Pressure Sensor PS-3421',
      distance: Math.floor(seededRandom(seed + 6) * 100) + 50,
      type: 'Pressure',
      currentReading: '42 PSI',
      status: 'Anomaly Detected',
      trend: 'Decreasing'
    }]
  }
  return []
}

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    'New': { bg: 'var(--color-blue-600)', text: 'var(--color-white)' },
    'In Progress': { bg: 'var(--color-orange-600)', text: 'var(--color-white)' },
    'Resolved': { bg: 'var(--color-green-600)', text: 'var(--color-white)' }
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

export default function ComplaintsListPanel({ onClose, preFilteredEventId = null, preExpandedComplaintId = null }) {
  const { position, isDragging, dragRef, handleMouseDown } = useDraggable({ 
    x: window.innerWidth / 2 - 450, 
    y: window.innerHeight / 2 - 300 
  })
  const { size, isResizing, handleResizeStart } = useResizable(
    { width: 900, height: 600 },
    { width: 700, height: 400 }
  )
  const { leakageEvents, openLeakageEventDashboard, setSelectedComplaint, createWorkOrder, workOrders, complaintsListExpandedComplaintId, setComplaintsListExpandedComplaintId } = usePanelContext()
  const [sorting, setSorting] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [eventAreaFilter, setEventAreaFilter] = useState(preFilteredEventId || 'all')
  const [expanded, setExpanded] = useState({})
  const [customActions, setCustomActions] = useState({}) // Track custom actions per complaint
  const [showCustomActionInput, setShowCustomActionInput] = useState({}) // Track which complaints show input
  
  // Handle pre-expanded complaint
  useEffect(() => {
    if (complaintsListExpandedComplaintId) {
      // Find the complaint in the data
      const complaintIndex = complaintsWithEventArea.findIndex(c => c.id === complaintsListExpandedComplaintId)
      if (complaintIndex !== -1) {
        setExpanded({ [complaintIndex]: true })
        // Clear the pre-expanded state after setting it
        setComplaintsListExpandedComplaintId(null)
      }
    }
  }, [complaintsListExpandedComplaintId, setComplaintsListExpandedComplaintId])

  // Helper function to add a custom action
  const addCustomAction = (complaintId, instruction) => {
    if (!instruction.trim()) return
    
    setCustomActions(prev => ({
      ...prev,
      [complaintId]: [...(prev[complaintId] || []), instruction.trim()]
    }))
    setShowCustomActionInput(prev => ({ ...prev, [complaintId]: false }))
  }

  // Helper function to remove a custom action
  const removeCustomAction = (complaintId, index) => {
    setCustomActions(prev => ({
      ...prev,
      [complaintId]: prev[complaintId].filter((_, i) => i !== index)
    }))
  }

  // Mock customer data generator (consistent based on complaint ID)
  const generateCustomerInfo = (complaintId) => {
    const seed = hashString(complaintId)
    const phoneNumber = 1000 + Math.floor(seededRandom(seed + 7) * 9000)
    
    return {
      name: `Customer ${complaintId.replace('complaint-', '')}`,
      phone: `(314) 555-${String(phoneNumber)}`,
      address: CUSTOMER_COMPLAINTS.features.find(c => c.id === complaintId)?.properties.location || 'N/A',
      accountNumber: `ACC-${complaintId.replace('complaint-', '').padStart(6, '0')}`
    }
  }

  // Get complaint status based on work orders
  const getComplaintStatus = (complaintId) => {
    // Find if there's a work order for this complaint
    const workOrder = workOrders?.find(wo => wo.complaintId === complaintId)
    
    if (!workOrder) {
      return 'New'
    }
    
    // Map work order status to complaint status
    if (workOrder.status === 'Completed') {
      return 'Resolved'
    } else if (workOrder.status === 'New' || workOrder.status === 'Assigned' || workOrder.status === 'In Progress') {
      return 'In Progress'
    }
    
    return 'New'
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

  // Prepare complaints data with event area information and apply event area filter
  const complaintsWithEventArea = useMemo(() => {
    let filteredData = CUSTOMER_COMPLAINTS.features.map(complaint => {
      // Find which event(s) this complaint belongs to
      const linkedEvents = leakageEvents.filter(event => 
        event.complaintIds.includes(complaint.id)
      )
      
      return {
        ...complaint,
        linkedEvents: linkedEvents,
        eventAreaName: linkedEvents.length > 0 ? linkedEvents[0].name : null,
        eventAreaId: linkedEvents.length > 0 ? linkedEvents[0].id : null,
        status: getComplaintStatus(complaint.id),
        customerInfo: generateCustomerInfo(complaint.id),
        nearbyAssets: findNearbyAssets(complaint.geometry.coordinates, complaint.id),
        affectedSensors: checkAffectedSensors(complaint.geometry.coordinates, complaint.id)
      }
    })

    // Apply event area filter
    if (eventAreaFilter && eventAreaFilter !== 'all') {
      if (eventAreaFilter === 'unlinked') {
        filteredData = filteredData.filter(c => !c.eventAreaId)
      } else {
        filteredData = filteredData.filter(c => c.eventAreaId === eventAreaFilter)
      }
    }

    return filteredData
  }, [leakageEvents, eventAreaFilter, workOrders])

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
      enableSorting: true,
    }),
    columnHelper.accessor('properties.themeName', {
      id: 'themeName',
      header: 'Type',
      cell: (info) => (
        <p className="text-xs truncate w-full" style={{ color: 'var(--color-gray-300)' }}>
          {info.getValue()}
        </p>
      ),
      enableSorting: true,
    }),
    columnHelper.accessor('properties.priority', {
      id: 'priority',
      header: 'Priority',
      cell: (info) => <PriorityBadge priority={info.getValue()} />,
      sortingFn: (rowA, rowB) => {
        const priorityOrder = { High: 3, Medium: 2, Low: 1 }
        return priorityOrder[rowA.original.properties.priority] - priorityOrder[rowB.original.properties.priority]
      },
      enableSorting: true,
    }),
    columnHelper.accessor('status', {
      id: 'status',
      header: 'Status',
      cell: (info) => <StatusBadge status={info.getValue()} />,
      enableSorting: true,
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
      enableSorting: true,
    }),
    columnHelper.accessor('eventAreaName', {
      id: 'eventArea',
      header: 'Event Area',
      cell: (info) => {
        const eventAreaName = info.getValue()
        const linkedEvents = info.row.original.linkedEvents
        
        if (!eventAreaName) {
          return (
            <span className="text-xs italic" style={{ color: 'var(--color-gray-500)' }}>
              Not linked
            </span>
          )
        }
        
        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (linkedEvents.length > 0) {
                  openLeakageEventDashboard(linkedEvents[0].id)
                }
              }}
              className="text-xs font-medium hover:underline text-left truncate flex items-center gap-1"
              style={{ color: 'var(--sand-teal)' }}
              title={`Open ${eventAreaName}`}
            >
              <span className="truncate">{eventAreaName}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </button>
          </div>
        )
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.eventAreaName || ''
        const b = rowB.original.eventAreaName || ''
        return a.localeCompare(b)
      },
    }),
  ], [setSelectedComplaint, openLeakageEventDashboard])

  // Create table instance
  const table = useReactTable({
    data: complaintsWithEventArea,
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

  // Statistics
  const stats = useMemo(() => {
    const total = complaintsWithEventArea.length
    const newComplaints = complaintsWithEventArea.filter(c => c.status === 'New').length
    const inProgress = complaintsWithEventArea.filter(c => c.status === 'In Progress').length
    const resolved = complaintsWithEventArea.filter(c => c.status === 'Resolved').length
    
    return { total, newComplaints, inProgress, resolved }
  }, [complaintsWithEventArea])

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
      aria-label="All Complaints"
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
              ALL CUSTOMER COMPLAINTS
            </p>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-gray-100)' }}>
              Complaints Overview
              {eventAreaFilter && eventAreaFilter !== 'all' && (
                <span className="ml-2 text-sm font-normal" style={{ color: 'var(--sand-teal)' }}>
                  • {eventAreaFilter === 'unlinked' 
                    ? 'Unlinked' 
                    : leakageEvents.find(e => e.id === eventAreaFilter)?.name}
                </span>
              )}
            </h2>
          </div>
        </div>
        <button
          className="rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
          style={{ color: 'var(--color-gray-400)' }}
          onClick={onClose}
          aria-label="Close complaints panel"
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
              New
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-blue-400)' }}>
              {stats.newComplaints}
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
              Resolved
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-green-400)' }}>
              {stats.resolved}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: 'var(--color-gray-700)' }}>
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'var(--color-gray-400)' }} aria-hidden="true" />
          <input
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-md border text-xs"
            style={{
              backgroundColor: 'var(--color-gray-800)',
              borderColor: 'var(--color-gray-600)',
              color: 'var(--color-gray-100)',
            }}
            placeholder="Search complaints..."
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium whitespace-nowrap" style={{ color: 'var(--color-gray-400)' }}>
            Event Area:
          </label>
          <select
            value={eventAreaFilter}
            onChange={(e) => setEventAreaFilter(e.target.value)}
            className="h-8 px-3 pr-8 rounded-md border text-xs font-medium appearance-none"
            style={{
              backgroundColor: 'var(--color-gray-700)',
              borderColor: 'var(--color-gray-600)',
              color: 'var(--color-gray-200)',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1.5 4.5h9L6 9z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              minWidth: '160px'
            }}
          >
            <option value="all">All Complaints</option>
            <option value="unlinked">Not Linked</option>
            {leakageEvents.map(event => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Area - Table */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="overflow-x-auto">
          <div style={{ minWidth: '700px' }}>
            {/* Table Header */}
            <div 
              className="grid gap-3 px-4 py-3 border-b sticky top-0 z-10"
              style={{ 
                gridTemplateColumns: '40px minmax(100px, 1fr) minmax(140px, 1.5fr) minmax(80px, 0.8fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(120px, 1.2fr)',
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
                      gridTemplateColumns: '40px minmax(100px, 1fr) minmax(140px, 1.5fr) minmax(80px, 0.8fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(120px, 1.2fr)',
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
                      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                        {/* Left Column - Details */}
                        <div className="space-y-4">
                          {/* Customer Information */}
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-gray-400)' }}>
                              <User className="w-3.5 h-3.5" />
                              Customer Information
                            </h4>
                            <div className="space-y-1.5 text-xs" style={{ color: 'var(--color-gray-300)' }}>
                              <div className="flex justify-between">
                                <span style={{ color: 'var(--color-gray-500)' }}>Name:</span>
                                <span className="font-medium">{row.original.customerInfo.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span style={{ color: 'var(--color-gray-500)' }}>Phone:</span>
                                <span className="font-medium">{row.original.customerInfo.phone}</span>
                              </div>
                              <div className="flex justify-between">
                                <span style={{ color: 'var(--color-gray-500)' }}>Account:</span>
                                <span className="font-medium">{row.original.customerInfo.accountNumber}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Location & Time */}
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-gray-400)' }}>
                              <MapPin className="w-3.5 h-3.5" />
                              Location & Time
                            </h4>
                            <div className="space-y-1.5 text-xs" style={{ color: 'var(--color-gray-300)' }}>
                              <div className="flex justify-between">
                                <span style={{ color: 'var(--color-gray-500)' }}>Address:</span>
                                <span className="font-medium">{row.original.properties.location}</span>
                              </div>
                              <div className="flex justify-between">
                                <span style={{ color: 'var(--color-gray-500)' }}>Coordinates:</span>
                                <span className="font-medium text-[10px]">
                                  {row.original.geometry.coordinates[1].toFixed(4)}, {row.original.geometry.coordinates[0].toFixed(4)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span style={{ color: 'var(--color-gray-500)' }}>Reported:</span>
                                <span className="font-medium">{row.original.properties.reportedDate} {row.original.properties.reportedTime}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Nearby Assets */}
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-gray-400)' }}>
                              <Wrench className="w-3.5 h-3.5" />
                              Nearby Assets ({row.original.nearbyAssets.length})
                            </h4>
                            {row.original.nearbyAssets.length > 0 ? (
                              <div className="space-y-2">
                                {row.original.nearbyAssets.map((asset, idx) => (
                                  <div 
                                    key={idx} 
                                    className="p-2 rounded border"
                                    style={{
                                      backgroundColor: 'var(--color-gray-850)',
                                      borderColor: 'var(--color-gray-600)'
                                    }}
                                  >
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="text-xs font-medium" style={{ color: 'var(--sand-teal)' }}>
                                        {asset.name}
                                      </span>
                                      <span className="text-[10px]" style={{ color: 'var(--color-gray-500)' }}>
                                        {asset.distance}m
                                      </span>
                                    </div>
                                    <div className="text-[10px] space-y-0.5" style={{ color: 'var(--color-gray-400)' }}>
                                      {asset.type === 'pipe' && (
                                        <>
                                          <div>Material: {asset.material}</div>
                                          <div>Diameter: {asset.diameter} • Age: {asset.age}</div>
                                          <div>Condition: <span style={{ color: asset.condition === 'Fair' ? 'var(--color-yellow-500)' : 'var(--color-green-500)' }}>{asset.condition}</span></div>
                                        </>
                                      )}
                                      {asset.type === 'valve' && (
                                        <>
                                          <div>Status: <span style={{ color: 'var(--color-green-500)' }}>{asset.status}</span></div>
                                          <div>Last Maintenance: {asset.lastMaintenance}</div>
                                        </>
                                      )}
                                      {asset.type === 'hydrant' && (
                                        <>
                                          <div>Status: <span style={{ color: 'var(--color-green-500)' }}>{asset.status}</span></div>
                                          <div>Last Inspection: {asset.lastInspection}</div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs italic" style={{ color: 'var(--color-gray-500)' }}>
                                No assets found within 100m
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Right Column - Actions & Sensors */}
                        <div className="space-y-4">
                          {/* Affected Sensors */}
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-gray-400)' }}>
                              <Activity className="w-3.5 h-3.5" />
                              Affected Sensors
                            </h4>
                            {row.original.affectedSensors.length > 0 ? (
                              <div className="space-y-2">
                                {row.original.affectedSensors.map((sensor, idx) => (
                                  <div 
                                    key={idx} 
                                    className="p-2 rounded border"
                                    style={{
                                      backgroundColor: 'var(--color-gray-850)',
                                      borderColor: 'var(--color-orange-600)'
                                    }}
                                  >
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="text-xs font-medium" style={{ color: 'var(--color-orange-400)' }}>
                                        {sensor.name}
                                      </span>
                                      <span className="text-[10px]" style={{ color: 'var(--color-gray-500)' }}>
                                        {sensor.distance}m
                                      </span>
                                    </div>
                                    <div className="text-[10px] space-y-0.5" style={{ color: 'var(--color-gray-400)' }}>
                                      <div>Type: {sensor.type}</div>
                                      <div>Reading: <span className="font-medium">{sensor.currentReading}</span></div>
                                      <div>Status: <span style={{ color: 'var(--color-orange-500)' }}>{sensor.status}</span></div>
                                      <div>Trend: <span style={{ color: 'var(--color-red-500)' }}>{sensor.trend}</span></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div 
                                className="p-3 rounded border text-center"
                                style={{
                                  backgroundColor: 'var(--color-gray-850)',
                                  borderColor: 'var(--color-gray-600)'
                                }}
                              >
                                <AlertCircle className="w-6 h-6 mx-auto mb-1 opacity-50" style={{ color: 'var(--color-gray-500)' }} />
                                <p className="text-[10px] italic" style={{ color: 'var(--color-gray-500)' }}>
                                  No sensors nearby
                                </p>
                                <p className="text-[10px] mt-1" style={{ color: 'var(--color-gray-600)' }}>
                                  Dark customer area - low sensor coverage
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {/* Create Work Order / View Existing Work Order */}
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-gray-400)' }}>
                              <Plus className="w-3.5 h-3.5" />
                              Actions
                            </h4>
                            <div className="space-y-2">
                              {/* Check if work order exists */}
                              {(() => {
                                const existingWorkOrder = workOrders?.find(wo => wo.complaintId === row.original.id)
                                
                                if (existingWorkOrder) {
                                  return (
                                    <div 
                                      className="p-2.5 rounded border"
                                      style={{
                                        backgroundColor: 'var(--color-green-900)',
                                        borderColor: 'var(--color-green-700)'
                                      }}
                                    >
                                      <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--color-green-300)' }}>
                                        WORK ORDER ACTIVE
                                      </p>
                                      <p className="text-[11px] mb-2" style={{ color: 'var(--color-green-200)' }}>
                                        Work Order: <span className="font-mono font-semibold">{existingWorkOrder.id}</span>
                                        <br />
                                        Status: <span className="font-semibold">{existingWorkOrder.status}</span>
                                      </p>
                                    </div>
                                  )
                                }
                                
                                // No work order exists, show creation option
                                return (
                                  <>
                                    {/* System-generated instructions */}
                                    <div 
                                      className="p-2.5 rounded border"
                                      style={{
                                        backgroundColor: 'var(--color-blue-900)',
                                        borderColor: 'var(--color-blue-700)'
                                      }}
                                    >
                                      <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--color-blue-300)' }}>
                                        RECOMMENDED ACTIONS
                                      </p>
                                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-blue-200)' }}>
                                        • Perform meter test<br />
                                        • Curb stop isolation<br />
                                        • Visual inspection of nearby pipe<br />
                                        {row.original.nearbyAssets.some(a => a.type === 'valve') && '• Check valve operation\n'}
                                      </p>
                                    </div>
                                    
                                    {/* Custom Actions */}
                                    {customActions[row.original.id] && customActions[row.original.id].length > 0 && (
                                      <div 
                                        className="p-2.5 rounded border space-y-2"
                                        style={{
                                          backgroundColor: 'var(--color-purple-900)',
                                          borderColor: 'var(--color-purple-700)'
                                        }}
                                      >
                                        <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--color-purple-300)' }}>
                                          CUSTOM ACTIONS
                                        </p>
                                        {customActions[row.original.id].map((action, index) => (
                                          <div 
                                            key={index}
                                            className="flex items-start gap-2 group"
                                          >
                                            <p className="text-[11px] leading-relaxed flex-1" style={{ color: 'var(--color-purple-200)' }}>
                                              • {action}
                                            </p>
                                            <button
                                              onClick={() => removeCustomAction(row.original.id, index)}
                                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-purple-800"
                                              title="Remove action"
                                            >
                                              <Trash2 className="w-3 h-3" style={{ color: 'var(--color-purple-300)' }} />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {/* Add Custom Action Input */}
                                    {showCustomActionInput[row.original.id] ? (
                                      <div className="space-y-2">
                                        <textarea
                                          autoFocus
                                          placeholder="Enter custom action instructions..."
                                          className="w-full px-2 py-2 rounded text-xs resize-none"
                                          rows={3}
                                          style={{
                                            backgroundColor: 'var(--color-gray-800)',
                                            borderColor: 'var(--color-gray-600)',
                                            color: 'var(--color-gray-200)',
                                            border: '1px solid'
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                              e.preventDefault()
                                              addCustomAction(row.original.id, e.target.value)
                                              e.target.value = ''
                                            } else if (e.key === 'Escape') {
                                              setShowCustomActionInput(prev => ({ ...prev, [row.original.id]: false }))
                                            }
                                          }}
                                        />
                                        <div className="flex gap-2">
                                          <button
                                            onClick={(e) => {
                                              const textarea = e.target.parentElement.previousSibling
                                              addCustomAction(row.original.id, textarea.value)
                                              textarea.value = ''
                                            }}
                                            className="flex-1 px-2 py-1.5 rounded text-[10px] font-semibold transition-colors"
                                            style={{
                                              backgroundColor: 'var(--sand-teal)',
                                              color: 'var(--color-white)'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--sand-teal-light)' }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--sand-teal)' }}
                                          >
                                            Add Action
                                          </button>
                                          <button
                                            onClick={() => setShowCustomActionInput(prev => ({ ...prev, [row.original.id]: false }))}
                                            className="px-2 py-1.5 rounded text-[10px] font-semibold transition-colors"
                                            style={{
                                              backgroundColor: 'var(--color-gray-700)',
                                              color: 'var(--color-gray-300)'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-600)' }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gray-700)' }}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setShowCustomActionInput(prev => ({ ...prev, [row.original.id]: true }))}
                                        className="w-full px-3 py-2 rounded-md font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                                        style={{
                                          backgroundColor: 'var(--color-gray-700)',
                                          color: 'var(--color-gray-200)',
                                          border: '1px dashed var(--color-gray-600)'
                                        }}
                                        onMouseEnter={(e) => { 
                                          e.currentTarget.style.backgroundColor = 'var(--color-gray-600)'
                                          e.currentTarget.style.borderColor = 'var(--color-gray-500)'
                                        }}
                                        onMouseLeave={(e) => { 
                                          e.currentTarget.style.backgroundColor = 'var(--color-gray-700)'
                                          e.currentTarget.style.borderColor = 'var(--color-gray-600)'
                                        }}
                                      >
                                        <Plus className="w-4 h-4" />
                                        Add Custom Action
                                      </button>
                                    )}
                                    
                                    <button
                                      onClick={() => {
                                        if (createWorkOrder) {
                                          // Combine recommended and custom actions
                                          let instructions = 'Perform meter test plus curb stop isolation'
                                          if (customActions[row.original.id] && customActions[row.original.id].length > 0) {
                                            instructions += '\n\nCustom Actions:\n' + customActions[row.original.id].map(a => `• ${a}`).join('\n')
                                          }
                                          
                                          createWorkOrder({
                                            complaintId: row.original.id,
                                            type: row.original.properties.themeName,
                                            priority: row.original.properties.priority,
                                            location: row.original.properties.location,
                                            instructions: instructions
                                          })
                                        }
                                      }}
                                      className="w-full px-3 py-2 rounded-md font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                                      style={{
                                        backgroundColor: 'var(--sand-teal)',
                                        color: 'var(--color-white)'
                                      }}
                                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--sand-teal-light)' }}
                                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--sand-teal)' }}
                                    >
                                      <Plus className="w-4 h-4" />
                                      Create Work Order
                                    </button>
                                  </>
                                )
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t shrink-0 flex justify-between items-center" style={{ borderColor: 'var(--color-gray-700)' }}>
        <p className="text-xs" style={{ color: 'var(--color-gray-400)' }}>
          Showing {table.getRowModel().rows.length} of {complaintsWithEventArea.length} complaints
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
