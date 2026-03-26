import { WATER_MAINS_DEFAULT } from './waterMainsDefault'

const STORAGE_KEY = 'waterMains'

/** Deep copy so callers cannot mutate bundled defaults */
function cloneDefaultWaterMains() {
  return JSON.parse(JSON.stringify(WATER_MAINS_DEFAULT))
}

export function getWaterMainsData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    // No saved data (e.g. first visit / fresh deploy): use bundled defaults
    if (!raw) return cloneDefaultWaterMains()
    const parsed = JSON.parse(raw)
    if (parsed && parsed.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
      return parsed
    }
    return cloneDefaultWaterMains()
  } catch (error) {
    console.error('Error loading water mains:', error)
    return cloneDefaultWaterMains()
  }
}

export function saveWaterMainsData(featureCollection) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(featureCollection))
  } catch (error) {
    console.error('Error saving water mains:', error)
  }
}
