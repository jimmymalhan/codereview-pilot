import React, { useState } from 'react'
import { createTransitionStyle } from '../motion-utils'

/**
 * D3-06: ButtonWithFeedback component
 * Button with integrated hover, focus, and tap feedback
 * Combines HoverEffect, FocusEffect, and TapFeedback
 */
export default function ButtonWithFeedback({
  children,
  onClick = null,
  variant = 'primary', // 'primary' | 'secondary' | 'tertiary'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  className = '',
  style = {},
}) {
  const [isHovering, setIsHovering] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const transitionStyle = createTransitionStyle('all', 150)

  // Variant styles
  const variantStyles = {
    primary: {
      backgroundColor: isHovering ? '#0066cc' : '#0071e3',
      color: 'white',
    },
    secondary: {
      backgroundColor: isHovering ? '#f5f5f7' : '#ffffff',
      color: '#0071e3',
      border: '1px solid #e5e5e5',
    },
    tertiary: {
      backgroundColor: 'transparent',
      color: isHovering ? '#0066cc' : '#0071e3',
    },
  }

  // Size styles
  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '12px' },
    md: { padding: '10px 16px', fontSize: '14px' },
    lg: { padding: '14px 20px', fontSize: '16px' },
  }

  // Combined button styles
  const buttonStyle = {
    ...transitionStyle,
    ...variantStyles[variant],
    ...sizeStyles[size],
    transform: isPressed ? 'scale(0.98)' : 'scale(1)',
    boxShadow:
      isHovering && !isPressed
        ? '0 4px 12px rgba(0, 0, 0, 0.15)'
        : '0 2px 4px rgba(0, 0, 0, 0.08)',
    outline: isFocused ? '2px solid #0071e3' : 'none',
    outlineOffset: '2px',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '500',
    ...style,
  }

  return (
    <button
      className={`button-with-feedback button-${variant} button-${size} ${className}`}
      style={buttonStyle}
      onMouseEnter={() => !disabled && setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false)
        setIsPressed(false)
      }}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onFocus={() => !disabled && setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onClick={!disabled ? onClick : null}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
