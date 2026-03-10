import React, { useState } from 'react'
import { createTransitionStyle } from '../motion-utils'

/**
 * D3-02: FocusEffect component
 * Adds accessible focus ring animations to form elements
 * Improves keyboard navigation visibility and accessibility
 */
export default function FocusEffect({
  children,
  focusColor = '#0071e3',
  duration = 150,
  className = '',
}) {
  const [isFocused, setIsFocused] = useState(false)

  const baseStyle = createTransitionStyle('all', duration)

  const focusStyle = {
    boxShadow: isFocused
      ? `0 0 0 3px rgba(0, 113, 227, 0.2), 0 0 0 1px ${focusColor}`
      : 'none',
    outline: 'none',
  }

  // Clone children to add focus handlers
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        onFocus: () => setIsFocused(true),
        onBlur: () => setIsFocused(false),
        style: { ...baseStyle, ...focusStyle },
      })
    }
    return child
  })

  return (
    <div className={`focus-effect ${className}`}>
      {enhancedChildren}
    </div>
  )
}
