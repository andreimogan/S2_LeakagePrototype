import { useState, useRef, useEffect } from 'react'

export function useResizable(initialSize = { width: 900, height: 600 }, minSize = { width: 600, height: 400 }) {
  const [size, setSize] = useState(initialSize)
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef(null)
  const startSizeRef = useRef({ width: 0, height: 0 })
  const startPosRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef(null)

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        const deltaX = e.clientX - startPosRef.current.x
        const deltaY = e.clientY - startPosRef.current.y

        const newWidth = Math.max(minSize.width, startSizeRef.current.width + deltaX)
        const newHeight = Math.max(minSize.height, startSizeRef.current.height + deltaY)

        setSize({
          width: newWidth,
          height: newHeight
        })
      })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'nwse-resize'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isResizing, minSize.width, minSize.height])

  const handleResizeStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    startSizeRef.current = {
      width: size.width,
      height: size.height
    }
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY
    }
    setIsResizing(true)
  }

  return {
    size,
    setSize,
    isResizing,
    resizeRef,
    handleResizeStart
  }
}
