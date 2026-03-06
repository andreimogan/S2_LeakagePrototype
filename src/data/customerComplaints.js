// Customer Complaints Data for St. Louis Downtown Area
// These represent customer-reported issues on the water network

export const CUSTOMER_COMPLAINTS = {
  type: 'FeatureCollection',
  features: [
    // Water Coming Up complaints (orange-red)
    {
      type: 'Feature',
      id: 'complaint-001',
      properties: {
        complaintId: 'CC-001',
        theme: 'water_coming_up',
        themeName: 'Water Coming Up',
        priority: 'High',
        reportedDate: '11/28/2025',
        reportedTime: '14:23',
        reportedTimestamp: '2025-11-28T14:23:00Z',
        location: 'Market St & N 18th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.1990, 38.6285]
      }
    },
    {
      type: 'Feature',
      id: 'complaint-002',
      properties: {
        complaintId: 'CC-002',
        theme: 'water_coming_up',
        themeName: 'Water Coming Up',
        priority: 'Medium',
        reportedDate: '11/27/2025',
        reportedTime: '09:15',
        reportedTimestamp: '2025-11-27T09:15:00Z',
        location: 'Chestnut St & N 19th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.1975, 38.6295]
      }
    },
    
    // No Water complaints (orange)
    {
      type: 'Feature',
      id: 'complaint-003',
      properties: {
        complaintId: 'CC-003',
        theme: 'no_water',
        themeName: 'No Water',
        priority: 'High',
        reportedDate: '11/26/2025',
        reportedTime: '16:45',
        reportedTimestamp: '2025-11-26T16:45:00Z',
        location: 'Pine St & N 17th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.2015, 38.6310]
      }
    },
    {
      type: 'Feature',
      id: 'complaint-004',
      properties: {
        complaintId: 'CC-004',
        theme: 'no_water',
        themeName: 'No Water',
        priority: 'Medium',
        reportedDate: '11/25/2025',
        reportedTime: '08:30',
        reportedTimestamp: '2025-11-25T08:30:00Z',
        location: 'Olive St & N 16th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.2030, 38.6270]
      }
    },
    {
      type: 'Feature',
      id: 'complaint-005',
      properties: {
        complaintId: 'CC-005',
        theme: 'no_water',
        themeName: 'No Water',
        priority: 'Low',
        reportedDate: '11/24/2025',
        reportedTime: '11:20',
        reportedTimestamp: '2025-11-24T11:20:00Z',
        location: 'Washington Ave & N 15th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.2045, 38.6325]
      }
    },
    
    // Pressure Problem complaints (yellow)
    {
      type: 'Feature',
      id: 'complaint-006',
      properties: {
        complaintId: 'CC-006',
        theme: 'pressure_problem',
        themeName: 'Pressure Problem',
        priority: 'Medium',
        reportedDate: '11/26/2025',
        reportedTime: '13:10',
        reportedTimestamp: '2025-11-26T13:10:00Z',
        location: 'Locust St & N 18th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.1995, 38.6300]
      }
    },
    {
      type: 'Feature',
      id: 'complaint-007',
      properties: {
        complaintId: 'CC-007',
        theme: 'pressure_problem',
        themeName: 'Pressure Problem',
        priority: 'High',
        reportedDate: '11/27/2025',
        reportedTime: '17:50',
        reportedTimestamp: '2025-11-27T17:50:00Z',
        location: 'Clark Ave & N 19th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.1980, 38.6250]
      }
    },
    {
      type: 'Feature',
      id: 'complaint-008',
      properties: {
        complaintId: 'CC-008',
        theme: 'pressure_problem',
        themeName: 'Pressure Problem',
        priority: 'Low',
        reportedDate: '11/23/2025',
        reportedTime: '10:05',
        reportedTimestamp: '2025-11-23T10:05:00Z',
        location: 'Cole St & N 17th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.2010, 38.6240]
      }
    },
    
    // Missing/Loose Cover complaints (blue)
    {
      type: 'Feature',
      id: 'complaint-009',
      properties: {
        complaintId: 'CC-009',
        theme: 'missing_loose_cover',
        themeName: 'Missing/Loose - Cover/S...',
        priority: 'Medium',
        reportedDate: '11/25/2025',
        reportedTime: '15:30',
        reportedTimestamp: '2025-11-25T15:30:00Z',
        location: 'Market St & N 16th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.2025, 38.6290]
      }
    },
    {
      type: 'Feature',
      id: 'complaint-010',
      properties: {
        complaintId: 'CC-010',
        theme: 'missing_loose_cover',
        themeName: 'Missing/Loose - Cover/S...',
        priority: 'Low',
        reportedDate: '11/22/2025',
        reportedTime: '12:15',
        reportedTimestamp: '2025-11-22T12:15:00Z',
        location: 'Chestnut St & N 20th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.1960, 38.6305]
      }
    },
    
    // Water in Building complaints (green)
    {
      type: 'Feature',
      id: 'complaint-011',
      properties: {
        complaintId: 'CC-011',
        theme: 'water_in_building',
        themeName: 'Water in Building',
        priority: 'High',
        reportedDate: '11/28/2025',
        reportedTime: '07:40',
        reportedTimestamp: '2025-11-28T07:40:00Z',
        location: 'Pine St & N 19th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.1985, 38.6315]
      }
    },
    {
      type: 'Feature',
      id: 'complaint-012',
      properties: {
        complaintId: 'CC-012',
        theme: 'water_in_building',
        themeName: 'Water in Building',
        priority: 'Medium',
        reportedDate: '11/26/2025',
        reportedTime: '18:55',
        reportedTimestamp: '2025-11-26T18:55:00Z',
        location: 'Olive St & N 18th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.2000, 38.6275]
      }
    },
    {
      type: 'Feature',
      id: 'complaint-013',
      properties: {
        complaintId: 'CC-013',
        theme: 'water_in_building',
        themeName: 'Water in Building',
        priority: 'Low',
        reportedDate: '11/21/2025',
        reportedTime: '06:10',
        reportedTimestamp: '2025-11-21T06:10:00Z',
        location: 'Washington Ave & N 17th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.2020, 38.6330]
      }
    },
    
    // Other complaints (gray)
    {
      type: 'Feature',
      id: 'complaint-014',
      properties: {
        complaintId: 'CC-014',
        theme: 'other',
        themeName: 'Other',
        priority: 'Low',
        reportedDate: '11/24/2025',
        reportedTime: '19:25',
        reportedTimestamp: '2025-11-24T19:25:00Z',
        location: 'Locust St & N 16th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.2035, 38.6305]
      }
    },
    {
      type: 'Feature',
      id: 'complaint-015',
      properties: {
        complaintId: 'CC-015',
        theme: 'other',
        themeName: 'Other',
        priority: 'Medium',
        reportedDate: '11/27/2025',
        reportedTime: '20:40',
        reportedTimestamp: '2025-11-27T20:40:00Z',
        location: 'Clark Ave & N 18th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.1995, 38.6255]
      }
    },
    
    // Unknown complaints (dark gray)
    {
      type: 'Feature',
      id: 'complaint-016',
      properties: {
        complaintId: 'CC-016',
        theme: 'unknown',
        themeName: 'Unknown',
        priority: 'Low',
        reportedDate: '11/20/2025',
        reportedTime: '14:00',
        reportedTimestamp: '2025-11-20T14:00:00Z',
        location: 'Market St & N 15th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.2050, 38.6280]
      }
    },
    {
      type: 'Feature',
      id: 'complaint-017',
      properties: {
        complaintId: 'CC-017',
        theme: 'unknown',
        themeName: 'Unknown',
        priority: 'Medium',
        reportedDate: '11/23/2025',
        reportedTime: '16:35',
        reportedTimestamp: '2025-11-23T16:35:00Z',
        location: 'Pine St & N 20th St'
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.1970, 38.6320]
      }
    },

    // COMPLAINT CLUSTER - Potential Leak Area (Pine St & N 18th St)
    // Multiple complaints in close proximity suggesting possible underground leak
    {
      type: 'Feature',
      id: 'complaint-018',
      properties: {
        complaintId: 'CC-018',
        theme: 'water_coming_up',
        themeName: 'Water Coming Up',
        priority: 'High',
        reportedDate: '11/29/2025',
        reportedTime: '08:15',
        reportedTimestamp: '2025-11-29T08:15:00Z',
        location: '1800 Pine St' // Center of cluster
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.2005, 38.6308]
      }
    },
    {
      type: 'Feature',
      id: 'complaint-019',
      properties: {
        complaintId: 'CC-019',
        theme: 'pressure_problem',
        themeName: 'Pressure Problem',
        priority: 'High',
        reportedDate: '11/29/2025',
        reportedTime: '09:30',
        reportedTimestamp: '2025-11-29T09:30:00Z',
        location: '1802 Pine St' // 20m east
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.2003, 38.6308]
      }
    },
    {
      type: 'Feature',
      id: 'complaint-020',
      properties: {
        complaintId: 'CC-020',
        theme: 'no_water',
        themeName: 'No Water',
        priority: 'High',
        reportedDate: '11/29/2025',
        reportedTime: '10:45',
        reportedTimestamp: '2025-11-29T10:45:00Z',
        location: '1804 Pine St' // 40m east
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.2001, 38.6308]
      }
    },
    {
      type: 'Feature',
      id: 'complaint-021',
      properties: {
        complaintId: 'CC-021',
        theme: 'water_in_building',
        themeName: 'Water in Building',
        priority: 'Medium',
        reportedDate: '11/29/2025',
        reportedTime: '11:20',
        reportedTimestamp: '2025-11-29T11:20:00Z',
        location: 'Pine St (south side)' // 30m south
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.2004, 38.6305]
      }
    },
    {
      type: 'Feature',
      id: 'complaint-022',
      properties: {
        complaintId: 'CC-022',
        theme: 'pressure_problem',
        themeName: 'Pressure Problem',
        priority: 'Medium',
        reportedDate: '11/29/2025',
        reportedTime: '12:00',
        reportedTimestamp: '2025-11-29T12:00:00Z',
        location: 'Pine St (north side)' // 30m north
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.2003, 38.6311]
      }
    },
    {
      type: 'Feature',
      id: 'complaint-023',
      properties: {
        complaintId: 'CC-023',
        theme: 'water_coming_up',
        themeName: 'Water Coming Up',
        priority: 'High',
        reportedDate: '11/29/2025',
        reportedTime: '13:15',
        reportedTimestamp: '2025-11-29T13:15:00Z',
        location: '1798 Pine St' // 20m west
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.2007, 38.6308]
      }
    },
    {
      type: 'Feature',
      id: 'complaint-024',
      properties: {
        complaintId: 'CC-024',
        theme: 'missing_loose_cover',
        themeName: 'Missing/Loose - Cover/S...',
        priority: 'Medium',
        reportedDate: '11/29/2025',
        reportedTime: '14:30',
        reportedTimestamp: '2025-11-29T14:30:00Z',
        location: 'Pine St & N 18th St (intersection)' // Cluster center
      },
      geometry: {
        type: 'Point',
        coordinates: [-90.2005, 38.6309]
      }
    }
  ]
}

// Helper function to get color for complaint theme
export function getComplaintThemeColor(theme) {
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
