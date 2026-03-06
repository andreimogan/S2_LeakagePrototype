// Leakage Events Data
// These represent identified clusters of customer complaints that suggest potential underground leaks

export const LEAKAGE_EVENTS = [
  {
    id: 'leakage-event-001',
    name: 'Pine St Cluster - Potential Leak',
    dateCreated: '2025-11-29T08:15:00Z',
    status: 'investigating', // 'investigating' | 'confirmed' | 'resolved'
    complaintIds: [
      'complaint-018',
      'complaint-019',
      'complaint-020',
      'complaint-021',
      'complaint-022',
      'complaint-023',
      'complaint-024'
    ],
    centroid: [-90.2003, 38.6308], // Center point of complaints (Pine St & N 18th St)
    affectedArea: {
      radius: 50,
      unit: 'meters'
    },
    priority: 'High',
    estimatedCustomersAffected: 150,
    notes: 'Multiple high-priority complaints reported in close proximity on 11/29/2025. Investigation recommended.'
  }
]

// Helper function to get leakage event by ID
export const getLeakageEventById = (eventId) => {
  return LEAKAGE_EVENTS.find(event => event.id === eventId)
}

// Helper function to find leakage events containing a specific complaint
export const getLeakageEventsForComplaint = (complaintId) => {
  return LEAKAGE_EVENTS.filter(event => event.complaintIds.includes(complaintId))
}

// Helper function to calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (coord1, coord2) => {
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

// Helper function to find nearest leakage event to a complaint location
export const findNearestLeakageEvent = (complaintCoordinates) => {
  if (LEAKAGE_EVENTS.length === 0) return null

  let nearest = null
  let minDistance = Infinity

  LEAKAGE_EVENTS.forEach(event => {
    const distance = calculateDistance(complaintCoordinates, event.centroid)
    if (distance < minDistance) {
      minDistance = distance
      nearest = { event, distance }
    }
  })

  // Only return if within 100 meters
  return minDistance <= 100 ? nearest : null
}
