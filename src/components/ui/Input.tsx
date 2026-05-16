'use client'

import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[10px] tracking-[0.18em] uppercase text-[#111111] font-medium mb-2.5">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-transparent border-b border-[#E5E5E0] focus:border-[#111111] outline-none py-2 text-sm font-light text-[#111111] transition-colors placeholder:text-[#BBBBBB] ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-[10px] text-red-500 tracking-wide">{error}</p>
      )}
    </div>
  )
}
