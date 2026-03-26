import { useState, useEffect } from 'react'
import {
  GripVertical,
  RefreshCw,
  Settings,
  X,
  Search,
  ChevronRight,
  ChevronDown,
  MousePointer,
  MousePointerClick,
} from 'lucide-react'
import { usePanelContext } from '../../contexts/PanelContext'
import { useDraggable } from '../../hooks/useDraggable'

const categories = [
  { 
    id: 'events', 
    name: 'Events & Contacts', 
    activeCount: 1,
    layers: [
      {
        id: 'burst-events',
        name: 'Burst Events',
        active: false,
        expanded: false,
        legend: {
          title: 'Critical Burst Locations',
          description: 'Detected burst events on the water network'
        }
      },
      {
        id: 'customer-complaints',
        name: 'Customer Complaints',
        active: false,
        expanded: false,
        legend: {
          title: 'COMPLAINT THEME',
          description: 'Dominant complaint type reported.',
          themes: [
            { id: 'water_coming_up', label: 'Water Coming Up', color: '#FF6B6B', active: true },
            { id: 'no_water', label: 'No Water', color: '#FF8C42', active: true },
            { id: 'pressure_problem', label: 'Pressure Problem', color: '#FFD93D', active: true },
            { id: 'missing_loose_cover', label: 'Missing/Loose - Cover/S...', color: '#60A5FA', active: true },
            { id: 'water_in_building', label: 'Water in Building', color: '#6BCF7F', active: true },
            { id: 'other', label: 'Other', color: '#9CA3AF', active: true },
            { id: 'unknown', label: 'Unknown', color: '#6B7280', active: true }
          ]
        }
      },
      {
        id: 'complaint-heatmap',
        name: 'Complaint Heatmap',
        active: false,
        expanded: false,
      },
    ]
  },
  { 
    id: 'sensors', 
    name: 'Sensors & Monitoring', 
    activeCount: 0,
    layers: [
      {
        id: 'pressure-sensors',
        name: 'Network Meters',
        active: false,
        expanded: false,
        legend: {
          title: 'Meter Status',
          description: 'Real-time pressure monitoring',
          statuses: [
            { id: 'normal', label: 'Normal', color: 'rgb(59, 130, 246)', active: true },
            { id: 'warning', label: 'Warning', color: 'rgb(251, 146, 60)', active: true },
            { id: 'critical', label: 'Critical', color: 'rgb(220, 38, 38)', active: true }
          ]
        }
      },
      {
        id: 'pressure-sensors-map',
        name: 'Pressure Sensors',
        active: false,
        expanded: false,
        legend: {
          title: 'Pressure Sensor Status',
          description: 'Gauge-style pressure monitoring',
          statuses: [
            { id: 'normal', label: 'Normal', color: 'rgb(59, 130, 246)', active: true },
            { id: 'warning', label: 'Warning', color: 'rgb(251, 146, 60)', active: true },
            { id: 'critical', label: 'Critical', color: 'rgb(220, 38, 38)', active: true }
          ]
        }
      }
    ]
  },
]

export default function ManageMapLayersPanel() {
  const { 
    layersVisible, 
    toggleLayers, 
    pressureSensorsVisible,
    setPressureSensorsVisible,
    setActiveSensorStatuses,
    pressureSensorsMapVisible,
    setPressureSensorsMapVisible,
    setActivePressureSensorStatuses,
    pressureSensorEditMode,
    setPressureSensorEditMode,
    burstEventsVisible,
    setBurstEventsVisible,
    customerComplaintsVisible,
    setCustomerComplaintsVisible,
    activeComplaintThemes,
    setActiveComplaintThemes,
    complaintInteractionMode,
    setComplaintInteractionMode,
    complaintHeatmapVisible,
    setComplaintHeatmapVisible,
    setMapComplaintsPriorityFilter,
    sensorEditMode,
    setSensorEditMode,
    burstEditMode,
    setBurstEditMode,
    burstGradientParams,
    updateBurstGradientParams,
    complaintHeatmapParams,
    updateComplaintHeatmapParams
  } = usePanelContext()
  const PANEL_WIDTH = 320
  const RIGHT_MARGIN = 24
  const TOP_OFFSET = 80

  const getRightAlignedPosition = () => ({
    x: typeof window !== 'undefined' ? window.innerWidth - PANEL_WIDTH - RIGHT_MARGIN : 0,
    y: TOP_OFFSET,
  })

  const { position, setPosition, isDragging, dragRef, handleMouseDown } = useDraggable(getRightAlignedPosition())

  // Reset to right-aligned position whenever the panel is opened
  useEffect(() => {
    if (layersVisible) {
      setPosition({
        x: window.innerWidth - PANEL_WIDTH - RIGHT_MARGIN,
        y: TOP_OFFSET,
      })
    }
  }, [layersVisible, setPosition])
  const [showActiveList, setShowActiveList] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState({})
  const [expandedLayers, setExpandedLayers] = useState({})
  const [layerStates, setLayerStates] = useState({
    'burst-events': burstEventsVisible,
    'customer-complaints': customerComplaintsVisible,
    'complaint-heatmap': complaintHeatmapVisible,
    'pressure-sensors': pressureSensorsVisible,
    'pressure-sensors-map': pressureSensorsMapVisible,
  })
  const [sensorStatusStates, setSensorStatusStates] = useState({
    normal: true,
    warning: true,
    critical: true,
  })
  const [pressureSensorStatusStates, setPressureSensorStatusStates] = useState({
    normal: true,
    warning: true,
    critical: true,
  })
  
  const [complaintThemeStates, setComplaintThemeStates] = useState({
    water_coming_up: true,
    no_water: true,
    pressure_problem: true,
    missing_loose_cover: true,
    water_in_building: true,
    other: true,
    unknown: true
  })
  
  // Sync context state changes to local layer states
  useEffect(() => {
    setLayerStates(prev => ({
      ...prev,
      'pressure-sensors-map': pressureSensorsMapVisible
    }))
  }, [pressureSensorsMapVisible])

  useEffect(() => {
    setLayerStates(prev => ({
      ...prev,
      'burst-events': burstEventsVisible
    }))
  }, [burstEventsVisible])

  useEffect(() => {
    setLayerStates(prev => ({
      ...prev,
      'pressure-sensors': pressureSensorsVisible
    }))
  }, [pressureSensorsVisible])
  
  useEffect(() => {
    setLayerStates(prev => ({
      ...prev,
      'customer-complaints': customerComplaintsVisible
    }))
  }, [customerComplaintsVisible])
  
  useEffect(() => {
    setLayerStates(prev => ({
      ...prev,
      'complaint-heatmap': complaintHeatmapVisible
    }))
  }, [complaintHeatmapVisible])
  
  if (!layersVisible) return null

  const totalActiveCount = categories.reduce((sum, cat) => sum + cat.activeCount, 0)
  
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }
  
  const toggleLayer = (layerId) => {
    const newState = !layerStates[layerId]
    setLayerStates(prev => ({
      ...prev,
      [layerId]: newState
    }))
    
    if (layerId === 'pressure-sensors') {
      setPressureSensorsVisible(newState)
    }
    if (layerId === 'pressure-sensors-map') {
      setPressureSensorsMapVisible(newState)
    }
    if (layerId === 'burst-events') {
      setBurstEventsVisible(newState)
    }
    if (layerId === 'customer-complaints') {
      setCustomerComplaintsVisible(newState)
      if (!newState) {
        setMapComplaintsPriorityFilter(null)
      }
    }
    if (layerId === 'complaint-heatmap') {
      setComplaintHeatmapVisible(newState)
    }
  }
  
  const toggleLayerExpanded = (layerId) => {
    setExpandedLayers(prev => ({
      ...prev,
      [layerId]: !prev[layerId]
    }))
  }
  
  const toggleSensorStatus = (statusId) => {
    const newState = !sensorStatusStates[statusId]
    setSensorStatusStates(prev => ({
      ...prev,
      [statusId]: newState
    }))
    
    // Sync with context
    setActiveSensorStatuses(prev => ({
      ...prev,
      [statusId]: newState
    }))
  }

  const togglePressureSensorStatus = (statusId) => {
    const newState = !pressureSensorStatusStates[statusId]
    setPressureSensorStatusStates(prev => ({
      ...prev,
      [statusId]: newState
    }))
    
    setActivePressureSensorStatuses(prev => ({
      ...prev,
      [statusId]: newState
    }))
  }
  
  const toggleComplaintTheme = (themeId) => {
    const newState = !complaintThemeStates[themeId]
    setComplaintThemeStates(prev => ({
      ...prev,
      [themeId]: newState
    }))
    
    setActiveComplaintThemes(prev => ({
      ...prev,
      [themeId]: newState
    }))
  }
  
  return (
    <div
      className="rounded-xl border fixed shadow-xl overflow-hidden flex flex-col z-30"
      role="region"
      aria-label="Map Layers"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: '320px',
        maxHeight: 'calc(100vh - 5rem)',
        backgroundColor: 'var(--sand-surface)',
        borderColor: 'var(--color-gray-700)',
        color: 'var(--color-gray-100)',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div
        ref={dragRef}
        className="p-3 flex items-center justify-between select-none border-b shrink-0"
        style={{ 
          borderColor: 'var(--color-gray-700)',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="w-4 h-4 shrink-0" style={{ color: 'var(--color-gray-400)' }} aria-hidden="true" />
          <span className="shrink-0 flex items-center">
            <svg className="w-4 h-4" style={{ color: 'var(--color-gray-500)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--color-gray-100)' }}>
                Manage Map Layers
              </h2>
            </div>
            <p className="text-xs opacity-70" style={{ color: 'var(--color-gray-400)' }}>
              Click categories to expand
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="relative group">
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 h-7 w-7"
              style={{ color: 'var(--color-gray-300)' }}
              aria-label="Clear cached layer settings and reload"
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-gray-100)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-gray-300)'}
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
            </button>
            <span
              className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 text-[11px] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow border"
              style={{
                backgroundColor: 'var(--sand-surface)',
                color: 'var(--color-gray-100)',
                borderColor: 'var(--color-gray-700)',
              }}
            >
              Clear cached layer toggles and bust tile cache
            </span>
          </div>
          <div className="relative">
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors h-7 w-7"
              style={{ color: 'var(--color-gray-300)' }}
              title="Basemap settings"
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-gray-100)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-gray-300)'}
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors h-7 w-7"
            style={{ color: 'var(--color-gray-300)' }}
            title="Close"
            onClick={toggleLayers}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-gray-100)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-gray-300)'}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Resize handle */}
      <div
        className="absolute right-0 bottom-0 w-4 h-4 cursor-nwse-resize z-10 flex items-center justify-center opacity-50 hover:opacity-100"
        title="Drag to resize"
      >
        <svg className="w-3 h-3" style={{ color: 'var(--color-gray-500)' }} viewBox="0 0 10 10" fill="currentColor">
          <path d="M9 1v8H1" stroke="currentColor" strokeWidth="1.5" fill="none"></path>
          <path d="M9 4v5H4" stroke="currentColor" strokeWidth="1.5" fill="none"></path>
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Search */}
        <div className="mb-3 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4" style={{ color: 'var(--color-gray-400)' }} aria-hidden="true" />
          <input
            id="layers-search"
            name="layers-search"
            className="flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors pl-8 focus-visible:outline-none focus-visible:ring-1"
            style={{
              backgroundColor: 'var(--sand-surface)',
              borderColor: 'var(--color-gray-700)',
              color: 'var(--color-gray-100)',
            }}
            placeholder="Search layers"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Active layers section */}
        <div
          className="mb-3 border rounded-md"
          style={{
            borderColor: 'var(--color-gray-700)',
            backgroundColor: 'rgba(26, 29, 34, 0.4)',
          }}
        >
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'rgb(0, 129, 217)' }}></div>
              <span className="text-sm font-medium" style={{ color: 'var(--color-gray-100)' }}>Active</span>
              {totalActiveCount > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[11px] leading-none font-medium border"
                  style={{
                    backgroundColor: 'var(--color-blue-900)',
                    color: 'var(--color-blue-100)',
                    borderColor: 'var(--color-blue-700)',
                  }}
                  title="Number of active layers"
                >
                  {totalActiveCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2" title="Toggle active layers list">
                <span className="text-xs" style={{ color: 'var(--color-gray-300)' }}>Show List</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showActiveList}
                  className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors scale-85"
                  style={{
                    backgroundColor: showActiveList ? 'var(--color-blue-600)' : 'var(--color-gray-300)',
                  }}
                  onClick={() => setShowActiveList(!showActiveList)}
                  aria-label="Show active layers list"
                >
                  <span
                    className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                    style={{
                      transform: showActiveList ? 'translateX(16px)' : 'translateX(0)',
                    }}
                  ></span>
                </button>
              </div>
              <button
                className="text-xs px-2 py-1 rounded border w-[56px] transition-colors disabled:opacity-40"
                style={{
                  borderColor: 'var(--color-gray-600)',
                  color: 'var(--color-gray-200)',
                }}
                title="Turn off all active layers"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-gray-700)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} style={{ marginLeft: 0 }}>
                <div
                  role="button"
                  aria-expanded={expandedCategories[category.id] || false}
                  aria-controls={`group-content-${category.id}`}
                  tabIndex={0}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer border min-h-[36px] sticky top-0 z-10"
                  style={{
                    borderColor: 'var(--color-gray-600)',
                    backgroundColor: 'rgba(31, 41, 55, 0.95)',
                    backdropFilter: 'saturate(180%) blur(4px)',
                  }}
                  title={`Expand ${category.name} category`}
                  onClick={() => toggleCategory(category.id)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-gray-700)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(31, 41, 55, 0.95)'}
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
                    <div className="w-4 h-4 flex items-center justify-center transition-colors flex-shrink-0" style={{ color: 'var(--color-gray-400)' }}>
                      {expandedCategories[category.id] ? (
                        <ChevronDown className="w-3 h-3" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="w-3 h-3" aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[13px] font-medium leading-tight truncate" style={{ color: 'var(--color-gray-200)' }}>
                        {category.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-1 pl-1 justify-end min-w-[32px] whitespace-nowrap">
                    {category.activeCount > 0 && (
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[11px] leading-none font-medium border"
                        style={{
                          backgroundColor: 'var(--color-blue-900)',
                          color: 'var(--color-blue-100)',
                          borderColor: 'var(--color-blue-700)',
                        }}
                        title="Number of visible layers in this category"
                      >
                        {category.activeCount}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Layers */}
                {expandedCategories[category.id] && category.layers && category.layers.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {category.layers.map((layer) => (
                      <div
                        key={layer.id}
                        className="rounded-lg border transition-colors"
                        style={{
                          marginLeft: '16px',
                          borderColor: layerStates[layer.id] ? 'var(--color-blue-500)' : 'var(--color-gray-600)',
                          backgroundColor: layerStates[layer.id] ? 'rgba(59, 130, 246, 0.35)' : 'rgba(26, 29, 34, 0.15)',
                        }}
                        onMouseEnter={(e) => {
                          if (!layerStates[layer.id]) {
                            e.currentTarget.style.backgroundColor = 'rgba(55, 65, 81, 0.3)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!layerStates[layer.id]) {
                            e.currentTarget.style.backgroundColor = 'rgba(26, 29, 34, 0.15)'
                          }
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <button
                              type="button"
                              className="flex h-8 w-8 min-w-[32px] items-center justify-center rounded-md border transition-colors"
                              style={{
                                borderColor: 'var(--color-gray-600)',
                                color: 'var(--color-gray-300)',
                              }}
                              aria-label={expandedLayers[layer.id] ? 'Hide layer legend' : 'Show layer legend'}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleLayerExpanded(layer.id)
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-gray-700)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              {expandedLayers[layer.id] ? (
                                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                              )}
                            </button>
                            <span className="truncate text-[13px] font-medium leading-tight" style={{ color: 'var(--color-gray-100)' }}>
                              {layer.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={layerStates[layer.id] || false}
                              className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors scale-85"
                              style={{
                                backgroundColor: layerStates[layer.id] ? 'var(--color-blue-600)' : 'var(--color-gray-300)',
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleLayer(layer.id)
                              }}
                              onMouseEnter={(e) => {
                                if (!layerStates[layer.id]) {
                                  e.currentTarget.style.backgroundColor = 'rgba(156, 163, 175, 0.7)'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!layerStates[layer.id]) {
                                  e.currentTarget.style.backgroundColor = 'var(--color-gray-300)'
                                }
                              }}
                            >
                              <span
                                className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                                style={{
                                  transform: layerStates[layer.id] ? 'translateX(16px)' : 'translateX(0)',
                                }}
                              ></span>
                            </button>
                          </div>
                        </div>
                        
                        {/* Legend */}
                        {expandedLayers[layer.id] && layer.legend && (
                          <div
                            className="mt-2 rounded-md border px-2.5 py-2"
                            style={{
                              borderColor: 'var(--color-gray-600)',
                              backgroundColor: 'rgba(26, 29, 34, 0.6)',
                            }}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-gray-300)' }}>
                                  {layer.legend.title}
                                </p>
                                <p className="text-xs leading-snug" style={{ color: 'var(--color-gray-300)' }}>
                                  {layer.legend.description}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className="px-1.5 py-0.5 rounded-full text-[11px] leading-none font-medium border"
                                  style={{
                                    borderColor: 'var(--color-blue-700)',
                                    backgroundColor: 'rgba(59, 130, 246, 0.4)',
                                    color: 'var(--color-blue-200)',
                                  }}
                                >
                                  Active All
                                </span>
                                {layer.id === 'customer-complaints' && (
                                  <span
                                    className="px-1.5 py-0.5 rounded-full text-[11px] leading-none font-medium border"
                                    style={{
                                      borderColor: 'var(--color-purple-700)',
                                      backgroundColor: 'rgba(147, 51, 234, 0.4)',
                                      color: 'var(--color-purple-200)',
                                    }}
                                  >
                                    Global Time Filter
                                  </span>
                                )}
                                {layer.id === 'customer-complaints' && (
                                  <>
                                    <button
                                      type="button"
                                      className="flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-semibold transition-colors"
                                      style={{
                                        backgroundColor: complaintInteractionMode === 'hover' ? 'var(--color-blue-700)' : 'var(--color-gray-700)',
                                        color: complaintInteractionMode === 'hover' ? 'var(--color-blue-100)' : 'var(--color-gray-300)',
                                        borderColor: complaintInteractionMode === 'hover' ? 'var(--color-blue-600)' : 'var(--color-gray-600)',
                                      }}
                                      onClick={() => setComplaintInteractionMode('hover')}
                                      aria-pressed={complaintInteractionMode === 'hover'}
                                    >
                                      <MousePointer className="h-3 w-3" aria-hidden="true" />
                                      Hover
                                    </button>
                                    <button
                                      type="button"
                                      className="flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-semibold transition-colors"
                                      style={{
                                        backgroundColor: complaintInteractionMode === 'click' ? 'var(--color-emerald-700)' : 'var(--color-gray-700)',
                                        color: complaintInteractionMode === 'click' ? 'var(--color-emerald-100)' : 'var(--color-gray-300)',
                                        borderColor: complaintInteractionMode === 'click' ? 'var(--color-emerald-600)' : 'var(--color-gray-600)',
                                      }}
                                      onClick={() => setComplaintInteractionMode('click')}
                                      aria-pressed={complaintInteractionMode === 'click'}
                                    >
                                      <MousePointerClick className="h-3 w-3" aria-hidden="true" />
                                      Click
                                    </button>
                                    <button
                                      type="button"
                                      className="text-xs font-semibold transition-colors"
                                      style={{
                                        color: 'var(--color-blue-200)',
                                      }}
                                      onClick={() => setComplaintInteractionMode('hover')}
                                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-blue-100)'}
                                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-blue-200)'}
                                    >
                                      Reset
                                    </button>
                                  </>
                                )}
                                {layer.id !== 'customer-complaints' && (
                                  <>
                                <button
                                  type="button"
                                  className="flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-semibold transition-colors"
                                  style={{
                                    backgroundColor: 'var(--color-blue-700)',
                                    color: 'var(--color-blue-100)',
                                    borderColor: 'var(--color-blue-600)',
                                  }}
                                  aria-pressed="true"
                                >
                                  <MousePointer className="h-3 w-3" aria-hidden="true" />
                                  Hover
                                </button>
                                <button
                                  type="button"
                                  className="flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-semibold transition-colors"
                                  style={{
                                    backgroundColor: 'var(--color-emerald-700)',
                                    color: 'var(--color-emerald-100)',
                                    borderColor: 'var(--color-emerald-600)',
                                  }}
                                  aria-pressed="true"
                                >
                                  <MousePointerClick className="h-3 w-3" aria-hidden="true" />
                                  Click
                                </button>
                                <button
                                  type="button"
                                  className="text-xs font-semibold transition-colors"
                                  style={{
                                    color: 'var(--color-blue-200)',
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-blue-100)'}
                                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-blue-200)'}
                                >
                                  Reset
                                </button>
                                  </>
                                )}
                                {layer.id === 'pressure-sensors' && (
                                  <button
                                    type="button"
                                    className="flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-semibold transition-colors"
                                    style={{
                                      backgroundColor: sensorEditMode ? 'var(--color-purple-700)' : 'var(--color-gray-700)',
                                      color: sensorEditMode ? 'var(--color-purple-100)' : 'var(--color-gray-200)',
                                      borderColor: sensorEditMode ? 'var(--color-purple-600)' : 'var(--color-gray-600)',
                                    }}
                                    onClick={() => setSensorEditMode(!sensorEditMode)}
                                    onMouseEnter={(e) => {
                                      if (!sensorEditMode) {
                                        e.currentTarget.style.backgroundColor = 'var(--color-gray-600)'
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!sensorEditMode) {
                                        e.currentTarget.style.backgroundColor = 'var(--color-gray-700)'
                                      }
                                    }}
                                    title={sensorEditMode ? 'Exit edit mode' : 'Enter edit mode to reposition meters'}
                                  >
                                    {sensorEditMode ? 'Exit Edit' : 'Edit'}
                                  </button>
                                )}
                                {layer.id === 'pressure-sensors-map' && (
                                  <button
                                    type="button"
                                    className="flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-semibold transition-colors"
                                    style={{
                                      backgroundColor: pressureSensorEditMode ? 'var(--color-purple-700)' : 'var(--color-gray-700)',
                                      color: pressureSensorEditMode ? 'var(--color-purple-100)' : 'var(--color-gray-200)',
                                      borderColor: pressureSensorEditMode ? 'var(--color-purple-600)' : 'var(--color-gray-600)',
                                    }}
                                    onClick={() => setPressureSensorEditMode(!pressureSensorEditMode)}
                                    onMouseEnter={(e) => {
                                      if (!pressureSensorEditMode) {
                                        e.currentTarget.style.backgroundColor = 'var(--color-gray-600)'
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!pressureSensorEditMode) {
                                        e.currentTarget.style.backgroundColor = 'var(--color-gray-700)'
                                      }
                                    }}
                                    title={pressureSensorEditMode ? 'Exit edit mode' : 'Enter edit mode to reposition pressure sensors'}
                                  >
                                    {pressureSensorEditMode ? 'Exit Edit' : 'Edit'}
                                  </button>
                                )}
                                {layer.id === 'burst-events' && (
                                  <button
                                    type="button"
                                    className="flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-semibold transition-colors"
                                    style={{
                                      backgroundColor: burstEditMode ? 'var(--color-purple-700)' : 'var(--color-gray-700)',
                                      color: burstEditMode ? 'var(--color-purple-100)' : 'var(--color-gray-200)',
                                      borderColor: burstEditMode ? 'var(--color-purple-600)' : 'var(--color-gray-600)',
                                    }}
                                    onClick={() => setBurstEditMode(!burstEditMode)}
                                    onMouseEnter={(e) => {
                                      if (!burstEditMode) {
                                        e.currentTarget.style.backgroundColor = 'var(--color-gray-600)'
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!burstEditMode) {
                                        e.currentTarget.style.backgroundColor = 'var(--color-gray-700)'
                                      }
                                    }}
                                    title={burstEditMode ? 'Exit edit mode' : 'Enter edit mode to reposition burst markers'}
                                  >
                                    {burstEditMode ? 'Exit Edit' : 'Edit'}
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Burst Events Gradient Controls */}
                            {layer.id === 'burst-events' && (
                              <div className="mt-3 space-y-3 px-1">
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium" style={{ color: 'var(--color-gray-300)' }}>
                                      Gradient Size
                                    </label>
                                    <span className="text-xs font-semibold" style={{ color: 'var(--color-blue-300)' }}>
                                      {burstGradientParams.size}px
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="1"
                                    max="500"
                                    step="1"
                                    value={burstGradientParams.size}
                                    onChange={(e) => updateBurstGradientParams({
                                      ...burstGradientParams,
                                      size: parseInt(e.target.value)
                                    })}
                                    className="w-full h-1.5 rounded-lg cursor-pointer"
                                    style={{
                                      background: `linear-gradient(to right, var(--color-blue-600) 0%, var(--color-blue-600) ${((burstGradientParams.size - 1) / 499) * 100}%, var(--color-gray-600) ${((burstGradientParams.size - 1) / 499) * 100}%, var(--color-gray-600) 100%)`,
                                      accentColor: 'var(--color-blue-600)'
                                    }}
                                  />
                                </div>
                                
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium" style={{ color: 'var(--color-gray-300)' }}>
                                      Gradient Opacity
                                    </label>
                                    <span className="text-xs font-semibold" style={{ color: 'var(--color-blue-300)' }}>
                                      {Math.round(burstGradientParams.opacity * 100)}%
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0.1"
                                    max="1"
                                    step="0.05"
                                    value={burstGradientParams.opacity}
                                    onChange={(e) => updateBurstGradientParams({
                                      ...burstGradientParams,
                                      opacity: parseFloat(e.target.value)
                                    })}
                                    className="w-full h-1.5 rounded-lg cursor-pointer"
                                    style={{
                                      background: `linear-gradient(to right, var(--color-blue-600) 0%, var(--color-blue-600) ${((burstGradientParams.opacity - 0.1) / 0.9) * 100}%, var(--color-gray-600) ${((burstGradientParams.opacity - 0.1) / 0.9) * 100}%, var(--color-gray-600) 100%)`,
                                      accentColor: 'var(--color-blue-600)'
                                    }}
                                  />
                                </div>
                                
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium" style={{ color: 'var(--color-gray-300)' }}>
                                      Gradient Spread
                                    </label>
                                    <span className="text-xs font-semibold" style={{ color: 'var(--color-blue-300)' }}>
                                      {burstGradientParams.spread}%
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="30"
                                    max="90"
                                    step="5"
                                    value={burstGradientParams.spread}
                                    onChange={(e) => updateBurstGradientParams({
                                      ...burstGradientParams,
                                      spread: parseInt(e.target.value)
                                    })}
                                    className="w-full h-1.5 rounded-lg cursor-pointer"
                                    style={{
                                      background: `linear-gradient(to right, var(--color-blue-600) 0%, var(--color-blue-600) ${((burstGradientParams.spread - 30) / 60) * 100}%, var(--color-gray-600) ${((burstGradientParams.spread - 30) / 60) * 100}%, var(--color-gray-600) 100%)`,
                                      accentColor: 'var(--color-blue-600)'
                                    }}
                                  />
                                </div>
                                
                                <button
                                  type="button"
                                  className="w-full text-xs font-semibold py-1.5 rounded-md transition-colors"
                                  style={{
                                    color: 'var(--color-blue-300)',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    border: '1px solid var(--color-blue-700)'
                                  }}
                                  onClick={() => updateBurstGradientParams({
                                    size: 280,
                                    opacity: 0.35,
                                    spread: 60
                                  })}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'
                                    e.currentTarget.style.color = 'var(--color-blue-200)'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
                                    e.currentTarget.style.color = 'var(--color-blue-300)'
                                  }}
                                >
                                  Reset to Default
                                </button>
                              </div>
                            )}
                            
                            <ul className="mt-2 space-y-2">
                              {layer.legend.riskLevels && layer.legend.riskLevels.map((risk) => (
                                <li key={risk.id} className="flex items-center justify-between gap-3">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <span
                                      className="flex h-4 w-4 items-center justify-center rounded-sm border shadow-sm"
                                      style={{
                                        backgroundColor: risk.color,
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                      }}
                                      aria-hidden="true"
                                    ></span>
                                    <span className="truncate text-sm font-medium" style={{ color: 'var(--color-gray-100)' }}>
                                      {risk.label}
                                    </span>
                                  </div>
                                  {risk.id !== 'unknown' && (
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        role="switch"
                                        aria-checked={riskLevelStates[risk.id]}
                                        className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors scale-85"
                                        style={{
                                          backgroundColor: riskLevelStates[risk.id] ? 'var(--color-blue-600)' : 'var(--color-gray-300)',
                                        }}
                                        aria-label={`Toggle ${risk.label}`}
                                        onClick={() => toggleRiskLevel(risk.id)}
                                      >
                                        <span
                                          className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                                          style={{
                                            transform: riskLevelStates[risk.id] ? 'translateX(16px)' : 'translateX(0)',
                                          }}
                                        ></span>
                                      </button>
                                    </div>
                                  )}
                                </li>
                              ))}
                              {layer.legend.statuses && layer.legend.statuses.map((status) => {
                                const isPressureSensorMap = layer.id === 'pressure-sensors-map'
                                const statusStates = isPressureSensorMap ? pressureSensorStatusStates : sensorStatusStates
                                const onToggle = isPressureSensorMap ? togglePressureSensorStatus : toggleSensorStatus
                                return (
                                <li key={status.id} className="flex items-center justify-between gap-3">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <span
                                      className="flex h-4 w-4 items-center justify-center rounded-full border shadow-sm"
                                      style={{
                                        backgroundColor: status.color,
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                      }}
                                      aria-hidden="true"
                                    ></span>
                                    <span className="truncate text-sm font-medium" style={{ color: 'var(--color-gray-100)' }}>
                                      {status.label}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={statusStates[status.id]}
                                      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors scale-85"
                                      style={{
                                        backgroundColor: statusStates[status.id] ? 'var(--color-blue-600)' : 'var(--color-gray-300)',
                                      }}
                                      aria-label={`Toggle ${status.label}`}
                                      onClick={() => onToggle(status.id)}
                                    >
                                      <span
                                        className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                                        style={{
                                          transform: statusStates[status.id] ? 'translateX(16px)' : 'translateX(0)',
                                        }}
                                      ></span>
                                    </button>
                                  </div>
                                </li>
                              )})}
                              {layer.legend.themes && layer.legend.themes.map((theme) => (
                                <li key={theme.id} className="flex items-center justify-between gap-3">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <span
                                      className="flex h-4 w-4 items-center justify-center rounded-sm border shadow-sm"
                                      style={{
                                        backgroundColor: theme.color,
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                      }}
                                      aria-hidden="true"
                                    ></span>
                                    <span className="truncate text-sm font-medium" style={{ color: 'var(--color-gray-100)' }}>
                                      {theme.label}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={complaintThemeStates[theme.id]}
                                      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors scale-85"
                                      style={{
                                        backgroundColor: complaintThemeStates[theme.id] ? 'var(--color-blue-600)' : 'var(--color-gray-300)',
                                      }}
                                      aria-label={`Toggle ${theme.label}`}
                                      onClick={() => toggleComplaintTheme(theme.id)}
                                    >
                                      <span
                                        className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                                        style={{
                                          transform: complaintThemeStates[theme.id] ? 'translateX(16px)' : 'translateX(0)',
                                        }}
                                      ></span>
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {/* Complaint heatmap settings */}
                        {expandedLayers[layer.id] && layer.id === 'complaint-heatmap' && (
                          <div
                            className="mt-2 rounded-md border px-2.5 py-2"
                            style={{
                              borderColor: 'var(--color-gray-600)',
                              backgroundColor: 'rgba(26, 29, 34, 0.6)',
                            }}
                          >
                            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-gray-300)' }}>
                              Heatmap Settings
                            </p>
                            <p className="text-xs leading-snug mb-3" style={{ color: 'var(--color-gray-400)' }}>
                              Customize heatmap visualization based on complaint priority
                            </p>
                            
                            {/* Radius slider */}
                            <div className="space-y-1.5 mb-3">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-medium" style={{ color: 'var(--color-gray-300)' }}>
                                  Heatmap Radius
                                </label>
                                <span className="text-xs font-semibold" style={{ color: 'var(--color-blue-300)' }}>
                                  {complaintHeatmapParams.radius}px
                                </span>
                              </div>
                              <input
                                type="range"
                                min="15"
                                max="60"
                                step="5"
                                value={complaintHeatmapParams.radius}
                                onChange={(e) => updateComplaintHeatmapParams({
                                  ...complaintHeatmapParams,
                                  radius: parseInt(e.target.value)
                                })}
                                className="w-full h-1.5 rounded-lg cursor-pointer"
                                style={{
                                  background: `linear-gradient(to right, var(--color-blue-600) 0%, var(--color-blue-600) ${((complaintHeatmapParams.radius - 15) / 45) * 100}%, var(--color-gray-600) ${((complaintHeatmapParams.radius - 15) / 45) * 100}%, var(--color-gray-600) 100%)`,
                                  accentColor: 'var(--color-blue-600)'
                                }}
                              />
                            </div>

                            {/* Intensity slider */}
                            <div className="space-y-1.5 mb-3">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-medium" style={{ color: 'var(--color-gray-300)' }}>
                                  Heatmap Intensity
                                </label>
                                <span className="text-xs font-semibold" style={{ color: 'var(--color-blue-300)' }}>
                                  {complaintHeatmapParams.intensity.toFixed(1)}x
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0.5"
                                max="2"
                                step="0.1"
                                value={complaintHeatmapParams.intensity}
                                onChange={(e) => updateComplaintHeatmapParams({
                                  ...complaintHeatmapParams,
                                  intensity: parseFloat(e.target.value)
                                })}
                                className="w-full h-1.5 rounded-lg cursor-pointer"
                                style={{
                                  background: `linear-gradient(to right, var(--color-blue-600) 0%, var(--color-blue-600) ${((complaintHeatmapParams.intensity - 0.5) / 1.5) * 100}%, var(--color-gray-600) ${((complaintHeatmapParams.intensity - 0.5) / 1.5) * 100}%, var(--color-gray-600) 100%)`,
                                  accentColor: 'var(--color-blue-600)'
                                }}
                              />
                            </div>

                            {/* Opacity slider */}
                            <div className="space-y-1.5 mb-3">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-medium" style={{ color: 'var(--color-gray-300)' }}>
                                  Heatmap Opacity
                                </label>
                                <span className="text-xs font-semibold" style={{ color: 'var(--color-blue-300)' }}>
                                  {Math.round(complaintHeatmapParams.opacity * 100)}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0.3"
                                max="1"
                                step="0.05"
                                value={complaintHeatmapParams.opacity}
                                onChange={(e) => updateComplaintHeatmapParams({
                                  ...complaintHeatmapParams,
                                  opacity: parseFloat(e.target.value)
                                })}
                                className="w-full h-1.5 rounded-lg cursor-pointer"
                                style={{
                                  background: `linear-gradient(to right, var(--color-blue-600) 0%, var(--color-blue-600) ${((complaintHeatmapParams.opacity - 0.3) / 0.7) * 100}%, var(--color-gray-600) ${((complaintHeatmapParams.opacity - 0.3) / 0.7) * 100}%, var(--color-gray-600) 100%)`,
                                  accentColor: 'var(--color-blue-600)'
                                }}
                              />
                            </div>

                            {/* Reset button */}
                            <button
                              type="button"
                              className="w-full text-xs font-semibold py-1.5 rounded-md transition-colors"
                              style={{
                                color: 'var(--color-blue-300)',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid var(--color-blue-700)'
                              }}
                              onClick={() => updateComplaintHeatmapParams({
                                radius: 40,
                                intensity: 1,
                                opacity: 0.8
                              })}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'
                                e.currentTarget.style.color = 'var(--color-blue-200)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
                                e.currentTarget.style.color = 'var(--color-blue-300)'
                              }}
                            >
                              Reset to Default
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
