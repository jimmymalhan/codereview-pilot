import React from 'react'
import { createStaggeredAnimationStyles, getSafeDuration } from '../motion-utils'

/**
 * D2-06: StaggeredList component
 * Renders a list with staggered entrance animations for each item
 * Perfect for lists, grids, and sequential reveals
 */
export default function StaggeredList({
  items = [],
  renderItem,
  animation = 'fadeIn',
  duration = 300,
  stepDelay = 50,
  easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
  className = '',
  containerClassName = '',
}) {
  const animationStyles = createStaggeredAnimationStyles(
    items.length,
    animation,
    duration,
    stepDelay,
    easing
  )

  return (
    <div className={`staggered-list ${containerClassName}`}>
      {items.map((item, index) => (
        <div
          key={index}
          className={`staggered-list-item ${className}`}
          style={animationStyles[index]}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}
