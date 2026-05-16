'use client'

import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
  size?: 'sm' | 'md'
  loading?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center tracking-[0.15em] uppercase font-medium text-[11px] transition-all duration-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
  const variants = {
    primary: 'bg-[#111111] text-[#FAFAF8] hover:bg-[#333333]',
    ghost: 'border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#FAFAF8] hover:border-[#111111] bg-transparent',
  }
  const sizes = {
    sm: 'px-5 py-2.5 hover:px-10',
    md: 'px-7 py-3.5 hover:px-12',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  )
}
