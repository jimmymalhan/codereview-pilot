import React, { useState, useEffect, useRef } from 'react'

/**
 * D3-04: ScrollTrigger component
 * Triggers callbacks when element enters/leaves viewport
 * Perfect for scroll-based analytics, lazy loading, or animations
 */
export default function ScrollTrigger({
  children,
  onEnter = null,
  onLeave = null,
  threshold = 0.5,
  once = false,
  className = '',
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)
  const hasTriggeredEnter = useRef(false)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!hasTriggeredEnter.current) {
            setIsVisible(true)
            hasTriggeredEnter.current = true
            if (onEnter) onEnter()
          }

          if (once) {
            observer.unobserve(entry.target)
          }
        } else {
          setIsVisible(false)
          if (onLeave) onLeave()
        }
      },
      { threshold }
    )

    observer.observe(ref.current)

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [threshold, once, onEnter, onLeave])

  return (
    <div ref={ref} className={`scroll-trigger ${className}`}>
      {typeof children === 'function' ? children(isVisible) : children}
    </div>
  )
}
