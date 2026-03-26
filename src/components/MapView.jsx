import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { PRESSURE_SENSORS } from '../data/pressureSensors'
import { PRESSURE_SENSOR_MAP_DATA } from '../data/pressureSensorData'
import { BURST_EVENTS } from '../data/burstEvents'
import { CUSTOMER_COMPLAINTS } from '../data/customerComplaints'
import { usePanelContext } from '../contexts/PanelContext'
import PressureSensorTooltip from './tooltips/PressureSensorTooltip'
import CustomerComplaintTooltip from './tooltips/CustomerComplaintTooltip'
import ComplaintDetailPanel from './panels/ComplaintDetailPanel'
import LeakageEventDashboardPanel from './panels/LeakageEventDashboardPanel'

// Helper function to get color for meter status
function getStatusColor(status) {
  switch(status) {
    case 'critical': return 'rgb(220, 38, 38)'
    case 'warning': return 'rgb(251, 146, 60)'
    case 'normal': return 'rgb(59, 130, 246)'
    default: return 'rgb(156, 163, 175)'
  }
}

// Lighter background colors for pressure sensor circular badge (Figma design)
function getPressureSensorBgColor(status) {
  switch(status) {
    case 'critical': return '#EE8080'
    case 'warning': return '#F5B87A'
    case 'normal': return '#7BA3F5'
    default: return '#9CA3AF'
  }
}

// Helper function to get color for complaint theme
function getComplaintThemeColor(theme) {
  const colors = {
    'water_coming_up': '#FF6B6B',
    'no_water': '#FF8C42',
    'pressure_problem': '#FFD93D',
    'missing_loose_cover': '#60A5FA',
    'water_in_building': '#6BCF7F',
    'other': '#9CA3AF',
    'unknown': '#6B7280'
  }
  return colors[theme] || colors.unknown
}

// Helper function to get meter data with saved positions applied
function getMergedSensorData() {
  try {
    const savedPositions = JSON.parse(localStorage.getItem('sensorPositions') || '{}')
    
    // If no saved positions, return original data
    if (Object.keys(savedPositions).length === 0) {
      return PRESSURE_SENSORS
    }
    
    // Create a copy and apply saved positions
    const mergedData = {
      ...PRESSURE_SENSORS,
      features: PRESSURE_SENSORS.features.map(feature => {
        if (savedPositions[feature.id]) {
          return {
            ...feature,
            geometry: {
              ...feature.geometry,
              coordinates: savedPositions[feature.id].coordinates
            }
          }
        }
        return feature
      })
    }
    
    return mergedData
  } catch (error) {
    console.error('Error loading saved meter positions:', error)
    return PRESSURE_SENSORS
  }
}

// Helper function to get pressure sensor (gauge) data with saved positions applied
function getMergedPressureSensorMapData() {
  try {
    const savedPositions = JSON.parse(localStorage.getItem('pressureSensorPositions') || '{}')
    if (Object.keys(savedPositions).length === 0) return PRESSURE_SENSOR_MAP_DATA
    return {
      ...PRESSURE_SENSOR_MAP_DATA,
      features: PRESSURE_SENSOR_MAP_DATA.features.map((feature) => {
        if (savedPositions[feature.id]) {
          return {
            ...feature,
            geometry: {
              ...feature.geometry,
              coordinates: savedPositions[feature.id].coordinates,
            },
          }
        }
        return feature
      }),
    }
  } catch (error) {
    console.error('Error loading saved pressure sensor positions:', error)
    return PRESSURE_SENSOR_MAP_DATA
  }
}

// MapView component with pressure zone visualization
// Neighborhood boundary data: © City of St. Louis, provided by SLU OpenGIS (CC-BY-4.0)
// https://github.com/slu-openGIS/STL_BOUNDARY_Nhood
export default function MapView() {
  const { 
    selectedPersona,
    selectedCharacteristic,
    pressureSensorsVisible,
    activeSensorStatuses,
    pressureSensorsMapVisible,
    activePressureSensorStatuses,
    pressureSensorEditMode,
    burstEventsVisible,
    burstImplementationComplete,
    customerComplaintsVisible,
    activeComplaintThemes,
    selectedComplaint,
    setSelectedComplaint,
    complaintHeatmapVisible,
    filteredLeakageEventId,
    showFilteredComplaintsOnly,
    mapComplaintsPriorityFilter,
    leakageEvents,
    leakageEventDashboardVisible,
    selectedLeakageEvent,
    closeLeakageEventDashboard,
    sensorEditMode,
    burstEditMode,
    burstGradientParams,
    complaintHeatmapParams,
    setSelectedSensor,
    mapZoomRequest,
    sendEventToCopilot
  } = usePanelContext()
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const burstPopup = useRef(null)
  const burstMarkersRef = useRef([])
  const sensorMarkers = useRef([])
  const [isDraggingSensor, setIsDraggingSensor] = useState(false)
  const markerClickedRef = useRef(false)
  const pressureSensorMarkersRef = useRef([])
  const [hoveredPressureSensor, setHoveredPressureSensor] = useState(null)
  const [pressureSensorTooltipPos, setPressureSensorTooltipPos] = useState(null)
  
  // Customer complaints state
  const complaintMarkersRef = useRef([])
  const [hoveredComplaint, setHoveredComplaint] = useState(null)
  const [complaintTooltipPos, setComplaintTooltipPos] = useState(null)

  useEffect(() => {
    if (map.current) return // Initialize map only once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      // MapTiler style with hardcoded API key
      style: 'https://api.maptiler.com/maps/streets-v2-dark/style.json?key=X1kjwlVN29N1UZItdixx',
      center: [-90.1994, 38.6270], // St. Louis, MO
      zoom: 11,
      minZoom: 8,
      maxZoom: 18,
      attributionControl: true,
      customAttribution: 'Neighborhood boundaries © City of St. Louis / SLU OpenGIS'
    })

    // Add minimal zoom controls (no compass)
    map.current.addControl(
      new maplibregl.NavigationControl({
        showCompass: false,
        showZoom: true,
        visualizePitch: false
      }),
      'top-right'
    )

    // Wait for map to load before adding layers
    map.current.on('load', () => {
      console.log('🗺️ Map loaded, adding layers...')
      
      try {
        // Add pressure sensors source with saved positions applied
        map.current.addSource('pressure-sensors', {
          type: 'geojson',
          data: getMergedSensorData()
        })
        console.log('✅ Network meters source added with saved positions')
        
        // Add network meter circles layer
        map.current.addLayer({
          id: 'pressure-sensors-circles',
          type: 'circle',
          source: 'pressure-sensors',
          paint: {
            'circle-radius': 6.4,
            'circle-color': [
              'match',
              ['get', 'status'],
              'critical', 'rgb(220, 38, 38)',  // Red
              'warning', 'rgb(251, 146, 60)',   // Orange
              'normal', 'rgb(59, 130, 246)',    // Blue
              'rgb(156, 163, 175)'              // Gray default
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': [
              'match',
              ['get', 'status'],
              'critical', 'rgb(153, 27, 27)',   // Darker red
              'warning', 'rgb(234, 88, 12)',    // Darker orange
              'normal', 'rgb(29, 78, 216)',     // Darker blue
              'rgb(75, 85, 99)'                 // Gray default
            ],
            'circle-stroke-opacity': 0.8,
            'circle-opacity': 0.7
          },
          layout: {
            visibility: 'none' // Start hidden, controlled by toggle
          }
        })
        console.log('✅ Pressure sensors layer added')
        
        // Burst events are rendered as custom DOM markers (see burst visibility useEffect)
        
        // Add click handler for network meters (show panel on click)
        map.current.on('click', 'pressure-sensors-circles', (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0]
            const properties = feature.properties
            
            // Set the selected meter in context to open the panel
            setSelectedSensor({
              sensorId: properties.sensorId,
              name: properties.name,
              status: properties.status,
              pressure: properties.pressure,
              lastReading: properties.lastReading,
              location: properties.location
            })
            
            console.log('✅ Meter panel opened for:', properties.sensorId)
          }
        })
        
        // Change cursor on meter hover
        map.current.on('mouseenter', 'pressure-sensors-circles', () => {
          map.current.getCanvas().style.cursor = 'pointer'
        })
        
        map.current.on('mouseleave', 'pressure-sensors-circles', () => {
          map.current.getCanvas().style.cursor = ''
        })
        
        console.log('✅ Network meter click handlers added')
        
        // Mark map as loaded so effects can run
        setMapLoaded(true)
        console.log('✅ Map fully loaded with layers')
      } catch (error) {
        console.error('❌ Error adding map layers:', error)
      }
    })

    // Cleanup on unmount
    return () => {
      // Remove burst popup if it exists
      if (burstPopup.current) {
        burstPopup.current.remove()
        burstPopup.current = null
      }
      
      if (map.current) {
        map.current.remove()
        map.current = null
      }
      setMapLoaded(false)
    }
  }, [])

  // Handle custom event from burst popup to send context to Copilot
  useEffect(() => {
    const handleAddBurstContext = () => {
      const context = {
        eventName: 'Major Water Main Burst - Downtown District',
        dateTimeRange: 'Aug 27, 2023, 8/27/2023, 10:00 AM - 8/27/2023, 2:15 PM',
        affectedPipes: 156,
        threshold: '< 68 PSI',
        customersAffected: 1404,
        severity: [
          { label: 'Critical', count: 45, color: 'red' },
          { label: 'Severe', count: 111, color: 'orange' },
        ],
        recommendation: {
          title: 'Emergency Isolation',
          description: 'Immediate Isolate of Zone 5 required to limit water loss. Dispatch Crew Alpha with emergency evacuation equipment and coordinate lane/road closures with City of St Louis Street Department and MoDOT',
        },
      }
      sendEventToCopilot(context)
    }

    window.addEventListener('addBurstContextToCopilot', handleAddBurstContext)
    
    return () => {
      window.removeEventListener('addBurstContextToCopilot', handleAddBurstContext)
    }
  }, [sendEventToCopilot])


  // Toggle complaint heatmap layer visibility
  useEffect(() => {
    if (!mapLoaded || !map.current || !map.current.loaded()) return
    
    // Show heatmap if either complaintHeatmapVisible OR showFilteredComplaintsOnly is true
    const visibility = (complaintHeatmapVisible || showFilteredComplaintsOnly) ? 'visible' : 'none'
    console.log('👁️ Setting complaint heatmap visibility to:', visibility)
    
    try {
      if (map.current.getLayer('complaint-heatmap-layer')) {
        map.current.setLayoutProperty('complaint-heatmap-layer', 'visibility', visibility)
        console.log('✅ Complaint heatmap layer visibility set to:', visibility)
      }
    } catch (error) {
      console.error('❌ Error toggling complaint heatmap visibility:', error)
    }
  }, [complaintHeatmapVisible, showFilteredComplaintsOnly, mapLoaded])


  // Meter visibility is now handled by the meter markers effect above
  // (markers are created/removed based on pressureSensorsVisible)

  // Burst position management (localStorage)
  const getBurstPositions = () => {
    try {
      const saved = localStorage.getItem('burstEventPositions')
      return saved ? JSON.parse(saved) : {}
    } catch (error) {
      console.error('Error loading burst positions:', error)
      return {}
    }
  }

  const saveBurstPosition = (burstId, coordinates) => {
    try {
      const positions = getBurstPositions()
      positions[burstId] = coordinates
      localStorage.setItem('burstEventPositions', JSON.stringify(positions))
      console.log(`✅ Saved burst position for ${burstId}:`, coordinates)
    } catch (error) {
      console.error('Error saving burst position:', error)
    }
  }

  const getMergedBurstData = () => {
    const savedPositions = getBurstPositions()
    return {
      ...BURST_EVENTS,
      features: BURST_EVENTS.features.map(feature => {
        const savedCoords = savedPositions[feature.id]
        return savedCoords ? {
          ...feature,
          geometry: {
            ...feature.geometry,
            coordinates: savedCoords
          }
        } : feature
      })
    }
  }


  // Create/remove burst event markers (custom DOM with gradient glow)
  useEffect(() => {
    if (!mapLoaded || !map.current) return
    
    // Clean up existing markers
    burstMarkersRef.current.forEach(marker => marker.remove())
    burstMarkersRef.current = []
    
    if (!burstEventsVisible && !burstEditMode) return
    
    const REFERENCE_ZOOM = 11  // Base zoom level for scale calculation
    
    const popupContent = `
      <div class="burst-location-popup" style="font-family: var(--font-family-primary); color: var(--color-gray-100);">
        <div style="font-weight: var(--font-weight-bold); color: var(--color-red-400); margin-bottom: 8px; font-size: 14px;">Major Water Main Burst</div>
        <div style="font-size: var(--text-xs); margin-bottom: 6px; color: var(--color-gray-300);">Downtown District</div>
        <div style="font-size: var(--text-xs); margin-bottom: 8px; color: var(--color-gray-300);">
          <span style="font-weight: var(--font-weight-semibold);">Status:</span> <span style="color: var(--color-red-400);">Active Burst (CONFIRMED)</span>
        </div>
        <div style="margin-bottom: 6px; font-size: var(--text-sm);">
          <span style="font-weight: var(--font-weight-semibold); color: var(--color-gray-300);">Assets Affected:</span>
        </div>
        <div style="font-size: var(--text-sm); margin-bottom: 8px; color: var(--color-gray-200); margin-left: 8px;">
          156 affected pipes<br/>
          <span style="font-size: var(--text-xs); color: var(--color-gray-400);">(45 Critical, 111 Severe)</span>
        </div>
        <div style="margin-bottom: 4px; font-size: var(--text-sm);">
          <span style="font-weight: var(--font-weight-semibold); color: var(--color-gray-300);">Impact:</span> <span style="color: var(--color-gray-100);">1404 Customers Affected</span>
        </div>
        <div style="margin-top: 8px; margin-bottom: 12px; font-size: var(--text-xs); color: var(--color-gray-400);">
          Detected: Aug 27, 2023, 10:00 AM
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
          <button 
            class="burst-popup-btn"
            style="padding: 6px 12px; font-size: var(--text-xs); font-weight: var(--font-weight-medium); background-color: var(--color-gray-700); color: var(--color-gray-200); border: 1px solid var(--color-gray-600); border-radius: var(--radius-md); cursor: pointer; display: flex; align-items: center; justify-center; gap: 4px; width: 100%; transition: all var(--default-transition-duration) var(--default-transition-timing-function);"
            onmouseover="this.style.backgroundColor='var(--color-gray-600)'; this.style.color='var(--color-gray-100)'"
            onmouseout="this.style.backgroundColor='var(--color-gray-700)'; this.style.color='var(--color-gray-200)'"
            onclick="console.log('Show Affected Pipes clicked')">
            <span>Show Affected Pipes</span>
          </button>
          <button 
            class="burst-popup-btn"
            style="padding: 6px 12px; font-size: var(--text-xs); font-weight: var(--font-weight-medium); background-color: var(--color-blue-900); color: var(--color-blue-300); border: 1px solid var(--color-blue-700); border-radius: var(--radius-md); cursor: pointer; display: flex; align-items: center; justify-center; gap: 4px; width: 100%; transition: all var(--default-transition-duration) var(--default-transition-timing-function);"
            onmouseover="this.style.backgroundColor='var(--color-blue-800)'; this.style.color='var(--color-blue-200)'"
            onmouseout="this.style.backgroundColor='var(--color-blue-900)'; this.style.color='var(--color-blue-300)'"
            onclick="window.dispatchEvent(new CustomEvent('addBurstContextToCopilot'))">
            <span>Add Context to WaterOS Copilot</span>
          </button>
        </div>
      </div>
    `
    
    // Function to calculate scale based on zoom level
    const calculateScale = (zoom) => {
      return Math.pow(2, zoom - REFERENCE_ZOOM)
    }
    
    // Function to update gradient scales (scale the gradient, keep center marker fixed)
    const updateMarkerScales = () => {
      const currentZoom = map.current.getZoom()
      const scale = calculateScale(currentZoom)
      
      burstMarkersRef.current.forEach(marker => {
        const element = marker.getElement()
        if (element && element.classList.contains('burst-event-gradient-wrapper')) {
          const gradient = element.querySelector('.burst-gradient-glow')
          if (gradient) {
            gradient.style.transform = `translate(-50%, -50%) scale(${scale})`
          }
        }
      })
    }
    
    const mergedBurstData = getMergedBurstData()
    
    mergedBurstData.features.forEach((feature) => {
      const coordinates = feature.geometry.coordinates.slice()
      
      // Create gradient marker (z-index 10, below sensors)
      const gradientElement = document.createElement('div')
      gradientElement.className = 'burst-event-gradient-wrapper'
      gradientElement.style.cssText = `position: relative; width: ${burstGradientParams.size}px; height: ${burstGradientParams.size}px; pointer-events: none;`
      gradientElement.dataset.burstId = feature.id
      
      const glow = document.createElement('div')
      glow.className = 'burst-gradient-glow'
      // Apply dynamic gradient parameters
      const halfSize = burstGradientParams.size / 2
      const opacityStart = burstGradientParams.opacity
      const opacityMid = opacityStart * 0.43  // ~15% of 35% = 0.15
      const opacityEnd = opacityStart * 0.14   // ~5% of 35% = 0.05
      const spreadMid = Math.round(burstGradientParams.spread * 0.58)  // 35% of 60% = 35%
      
      glow.style.cssText = `
        width: ${burstGradientParams.size}px;
        height: ${burstGradientParams.size}px;
        border-radius: 50%;
        background: radial-gradient(
          circle at center,
          rgba(220, 38, 38, ${opacityStart}) 0%,
          rgba(220, 38, 38, ${opacityMid}) ${spreadMid}%,
          rgba(220, 38, 38, ${opacityEnd}) ${burstGradientParams.spread}%,
          transparent 100%
        );
        pointer-events: none;
        position: absolute;
        top: 50%;
        left: 50%;
      `
      
      // Apply initial scale to gradient based on current zoom
      const initialScale = calculateScale(map.current.getZoom())
      glow.style.transform = `translate(-50%, -50%) scale(${initialScale})`
      
      gradientElement.appendChild(glow)
      
      const gradientMarker = new maplibregl.Marker({
        element: gradientElement,
        anchor: 'center',
        draggable: false
      })
        .setLngLat(coordinates)
        .addTo(map.current)
      
      // Set z-index on gradient marker (z-index 10, below sensors at 20)
      gradientMarker.getElement().style.zIndex = '10'
      
      // Create center marker (z-index 25, above sensors)
      const centerElement = document.createElement('div')
      centerElement.className = 'burst-marker-center-wrapper'
      centerElement.style.cssText = `pointer-events: auto; cursor: ${burstEditMode ? 'grab' : 'pointer'};`
      centerElement.dataset.burstId = feature.id
      
      const center = document.createElement('div')
      center.className = 'burst-marker-center'
      
      const inner = document.createElement('div')
      inner.className = 'burst-marker-inner'
      
      const icon = document.createElement('div')
      icon.className = 'burst-marker-icon'
      
      inner.appendChild(icon)
      center.appendChild(inner)
      // Animated hourglass badge when action approved (inside center to avoid map transform issues)
      if (burstImplementationComplete) {
        const hourglassBadge = document.createElement('div')
        hourglassBadge.className = 'burst-marker-hourglass-badge'
        hourglassBadge.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>`
        center.appendChild(hourglassBadge)
      }
      centerElement.appendChild(center)
      
      const centerMarker = new maplibregl.Marker({
        element: centerElement,
        anchor: 'center',
        draggable: burstEditMode
      })
        .setLngLat(coordinates)
        .addTo(map.current)
      
      // Set z-index on center marker (z-index 25, above sensors at 20)
      centerMarker.getElement().style.zIndex = '25'
      
      // Prevent clicks from reaching the pressure zone layer
      centerElement.addEventListener('click', (e) => {
        e.stopPropagation()
        markerClickedRef.current = true
        // Reset flag after a short delay to allow the pressure zone handler to check it
        setTimeout(() => {
          markerClickedRef.current = false
        }, 50)
      })
      
      if (burstEditMode) {
        // Edit mode: draggable center marker, gradient follows
        centerMarker.on('drag', () => {
          centerElement.style.cursor = 'grabbing'
          // Move gradient to match center marker position
          const lngLat = centerMarker.getLngLat()
          gradientMarker.setLngLat([lngLat.lng, lngLat.lat])
        })
        
        centerMarker.on('dragend', () => {
          centerElement.style.cursor = 'grab'
          const lngLat = centerMarker.getLngLat()
          saveBurstPosition(feature.id, [lngLat.lng, lngLat.lat])
        })
      } else {
        // Normal mode: hover center marker only to show popup
        let hideTimeout
        center.addEventListener('mouseenter', () => {
          map.current.getCanvas().style.cursor = 'pointer'
          if (hideTimeout) clearTimeout(hideTimeout)
          
          if (burstPopup.current) burstPopup.current.remove()
          burstPopup.current = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: false,
            maxWidth: '240px'
          })
            .setLngLat(centerMarker.getLngLat())
            .setHTML(popupContent)
            .addTo(map.current)
          
          const popupElement = burstPopup.current.getElement()
          popupElement.addEventListener('mouseenter', () => {
            map.current.getCanvas().style.cursor = 'auto'
          })
          popupElement.addEventListener('mouseleave', () => {
            if (burstPopup.current) {
              burstPopup.current.remove()
              burstPopup.current = null
            }
          })
        })
        
        center.addEventListener('mouseleave', () => {
          map.current.getCanvas().style.cursor = ''
          hideTimeout = setTimeout(() => {
            const popupEl = burstPopup.current?.getElement()
            if (popupEl && !popupEl.matches(':hover')) {
              if (burstPopup.current) {
                burstPopup.current.remove()
                burstPopup.current = null
              }
            }
          }, 100)
        })
      }
      
      // Store both markers (gradient and center)
      burstMarkersRef.current.push(gradientMarker, centerMarker)
    })
    
    // Add zoom event listener to update marker scales
    const handleZoom = () => {
      updateMarkerScales()
    }
    
    map.current.on('zoom', handleZoom)
    
    return () => {
      if (map.current) {
        map.current.off('zoom', handleZoom)
      }
      burstMarkersRef.current.forEach(marker => marker.remove())
      burstMarkersRef.current = []
    }
  }, [burstEventsVisible, burstEditMode, burstGradientParams, burstImplementationComplete, mapLoaded])

  // Listen for map zoom requests from panels
  useEffect(() => {
    if (!mapLoaded || !map.current || !mapZoomRequest) return
    
    const { bounds } = mapZoomRequest
    if (bounds && bounds.length === 4) {
      // bounds format: [west, south, east, north]
      const mapBounds = new maplibregl.LngLatBounds(
        [bounds[0], bounds[1]], // southwest
        [bounds[2], bounds[3]]  // northeast
      )
      
      console.log('🎯 Zooming to requested bounds from panel')
      map.current.fitBounds(mapBounds, { padding: 80, maxZoom: 14, duration: 1000 })
    }
  }, [mapZoomRequest, mapLoaded])

  // Manage network meter markers - always render as DOM markers (for proper z-index above burst gradients)
  useEffect(() => {
    if (!mapLoaded || !map.current) return
    
    // Clean up existing markers
    sensorMarkers.current.forEach(marker => marker.remove())
    sensorMarkers.current = []
    
    // Don't create markers if sensors are hidden and not in edit mode
    if (!pressureSensorsVisible && !sensorEditMode) return
    
    // Get network meter data with saved positions
    const mergedData = getMergedSensorData()
    
    mergedData.features.forEach((feature) => {
      const el = document.createElement('div')
      el.className = sensorEditMode ? 'sensor-marker-editable' : 'sensor-marker'
      el.style.backgroundColor = getStatusColor(feature.properties.status)
      el.dataset.sensorId = feature.id
      
      const marker = new maplibregl.Marker({
        element: el,
        draggable: sensorEditMode,
        anchor: 'center'
      })
        .setLngLat(feature.geometry.coordinates)
        .addTo(map.current)
      
      // Set z-index on marker element (sensors at z-index 20, above burst gradients at z-index 10)
      marker.getElement().style.zIndex = '20'
      
      // Prevent clicks from reaching the pressure zone layer
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        markerClickedRef.current = true
        // Reset flag after a short delay to allow the pressure zone handler to check it
        setTimeout(() => {
          markerClickedRef.current = false
        }, 50)
      })
      
      if (sensorEditMode) {
        // Edit mode: Handle drag events
        marker.on('dragstart', () => {
          el.style.cursor = 'grabbing'
          setIsDraggingSensor(true)
        })
        
        marker.on('dragend', () => {
          el.style.cursor = 'grab'
          setIsDraggingSensor(false)
          
          const lngLat = marker.getLngLat()
          handleSensorPositionUpdate(feature.id, [lngLat.lng, lngLat.lat])
        })
      } else {
        // Normal mode: Handle click to open meter panel
        el.style.cursor = 'pointer'
        el.addEventListener('click', () => {
          setSelectedSensor({
            sensorId: feature.properties.sensorId,
            name: feature.properties.name,
            status: feature.properties.status,
            pressure: feature.properties.pressure,
            lastReading: feature.properties.lastReading,
            location: feature.properties.location
          })
          console.log('✅ Meter panel opened for:', feature.properties.sensorId)
        })
      }
      
      sensorMarkers.current.push(marker)
    })
    
    // Always hide the circle layer since we're using DOM markers
    if (map.current.getLayer('pressure-sensors-circles')) {
      map.current.setLayoutProperty('pressure-sensors-circles', 'visibility', 'none')
    }
    
    // Update source data with saved positions
    if (map.current.getSource('pressure-sensors')) {
      map.current.getSource('pressure-sensors').setData(mergedData)
    }
    
    console.log(`✅ Created ${sensorMarkers.current.length} network meter DOM markers`)
    
    return () => {
      sensorMarkers.current.forEach(marker => marker.remove())
      sensorMarkers.current = []
    }
  }, [sensorEditMode, mapLoaded, pressureSensorsVisible])

  // Manage pressure sensor (gauge-style) markers
  useEffect(() => {
    if (!mapLoaded || !map.current) return

    pressureSensorMarkersRef.current.forEach((m) => m.remove())
    pressureSensorMarkersRef.current = []

    if (!pressureSensorsMapVisible && !pressureSensorEditMode) return

    const visibleStatuses = Object.entries(activePressureSensorStatuses)
      .filter(([_, active]) => active)
      .map(([status]) => status)

    const mergedData = getMergedPressureSensorMapData()

    mergedData.features.forEach((feature) => {
      const status = feature.properties?.status || 'normal'
      if (!visibleStatuses.includes(status)) return

      const coords = feature.geometry.coordinates.slice()
      const bgColor = getPressureSensorBgColor(status)
      const pressure = feature.properties?.pressure ?? 50
      const pct = Math.min(100, Math.max(0, (pressure / 100) * 100))
      const needleAngle = -90 + (pct / 100) * 180

      const el = document.createElement('div')
      el.className = pressureSensorEditMode ? 'pressure-sensor-marker pressure-sensor-marker-editable' : 'pressure-sensor-marker'
      el.dataset.sensorId = feature.id
      el.style.setProperty('--pressure-sensor-bg', bgColor)
      el.innerHTML = `
        <div class="pressure-sensor-gauge">
          <svg viewBox="0 0 32 32" width="26" height="26">
            <path class="gauge-arc" d="M6 20 A10 10 0 0 1 26 20" fill="none" stroke="#000" stroke-width="1.2" stroke-linecap="round"/>
            <line class="gauge-tick" x1="8" y1="18.5" x2="8" y2="20" stroke="#000" stroke-width="1"/>
            <line class="gauge-tick" x1="16" y1="14" x2="16" y2="16" stroke="#000" stroke-width="1"/>
            <line class="gauge-tick" x1="24" y1="18.5" x2="24" y2="20" stroke="#000" stroke-width="1"/>
            <circle class="gauge-pivot" cx="16" cy="20" r="1.5" fill="#000"/>
            <line class="gauge-needle" x1="16" y1="20" x2="16" y2="12" stroke="#000" stroke-width="1" stroke-linecap="round" transform="rotate(${needleAngle} 16 20)"/>
            <path class="gauge-housing" d="M10 20 Q16 26 22 20" fill="none" stroke="#000" stroke-width="1.2"/>
          </svg>
        </div>
      `

      const marker = new maplibregl.Marker({
        element: el,
        draggable: pressureSensorEditMode,
        anchor: 'center',
      })
        .setLngLat(coords)
        .addTo(map.current)

      marker.getElement().style.zIndex = '20'

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        markerClickedRef.current = true
        setTimeout(() => { markerClickedRef.current = false }, 50)
      })

      if (pressureSensorEditMode) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat()
          handlePressureSensorPositionUpdate(feature.id, [lngLat.lng, lngLat.lat])
        })
      } else {
        el.style.cursor = 'pointer'
        el.addEventListener('click', () => {
          setSelectedSensor({
            sensorId: feature.properties.sensorId,
            name: feature.properties.name,
            status: feature.properties.status,
            pressure: feature.properties.pressure,
            lastReading: feature.properties.lastReading,
            location: feature.properties.location,
          })
        })

        // Hover tooltip (React component based - Figma design)
        el.addEventListener('mouseenter', (e) => {
          const rect = el.getBoundingClientRect()
          setHoveredPressureSensor(feature)
          setPressureSensorTooltipPos({
            x: rect.right + 12,
            y: rect.top
          })
        })
        el.addEventListener('mouseleave', () => {
          // Don't immediately hide - let tooltip component handle this
          setTimeout(() => {
            if (!document.querySelector('.pressure-sensor-tooltip-container:hover')) {
              setHoveredPressureSensor(null)
              setPressureSensorTooltipPos(null)
            }
          }, 150)
        })
      }

      pressureSensorMarkersRef.current.push(marker)
    })

    return () => {
      pressureSensorMarkersRef.current.forEach((m) => m.remove())
      pressureSensorMarkersRef.current = []
      setHoveredPressureSensor(null)
      setPressureSensorTooltipPos(null)
    }
  }, [pressureSensorsMapVisible, pressureSensorEditMode, activePressureSensorStatuses, mapLoaded])

  // Manage customer complaint markers
  useEffect(() => {
    if (!mapLoaded || !map.current) return

    // Clean up existing markers
    complaintMarkersRef.current.forEach(m => m.remove())
    complaintMarkersRef.current = []

    // Show complaints if either customerComplaintsVisible OR showFilteredComplaintsOnly is true
    const shouldShowComplaints =
      customerComplaintsVisible || showFilteredComplaintsOnly || mapComplaintsPriorityFilter
    if (!shouldShowComplaints) return

    // Get visible themes (only apply theme filter when showing all complaints)
    const visibleThemes = Object.entries(activeComplaintThemes)
      .filter(([_, active]) => active)
      .map(([theme]) => theme)

    // Get filtered complaint IDs if in filtered-only mode
    let allowedComplaintIds = null
    if (showFilteredComplaintsOnly && filteredLeakageEventId) {
      const leakageEvent = leakageEvents.find(e => e.id === filteredLeakageEventId)
      if (leakageEvent) {
        allowedComplaintIds = new Set(leakageEvent.complaintIds)
        console.log(`🔍 Showing ONLY complaints for leakage event: ${leakageEvent.name}`)
        console.log(`📋 Filtered complaint IDs:`, leakageEvent.complaintIds)
      }
    }

    CUSTOMER_COMPLAINTS.features.forEach((complaint) => {
      if (mapComplaintsPriorityFilter === 'High') {
        if (complaint.properties?.priority !== 'High') return
      } else if (showFilteredComplaintsOnly) {
        if (!allowedComplaintIds || !allowedComplaintIds.has(complaint.id)) {
          return
        }
      } else {
        const theme = complaint.properties?.theme
        if (!visibleThemes.includes(theme)) return
      }

      const coords = complaint.geometry.coordinates.slice()
      const theme = complaint.properties?.theme
      const themeColor = getComplaintThemeColor(theme)

      // Create marker element with warning triangle icon
      const el = document.createElement('div')
      el.className = 'customer-complaint-marker'
      el.dataset.complaintId = complaint.id
      el.style.cssText = `
        width: 28px;
        height: 28px;
        background-color: ${themeColor};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      `
      
      // Add warning triangle icon (SVG)
      el.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      `

      const marker = new maplibregl.Marker({
        element: el,
        draggable: false,
        anchor: 'center',
      })
        .setLngLat(coords)
        .addTo(map.current)

      // Set z-index (above water mains at 15, below sensors at 20)
      marker.getElement().style.zIndex = '18'

      // Prevent clicks from reaching the pressure zone layer
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        console.log('🔔 Complaint marker clicked:', complaint.properties?.complaintId)
        console.log('📍 Current persona:', selectedPersona)
        console.log('🎨 Current characteristic:', selectedCharacteristic)
        
        markerClickedRef.current = true
        setTimeout(() => { markerClickedRef.current = false }, 50)
        
        // Only open detail panel for Leakage Manager + Dark
        if (selectedPersona === 'Leakage Manager' && selectedCharacteristic === 'Dark') {
          console.log('✅ Opening complaint detail panel')
          setSelectedComplaint(complaint)
        } else {
          console.log('⚠️ Not in Leakage Manager + Dark mode, panel will not open')
        }
      })

      // Hover to show tooltip
      el.addEventListener('mouseenter', (e) => {
        const rect = el.getBoundingClientRect()
        setHoveredComplaint(complaint)
        setComplaintTooltipPos({
          x: rect.right + 12,
          y: rect.top
        })
        // Enhance shadow on hover instead of scaling
        el.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)'
      })
      
      el.addEventListener('mouseleave', () => {
        // Delay hiding to allow moving to tooltip
        setTimeout(() => {
          if (!document.querySelector('.customer-complaint-tooltip-container:hover')) {
            setHoveredComplaint(null)
            setComplaintTooltipPos(null)
          }
        }, 150)
        el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)'
      })

      complaintMarkersRef.current.push(marker)
    })

    console.log(`✅ Created ${complaintMarkersRef.current.length} customer complaint markers`)

    return () => {
      complaintMarkersRef.current.forEach(m => m.remove())
      complaintMarkersRef.current = []
      setHoveredComplaint(null)
      setComplaintTooltipPos(null)
    }
  }, [customerComplaintsVisible, showFilteredComplaintsOnly, mapComplaintsPriorityFilter, activeComplaintThemes, filteredLeakageEventId, leakageEvents, mapLoaded, selectedPersona, selectedCharacteristic, setSelectedComplaint])

  // Complaint Heatmap Layer - visualize complaint density weighted by priority
  useEffect(() => {
    // Ensure map and style are fully loaded before adding sources/layers
    if (!mapLoaded || !map.current || !map.current.loaded()) return

    const sourceId = 'complaint-heatmap'
    const layerId = 'complaint-heatmap-layer'

    // Get filtered complaint data if in priority-only or leakage-event mode
    let heatmapData = CUSTOMER_COMPLAINTS
    if (mapComplaintsPriorityFilter === 'High') {
      heatmapData = {
        ...CUSTOMER_COMPLAINTS,
        features: CUSTOMER_COMPLAINTS.features.filter(
          (c) => c.properties?.priority === 'High'
        ),
      }
    } else if (showFilteredComplaintsOnly && filteredLeakageEventId) {
      const leakageEvent = leakageEvents.find(e => e.id === filteredLeakageEventId)
      if (leakageEvent) {
        const allowedComplaintIds = new Set(leakageEvent.complaintIds)
        heatmapData = {
          ...CUSTOMER_COMPLAINTS,
          features: CUSTOMER_COMPLAINTS.features.filter(complaint => 
            allowedComplaintIds.has(complaint.id)
          )
        }
        console.log(`🔥 Filtering heatmap for ${heatmapData.features.length} complaints from leakage event`)
      }
    }

    // Check if source already exists
    if (!map.current.getSource(sourceId)) {
      // Add source for heatmap
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: heatmapData
      })

      console.log('✅ Added complaint heatmap source')
    } else {
      // Update existing source with filtered data
      map.current.getSource(sourceId).setData(heatmapData)
    }

    // Check if layer already exists
    if (!map.current.getLayer(layerId)) {
      // Add heatmap layer with dynamic parameters
      map.current.addLayer({
        id: layerId,
        type: 'heatmap',
        source: sourceId,
        paint: {
          // Weight based on priority with more dramatic differences: High=5, Medium=2.5, Low=1
          'heatmap-weight': [
            'match',
            ['get', 'priority'],
            'High', 5,      // High priority complaints have 5x weight
            'Medium', 2.5,  // Medium priority complaints have 2.5x weight
            'Low', 1,       // Low priority baseline weight
            2               // default (slightly higher than low)
          ],
          // Increase intensity as zoom level increases, multiplied by user parameter
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.5 * complaintHeatmapParams.intensity,    // Low intensity at far zoom
            15, 1.5 * complaintHeatmapParams.intensity    // Higher intensity when zoomed in
          ],
          // Radius in meters - stays geographically consistent across zoom levels
          'heatmap-radius': {
            'stops': [
              [0, complaintHeatmapParams.radius * 0.5],    // Meters at zoom 0
              [22, complaintHeatmapParams.radius * 50]     // Meters at zoom 22
            ],
            'type': 'exponential',
            'base': 2
          },
          // Enhanced color gradient: emphasis on high-severity areas (red/orange for high priority)
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',       // Transparent at 0 density
            0.1, 'rgba(103,169,207,0.3)',  // Very light blue (low priority areas)
            0.25, 'rgb(178,223,138)',      // Light green-blue
            0.4, 'rgb(251,200,99)',        // Yellow-orange transition
            0.55, 'rgb(253,141,60)',       // Orange (medium-high priority)
            0.7, 'rgb(252,78,42)',         // Red-orange (high priority)
            0.85, 'rgb(227,26,28)',        // Bright red (very high priority)
            1, 'rgb(177,0,38)'             // Deep red (critical/highest density)
          ],
          // Overall opacity controlled by user
          'heatmap-opacity': complaintHeatmapParams.opacity
        },
        layout: {
          // Show heatmap if either complaintHeatmapVisible OR showFilteredComplaintsOnly is true
          'visibility': (complaintHeatmapVisible || showFilteredComplaintsOnly) ? 'visible' : 'none'
        }
      }) // Heatmap layer added without beforeId - DOM markers will render on top due to z-index

      console.log('✅ Added complaint heatmap layer with priority-based severity')
    }

    return () => {
      // Cleanup handled by map unmount
    }
  }, [mapLoaded, complaintHeatmapVisible, showFilteredComplaintsOnly, mapComplaintsPriorityFilter, complaintHeatmapParams, filteredLeakageEventId, leakageEvents])

  // Update heatmap layer paint properties when parameters change
  useEffect(() => {
    if (!mapLoaded || !map.current) return
    
    const layerId = 'complaint-heatmap-layer'
    if (!map.current.getLayer(layerId)) return

    try {
      // Update intensity
      map.current.setPaintProperty(layerId, 'heatmap-intensity', [
        'interpolate',
        ['linear'],
        ['zoom'],
        0, 0.5 * complaintHeatmapParams.intensity,
        15, 1.5 * complaintHeatmapParams.intensity
      ])

      // Update radius - geographically consistent across zoom levels
      map.current.setPaintProperty(layerId, 'heatmap-radius', {
        'stops': [
          [0, complaintHeatmapParams.radius * 0.5],
          [22, complaintHeatmapParams.radius * 50]
        ],
        'type': 'exponential',
        'base': 2
      })

      // Update opacity
      map.current.setPaintProperty(layerId, 'heatmap-opacity', complaintHeatmapParams.opacity)

      console.log('✅ Updated heatmap parameters:', complaintHeatmapParams)
    } catch (error) {
      console.error('❌ Error updating heatmap parameters:', error)
    }
  }, [complaintHeatmapParams, mapLoaded])


  // Filter network meters by active statuses (now working with DOM markers)
  useEffect(() => {
    if (!mapLoaded || !map.current) return
    
    const visibleStatuses = Object.entries(activeSensorStatuses)
      .filter(([_, active]) => active)
      .map(([status]) => status)
    
    console.log('🔵 Visible meter statuses:', visibleStatuses)
    
    // Show/hide meter markers based on their status
    sensorMarkers.current.forEach(marker => {
      const el = marker.getElement()
      if (!el) return
      
      const sensorId = el.dataset.sensorId
      const mergedData = getMergedSensorData()
      const sensorFeature = mergedData.features.find(f => f.id === sensorId)
      
      if (sensorFeature) {
        const sensorStatus = sensorFeature.properties.status
        const shouldShow = visibleStatuses.includes(sensorStatus)
        el.style.display = shouldShow ? 'block' : 'none'
      }
    })
    
    console.log(`✅ Filtered sensors by status`)
  }, [activeSensorStatuses, mapLoaded, sensorEditMode, pressureSensorsVisible])

  // Handle network meter position updates
  const handleSensorPositionUpdate = (sensorId, newCoordinates) => {
    console.log(`📍 Updating meter ${sensorId} to:`, newCoordinates)
    
    try {
      // Get existing saved positions from localStorage
      const savedPositions = JSON.parse(localStorage.getItem('sensorPositions') || '{}')
      
      // Update the position
      savedPositions[sensorId] = {
        coordinates: newCoordinates,
        timestamp: new Date().toISOString()
      }
      
      // Save to localStorage
      localStorage.setItem('sensorPositions', JSON.stringify(savedPositions))
      
      console.log('✅ Meter position saved to localStorage')
      console.log('💾 To export all positions, run: exportSensorPositions()')
      
      // Make export function available globally for easy access
      window.exportSensorPositions = () => {
        const positions = JSON.parse(localStorage.getItem('sensorPositions') || '{}')
        const updatedSensors = { ...PRESSURE_SENSORS }
        
        // Update coordinates in the feature collection
        updatedSensors.features = updatedSensors.features.map(feature => {
          if (positions[feature.id]) {
            return {
              ...feature,
              geometry: {
                ...feature.geometry,
                coordinates: positions[feature.id].coordinates
              }
            }
          }
          return feature
        })
        
        // Generate exportable JavaScript code
        const exportCode = `        // Updated network meter positions - ${new Date().toISOString()}
export const PRESSURE_SENSORS = ${JSON.stringify(updatedSensors, null, 2)}`
        
        console.log('\n📤 COPY THE CODE BELOW AND PASTE INTO src/data/pressureSensors.js (Network Meters):\n')
        console.log(exportCode)
        console.log('\n📋 Code also copied to clipboard!')
        
        // Try to copy to clipboard
        navigator.clipboard.writeText(exportCode).then(() => {
          console.log('✅ Copied to clipboard!')
        }).catch(err => {
          console.log('⚠️ Could not copy to clipboard, please copy from console')
        })
      }
      
    } catch (error) {
      console.error('❌ Error saving meter position:', error)
    }
  }

  const handlePressureSensorPositionUpdate = (sensorId, newCoordinates) => {
    try {
      const savedPositions = JSON.parse(localStorage.getItem('pressureSensorPositions') || '{}')
      savedPositions[sensorId] = {
        coordinates: newCoordinates,
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem('pressureSensorPositions', JSON.stringify(savedPositions))
    } catch (error) {
      console.error('Error saving pressure sensor position:', error)
    }
  }

  return (
    <>
      <div
        ref={mapContainer}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10
        }}
      />
      {hoveredPressureSensor && pressureSensorTooltipPos && (
        <PressureSensorTooltip
          feature={hoveredPressureSensor}
          position={pressureSensorTooltipPos}
          onClose={() => {
            setHoveredPressureSensor(null)
            setPressureSensorTooltipPos(null)
          }}
        />
      )}
      {hoveredComplaint && complaintTooltipPos && (
        <CustomerComplaintTooltip
          complaint={hoveredComplaint}
          position={complaintTooltipPos}
          onClose={() => {
            setHoveredComplaint(null)
            setComplaintTooltipPos(null)
          }}
        />
      )}
      {selectedComplaint && selectedPersona === 'Leakage Manager' && selectedCharacteristic === 'Dark' && (
        <ComplaintDetailPanel
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      )}
      {leakageEventDashboardVisible && selectedLeakageEvent && selectedPersona === 'Leakage Manager' && selectedCharacteristic === 'Dark' && (
        <LeakageEventDashboardPanel
          eventId={selectedLeakageEvent}
          onClose={closeLeakageEventDashboard}
        />
      )}
    </>
  )
}
