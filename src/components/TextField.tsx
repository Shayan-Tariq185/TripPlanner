import type { InputHTMLAttributes } from 'react'
import { useId } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

export function TextField({ label, hint, error, id, className = '', ...props }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-[0.78rem] text-mist-300">
        {label}
        {props.required && <span className="text-gold-400 ml-1">*</span>}
      </label>
      <input
        id={inputId}
        className={`rounded-[1.1rem] border border-hairline-strong bg-ink-900 px-[1.2rem] py-4 text-[0.95rem]
                    text-mist-100 placeholder:text-mist-400
                    transition-all duration-400
                    focus:border-gold-500 focus:shadow-[0_0_0_4px_rgba(212,166,87,0.12)] focus:outline-none
                    ${error ? 'border-coral-500/60' : ''} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-mist-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-coral-500">
          {error}
        </p>
      )}
    </div>
  )
}
