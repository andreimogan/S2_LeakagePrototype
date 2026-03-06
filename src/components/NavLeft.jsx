import { MapPin, ChevronDown, User, Gauge } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { usePanelContext } from '../contexts/PanelContext'

export default function NavLeft() {
  const { selectedPersona, setSelectedPersona, selectedCharacteristic, setSelectedCharacteristic } = usePanelContext()
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false)
  const [characteristicDropdownOpen, setCharacteristicDropdownOpen] = useState(false)
  
  const personaRef = useRef(null)
  const characteristicRef = useRef(null)

  const personas = ['Operator', 'Leakage Manager']
  const characteristics = ['Dark', 'Noisy', 'Intelligent']

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (personaRef.current && !personaRef.current.contains(event.target)) {
        setPersonaDropdownOpen(false)
      }
      if (characteristicRef.current && !characteristicRef.current.contains(event.target)) {
        setCharacteristicDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Log when persona/characteristic changes for debugging
  useEffect(() => {
    console.log(`🎭 Current Mode: ${selectedPersona} - ${selectedCharacteristic}`)
  }, [selectedPersona, selectedCharacteristic])

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center justify-center h-8 shrink-0">
          <span className="text-xl font-bold text-white leading-tight tracking-tight">
            SAND
          </span>
        </div>
        <div className="h-6 w-px shrink-0" style={{ background: 'rgba(255, 255, 255, 0.2)' }} aria-hidden="true" />
        <div>
          <p className="text-xs leading-tight tracking-wide uppercase" style={{ opacity: 0.7 }}>
            St. Louis, MO
          </p>
          <h1 className="font-semibold text-sm leading-tight">
            Water OS
          </h1>
        </div>
      </div>
      
      {/* Location Dropdown */}
      <div className="relative">
        <button 
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-sm transition-colors"
          style={{ color: 'rgba(255, 255, 255, 0.9)' }}
          title="Switch city"
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="font-medium">St. Louis, MO</span>
          <ChevronDown className="w-3 h-3 transition-transform" aria-hidden="true" />
        </button>
      </div>

      {/* Persona Dropdown */}
      <div className="relative" ref={personaRef}>
        <button 
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-sm transition-colors"
          style={{ 
            color: 'rgba(255, 255, 255, 0.9)',
            background: personaDropdownOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
          }}
          title="Select persona"
          onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
          onMouseEnter={(e) => !personaDropdownOpen && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
          onMouseLeave={(e) => !personaDropdownOpen && (e.currentTarget.style.background = 'transparent')}
        >
          <User className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="font-medium">{selectedPersona}</span>
          <ChevronDown 
            className="w-3 h-3 transition-transform" 
            style={{ transform: personaDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            aria-hidden="true" 
          />
        </button>
        
        {personaDropdownOpen && (
          <div 
            className="absolute top-full mt-1 rounded shadow-lg border overflow-hidden"
            style={{
              background: 'var(--sand-surface)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              minWidth: '160px',
              zIndex: 1000
            }}
          >
            {personas.map((persona) => (
              <button
                key={persona}
                className="w-full text-left px-3 py-2 text-sm transition-colors"
                style={{
                  color: selectedPersona === persona ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  background: selectedPersona === persona ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                }}
                onClick={() => {
                  setSelectedPersona(persona)
                  setPersonaDropdownOpen(false)
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = selectedPersona === persona ? 'rgba(255, 255, 255, 0.1)' : 'transparent'}
              >
                {persona}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Characteristic Dropdown */}
      <div className="relative" ref={characteristicRef}>
        <button 
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-sm transition-colors"
          style={{ 
            color: 'rgba(255, 255, 255, 0.9)',
            background: characteristicDropdownOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
          }}
          title="Select characteristic"
          onClick={() => setCharacteristicDropdownOpen(!characteristicDropdownOpen)}
          onMouseEnter={(e) => !characteristicDropdownOpen && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
          onMouseLeave={(e) => !characteristicDropdownOpen && (e.currentTarget.style.background = 'transparent')}
        >
          <Gauge className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="font-medium">{selectedCharacteristic}</span>
          <ChevronDown 
            className="w-3 h-3 transition-transform" 
            style={{ transform: characteristicDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            aria-hidden="true" 
          />
        </button>
        
        {characteristicDropdownOpen && (
          <div 
            className="absolute top-full mt-1 rounded shadow-lg border overflow-hidden"
            style={{
              background: 'var(--sand-surface)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              minWidth: '160px',
              zIndex: 1000
            }}
          >
            {characteristics.map((characteristic) => (
              <button
                key={characteristic}
                className="w-full text-left px-3 py-2 text-sm transition-colors"
                style={{
                  color: selectedCharacteristic === characteristic ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  background: selectedCharacteristic === characteristic ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                }}
                onClick={() => {
                  setSelectedCharacteristic(characteristic)
                  setCharacteristicDropdownOpen(false)
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = selectedCharacteristic === characteristic ? 'rgba(255, 255, 255, 0.1)' : 'transparent'}
              >
                {characteristic}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
