import TopNav from './components/TopNav'
import MapView from './components/MapView'
import SuccessNotifications from './components/notifications/SuccessNotifications'
import ApprovalQueuePanel from './components/panels/ApprovalQueuePanel'
import ComplaintsListPanel from './components/panels/ComplaintsListPanel'
import WorkOrdersPanel from './components/panels/WorkOrdersPanel'
import {
  EventAffectedAreaPanel,
  WaterOSCopilotPanel,
  ManageMapLayersPanel,
  PressureZonePanel,
  SensorDetailsPanel,
  PipeDetailsPanel,
} from './components/panels'
import { PanelProvider, usePanelContext } from './contexts/PanelContext'

function AppContent() {
  const { 
    openWaterMains, 
    approvalQueueVisible, 
    setApprovalQueueVisible,
    complaintsListVisible,
    setComplaintsListVisible,
    complaintsListFilteredEventId,
    setComplaintsListFilteredEventId,
    complaintsListExpandedComplaintId,
    setComplaintsListExpandedComplaintId,
    workOrdersVisible,
    setWorkOrdersVisible
  } = usePanelContext()
  
  return (
    <>
      <TopNav />
      <main
        className="relative flex-1 min-h-[calc(100vh-var(--nav-height))] bg-[var(--content-bg)]"
        aria-label="Main content"
      >
        <MapView />
        <SuccessNotifications />
        {approvalQueueVisible && (
          <ApprovalQueuePanel onClose={() => setApprovalQueueVisible(false)} />
        )}
        {complaintsListVisible && (
          <ComplaintsListPanel 
            onClose={() => {
              setComplaintsListVisible(false)
              setComplaintsListFilteredEventId(null)
              setComplaintsListExpandedComplaintId(null)
            }} 
            preFilteredEventId={complaintsListFilteredEventId}
            preExpandedComplaintId={complaintsListExpandedComplaintId}
          />
        )}
        
        {/* Work Orders Panel */}
        {workOrdersVisible && (
          <WorkOrdersPanel onClose={() => setWorkOrdersVisible(false)} />
        )}
        
        <EventAffectedAreaPanel />
        <WaterOSCopilotPanel />
        <ManageMapLayersPanel />
        <PressureZonePanel />
        <SensorDetailsPanel />
        {openWaterMains.map((waterMain, index) => (
          <PipeDetailsPanel 
            key={waterMain.uniqueId} 
            waterMain={waterMain} 
            index={index}
          />
        ))}
      </main>
    </>
  )
}

function App() {
  return (
    <PanelProvider>
      <AppContent />
    </PanelProvider>
  )
}

export default App
