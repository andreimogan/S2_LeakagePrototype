/**
 * Bundled water main LineStrings (St. Louis area, WGS84).
 * Shipped with the app so lines appear on deploy without localStorage.
 * IDs are stable so deletes/edits behave consistently after first save.
 */
export const WATER_MAINS_DEFAULT = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'water-main-default-downtown-market',
      properties: { riskLevel: 'high' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-90.212, 38.6245],
          [-90.205, 38.6262],
          [-90.198, 38.6278],
          [-90.189, 38.6292],
        ],
      },
    },
    {
      type: 'Feature',
      id: 'water-main-default-union-station',
      properties: { riskLevel: 'medium' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-90.208, 38.628],
          [-90.201, 38.6295],
          [-90.194, 38.6308],
        ],
      },
    },
    {
      type: 'Feature',
      id: 'water-main-default-south-grand',
      properties: { riskLevel: 'low' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-90.254, 38.617],
          [-90.248, 38.6185],
          [-90.242, 38.6198],
        ],
      },
    },
    {
      type: 'Feature',
      id: 'water-main-default-riverfront',
      properties: { riskLevel: 'high' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-90.185, 38.623],
          [-90.178, 38.6255],
          [-90.172, 38.627],
        ],
      },
    },
    {
      type: 'Feature',
      id: 'water-main-default-midtown',
      properties: { riskLevel: 'medium' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-90.22, 38.635],
          [-90.21, 38.6365],
          [-90.198, 38.6378],
        ],
      },
    },
    {
      type: 'Feature',
      id: 'water-main-default-central-west',
      properties: { riskLevel: 'low' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-90.265, 38.642],
          [-90.255, 38.643],
          [-90.245, 38.644],
        ],
      },
    },
  ],
}
