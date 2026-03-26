import { createContext, useContext, useState } from 'react'
import { sendChatMessage } from '../services/openai-chat'
import { LEAKAGE_EVENTS } from '../data/leakageEvents'

const PanelContext = createContext()

export const usePanelContext = () => {
  const context = useContext(PanelContext)
  if (!context) {
    throw new Error('usePanelContext must be used within PanelProvider')
  }
  return context
}

export const PanelProvider = ({ children }) => {
  // Persona and characteristic selection
  const [selectedPersona, setSelectedPersona] = useState('Leakage Manager')
  const [selectedCharacteristic, setSelectedCharacteristic] = useState('Dark')
  
  const [copilotVisible, setCopilotVisible] = useState(false)
  const [eventAreaVisible, setEventAreaVisible] = useState(false)
  const [layersVisible, setLayersVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [chatMessages, setChatMessages] = useState([])
  const [eventContext, setEventContext] = useState(null)
  
  // AI Chat state
  const [isAiResponding, setIsAiResponding] = useState(false)
  const [aiError, setAiError] = useState(null)
  
  // Event counts for notification badges
  const [eventAreaCount, setEventAreaCount] = useState(6) // 6 events in Event Area (including leakage demo)
  const [pressureCount, setPressureCount] = useState(0) // No pressure events yet
  
  // Intelligence tab items and notifications
  const [intelligenceItems, setIntelligenceItems] = useState([])
  const [hasUnreadIntelligence, setHasUnreadIntelligence] = useState(false)
  
  // Success notifications system
  const [successNotifications, setSuccessNotifications] = useState([])
  
  const addSuccessNotification = (message) => {
    const notification = {
      id: Date.now(),
      message,
      timestamp: new Date(),
    }
    setSuccessNotifications(prev => [...prev, notification])
  }
  
  const removeSuccessNotification = (id) => {
    setSuccessNotifications(prev => prev.filter(n => n.id !== id))
  }
  
  // Approval Queue - for field team complaint resolution approvals
  const [approvalQueueVisible, setApprovalQueueVisible] = useState(false)
  const [approvalQueue, setApprovalQueue] = useState([
    {
      id: 'approval-001',
      title: 'Valve Operation',
      tags: ['restricted', 'pending'],
      aiReasoning: 'Field team has reported that valve V-4521 at Oak Street intersection requires emergency closure due to pressure anomaly. This valve controls flow to 150+ residential customers.',
      actionDetails: {
        'Event Type': 'Valve Closure',
        'Valve ID': 'V-4521',
        'Location': 'Oak Street & 5th Ave',
        'Affected Customers': '150+',
        'Priority': 'High'
      },
      references: ['V-4521', 'Oak Street'],
      timestamp: '03/02/2026, 14:30:22'
    },
    {
      id: 'approval-002',
      title: 'Work Order Escalation',
      tags: ['supervised', 'pending'],
      aiReasoning: 'Work order WO-20578 (Main Break) at 260 Demo Street should be escalated to emergency priority. Nearby SCADA site "Oak Street Tank" shows this area is operationally sensitive.',
      actionDetails: {
        'Event Type': 'Main Break',
        'Work Order Id': 'WO-20578',
        'Current Priority': 'normal',
        'Recommended Priority': 'emergency'
      },
      references: ['WO-20578', 'Oak Street Tank'],
      timestamp: '01/03/2026, 20:55:18'
    }
  ])
  
  const toggleApprovalQueue = () => {
    setApprovalQueueVisible(prev => !prev)
  }
  
  // Complaints List - view all complaints with event area linkages
  const [complaintsListVisible, setComplaintsListVisible] = useState(false)
  const [complaintsListFilteredEventId, setComplaintsListFilteredEventId] = useState(null)
  const [complaintsListExpandedComplaintId, setComplaintsListExpandedComplaintId] = useState(null)
  
  const toggleComplaintsList = () => {
    setComplaintsListVisible(prev => !prev)
  }
  
  const openComplaintsListFiltered = (eventId) => {
    setComplaintsListFilteredEventId(eventId)
    setComplaintsListVisible(true)
  }
  
  const openComplaintsListWithExpanded = (complaintId) => {
    setComplaintsListExpandedComplaintId(complaintId)
    setComplaintsListFilteredEventId(null) // Clear any event filter
    setComplaintsListVisible(true)
  }
  
  // Work Orders - for managing field work
  const [workOrders, setWorkOrders] = useState([])
  const [workOrdersVisible, setWorkOrdersVisible] = useState(false)
  
  const toggleWorkOrders = () => {
    setWorkOrdersVisible(prev => !prev)
  }
  
  const createWorkOrder = (workOrderData) => {
    const newWorkOrder = {
      id: `WO-${Date.now()}`,
      ...workOrderData,
      status: 'New',
      createdAt: new Date().toISOString(),
      timeline: [
        {
          event: 'Work Order Created',
          timestamp: new Date().toISOString(),
          description: 'Work order generated from customer complaint'
        }
      ]
    }
    setWorkOrders(prev => [...prev, newWorkOrder])
    addSuccessNotification(`Work order ${newWorkOrder.id} created successfully`)
    return newWorkOrder
  }
  
  // Map layer states - contextual: only Burst Events visible on first open
  
  // Pressure sensors layer state
  const [pressureSensorsVisible, setPressureSensorsVisible] = useState(false)
  const [activeSensorStatuses, setActiveSensorStatuses] = useState({
    normal: true,
    warning: true,
    critical: true
  })
  
  // Burst events layer state
  const [burstEventsVisible, setBurstEventsVisible] = useState(true)
  
  // Burst implementation complete - when true, burst marker shows animated hourglass
  const [burstImplementationComplete, setBurstImplementationComplete] = useState(false)
  
  // Customer complaints layer state
  const [customerComplaintsVisible, setCustomerComplaintsVisible] = useState(false)
  const [activeComplaintThemes, setActiveComplaintThemes] = useState({
    water_coming_up: true,
    no_water: true,
    pressure_problem: true,
    missing_loose_cover: true,
    water_in_building: true,
    other: true,
    unknown: true
  })
  const [complaintInteractionMode, setComplaintInteractionMode] = useState('hover')
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [complaintHeatmapVisible, setComplaintHeatmapVisible] = useState(false)
  const [filteredLeakageEventId, setFilteredLeakageEventId] = useState(null) // Filter complaints by leakage event
  const [showFilteredComplaintsOnly, setShowFilteredComplaintsOnly] = useState(false) // When true, only show filtered complaints
  /** When set (e.g. 'High'), map shows only that priority; null = use theme / leakage filters */
  const [mapComplaintsPriorityFilter, setMapComplaintsPriorityFilter] = useState(null)
  
  // Leakage events state - for grouping complaints into potential leak events
  const [leakageEvents, setLeakageEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('leakageEventsData')
      return saved ? JSON.parse(saved) : LEAKAGE_EVENTS
    } catch {
      return LEAKAGE_EVENTS
    }
  })
  const [selectedLeakageEvent, setSelectedLeakageEvent] = useState(null)
  const [leakageEventDashboardVisible, setLeakageEventDashboardVisible] = useState(false)
  
  // Save leakage events to localStorage whenever they change
  const saveLeakageEvents = (events) => {
    setLeakageEvents(events)
    try {
      localStorage.setItem('leakageEventsData', JSON.stringify(events))
    } catch (error) {
      console.error('Failed to save leakage events to localStorage:', error)
    }
  }
  
  // Add a complaint to a leakage event
  const addComplaintToEvent = (complaintId, eventId) => {
    const updatedEvents = leakageEvents.map(event => {
      if (event.id === eventId) {
        // Check if complaint is already in this event
        if (event.complaintIds.includes(complaintId)) {
          return event
        }
        // Add complaint to event
        return {
          ...event,
          complaintIds: [...event.complaintIds, complaintId]
        }
      }
      // Remove complaint from other events (prevent duplicate linking)
      return {
        ...event,
        complaintIds: event.complaintIds.filter(id => id !== complaintId)
      }
    })
    saveLeakageEvents(updatedEvents)
  }
  
  // Remove a complaint from a leakage event
  const removeComplaintFromEvent = (complaintId, eventId) => {
    const updatedEvents = leakageEvents.map(event => {
      if (event.id === eventId) {
        return {
          ...event,
          complaintIds: event.complaintIds.filter(id => id !== complaintId)
        }
      }
      return event
    })
    saveLeakageEvents(updatedEvents)
  }
  
  // Create a new leakage event
  const createLeakageEvent = (name, complaintIds = []) => {
    const newEvent = {
      id: `leakage-event-${Date.now()}`,
      name,
      dateCreated: new Date().toISOString(),
      status: 'investigating',
      complaintIds,
      centroid: [0, 0], // Will be calculated based on complaints
      affectedArea: { radius: 50, unit: 'meters' },
      priority: 'Medium',
      estimatedCustomersAffected: 0,
      notes: ''
    }
    saveLeakageEvents([...leakageEvents, newEvent])
    return newEvent
  }
  
  // Open leakage event dashboard
  const openLeakageEventDashboard = (eventId) => {
    setSelectedLeakageEvent(eventId)
    setLeakageEventDashboardVisible(true)
  }
  
  // Close leakage event dashboard
  const closeLeakageEventDashboard = () => {
    setLeakageEventDashboardVisible(false)
    setSelectedLeakageEvent(null)
  }
  
  // Sensor editing mode (for network meters)
  const [sensorEditMode, setSensorEditMode] = useState(false)
  
  // Pressure sensors (gauge-style) layer state
  const [pressureSensorsMapVisible, setPressureSensorsMapVisible] = useState(false)
  const [activePressureSensorStatuses, setActivePressureSensorStatuses] = useState({
    normal: true,
    warning: true,
    critical: true
  })
  const [pressureSensorEditMode, setPressureSensorEditMode] = useState(false)
  
  // Burst editing mode
  const [burstEditMode, setBurstEditMode] = useState(false)
  
  // Burst gradient parameters
  const [burstGradientParams, setBurstGradientParams] = useState(() => {
    try {
      const saved = localStorage.getItem('burstGradientParams')
      return saved ? JSON.parse(saved) : {
        size: 280,
        opacity: 0.35,
        spread: 60
      }
    } catch {
      return {
        size: 280,
        opacity: 0.35,
        spread: 60
      }
    }
  })
  
  const updateBurstGradientParams = (params) => {
    setBurstGradientParams(params)
    localStorage.setItem('burstGradientParams', JSON.stringify(params))
  }

  // Complaint heatmap parameters
  const [complaintHeatmapParams, setComplaintHeatmapParams] = useState(() => {
    try {
      const saved = localStorage.getItem('complaintHeatmapParams')
      return saved ? JSON.parse(saved) : {
        radius: 40,      // Radius of influence (15-60)
        intensity: 1,    // Intensity multiplier (0.5-2)
        opacity: 0.8     // Overall opacity (0.3-1)
      }
    } catch {
      return {
        radius: 40,
        intensity: 1,
        opacity: 0.8
      }
    }
  })
  
  const updateComplaintHeatmapParams = (params) => {
    setComplaintHeatmapParams(params)
    localStorage.setItem('complaintHeatmapParams', JSON.stringify(params))
  }
  
  // Selected sensor for detail panel
  const [selectedSensor, setSelectedSensor] = useState(null)
  
  // Map zoom request - for triggering zoom from panels
  const [mapZoomRequest, setMapZoomRequest] = useState(null)
  
  const requestMapZoom = (bounds) => {
    setMapZoomRequest({ bounds, timestamp: Date.now() })
  }

  /** Incremented so WaterOSCopilotPanel can run the same "critical complaints" chat + map flow as Briefing */
  const [criticalComplaintsCopilotTrigger, setCriticalComplaintsCopilotTrigger] = useState(0)

  const requestCriticalComplaintsCopilotFlow = () => {
    setCopilotVisible(true)
    setActiveTab('chat')
    setCriticalComplaintsCopilotTrigger((n) => n + 1)
  }
  
  const sendEventToCopilot = (context) => {
    // Set the event context
    setEventContext(context)
    
    // Ensure Copilot is visible and on Chat tab
    setCopilotVisible(true)
    setActiveTab('chat')
    
    // Add the event context as a message
    const contextMessage = {
      id: Date.now(),
      type: 'event-context',
      timestamp: new Date(),
      context: context,
    }
    
    setChatMessages((prev) => [...prev, contextMessage])
  }

  const clearChat = () => {
    setChatMessages([])
    setEventContext(null)
  }

  const deleteMessage = (messageId) => {
    setChatMessages((prev) => prev.filter((msg) => msg.id !== messageId))
  }
  
  const sendUserMessage = async (messageText) => {
    if (!messageText.trim()) return
    
    // Clear any previous error
    setAiError(null)
    
    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      type: 'user-message',
      message: messageText.trim(),
      timestamp: new Date()
    }
    setChatMessages((prev) => [...prev, userMessage])
    
    // Set AI responding state
    setIsAiResponding(true)
    
    try {
      // Build context from current chat messages
      const eventContexts = chatMessages
        .filter(m => m.type === 'event-context')
        .map(m => m.context)
      
      const impactAnalyses = chatMessages
        .filter(m => m.type === 'impact-analysis')
      
      const contextData = {
        eventContexts,
        meterContexts: [], // Can be populated if needed
        impactAnalyses
      }
      
      // Call OpenAI service (pass all messages including the one we just added)
      const allMessages = [...chatMessages, userMessage]
      const aiResponse = await sendChatMessage(allMessages, contextData)
      
      // Add AI response to chat
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai-message',
        message: aiResponse,
        timestamp: new Date()
      }
      setChatMessages((prev) => [...prev, aiMessage])
      
    } catch (error) {
      console.error('AI Chat Error:', error)
      setAiError(error.message || 'Failed to get AI response. Please try again.')
    } finally {
      setIsAiResponding(false)
    }
  }
  
  const addIntelligenceItem = (item) => {
    setIntelligenceItems((prev) => [...prev, { ...item, id: Date.now(), timestamp: new Date() }])
    setHasUnreadIntelligence(true)
  }
  
  const clearIntelligenceNotification = () => {
    setHasUnreadIntelligence(false)
  }

  const toggleCopilot = () => {
    setCopilotVisible((prev) => !prev)
  }

  const toggleEventArea = () => {
    setEventAreaVisible((prev) => !prev)
  }

  const toggleLayers = () => {
    setLayersVisible((prev) => !prev)
  }

  const value = {
    selectedPersona,
    setSelectedPersona,
    selectedCharacteristic,
    setSelectedCharacteristic,
    copilotVisible,
    setCopilotVisible,
    toggleCopilot,
    eventAreaVisible,
    setEventAreaVisible,
    toggleEventArea,
    layersVisible,
    setLayersVisible,
    toggleLayers,
    activeTab,
    setActiveTab,
    chatMessages,
    setChatMessages,
    eventContext,
    sendEventToCopilot,
    clearChat,
    deleteMessage,
    sendUserMessage,
    isAiResponding,
    setIsAiResponding,
    aiError,
    setAiError,
    customerComplaintsVisible,
    setCustomerComplaintsVisible,
    activeComplaintThemes,
    setActiveComplaintThemes,
    complaintInteractionMode,
    setComplaintInteractionMode,
    selectedComplaint,
    setSelectedComplaint,
    complaintHeatmapVisible,
    setComplaintHeatmapVisible,
    filteredLeakageEventId,
    setFilteredLeakageEventId,
    showFilteredComplaintsOnly,
    setShowFilteredComplaintsOnly,
    mapComplaintsPriorityFilter,
    setMapComplaintsPriorityFilter,
    leakageEvents,
    setLeakageEvents,
    saveLeakageEvents,
    selectedLeakageEvent,
    setSelectedLeakageEvent,
    leakageEventDashboardVisible,
    setLeakageEventDashboardVisible,
    addComplaintToEvent,
    removeComplaintFromEvent,
    createLeakageEvent,
    openLeakageEventDashboard,
    closeLeakageEventDashboard,
    eventAreaCount,
    setEventAreaCount,
    pressureCount,
    setPressureCount,
    intelligenceItems,
    addIntelligenceItem,
    hasUnreadIntelligence,
    clearIntelligenceNotification,
    successNotifications,
    addSuccessNotification,
    removeSuccessNotification,
    approvalQueueVisible,
    setApprovalQueueVisible,
    toggleApprovalQueue,
    approvalQueue,
    setApprovalQueue,
    complaintsListVisible,
    setComplaintsListVisible,
    toggleComplaintsList,
    complaintsListFilteredEventId,
    setComplaintsListFilteredEventId,
    openComplaintsListFiltered,
    complaintsListExpandedComplaintId,
    setComplaintsListExpandedComplaintId,
    openComplaintsListWithExpanded,
    workOrders,
    setWorkOrders,
    createWorkOrder,
    workOrdersVisible,
    setWorkOrdersVisible,
    toggleWorkOrders,
    pressureSensorsVisible,
    setPressureSensorsVisible,
    activeSensorStatuses,
    setActiveSensorStatuses,
    pressureSensorsMapVisible,
    setPressureSensorsMapVisible,
    activePressureSensorStatuses,
    setActivePressureSensorStatuses,
    pressureSensorEditMode,
    setPressureSensorEditMode,
    burstEventsVisible,
    setBurstEventsVisible,
    burstImplementationComplete,
    setBurstImplementationComplete,
    sensorEditMode,
    setSensorEditMode,
    burstEditMode,
    setBurstEditMode,
    burstGradientParams,
    updateBurstGradientParams,
    complaintHeatmapParams,
    updateComplaintHeatmapParams,
    selectedSensor,
    setSelectedSensor,
    mapZoomRequest,
    requestMapZoom,
    criticalComplaintsCopilotTrigger,
    requestCriticalComplaintsCopilotFlow,
  }

  return <PanelContext.Provider value={value}>{children}</PanelContext.Provider>
}
