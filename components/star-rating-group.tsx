'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

type Dimension = {
  name: string      // form field name
  label: string     // display label
  required?: boolean
}

type Props = {
  dimensions: Dimension[]
  defaultValues?: Record<string, number>
}

export function StarRatingGroup({ dimensions, defaultValues = {} }: Props) {
  const [values, setValues] = useState<Record<string, number>>(defaultValues)

  return (
    <div className="space-y-5">
      {dimensions.map(dim => (
        <div key={dim.name}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">
              {dim.label}
              {dim.required && <span className="text-destructive ml-1">*</span>}
            </label>
            {values[dim.name] ? (
              <span className="text-xs text-muted-foreground">{values[dim.name]}점</span>
            ) : (
              <span className="text-xs text-muted-foreground/50">미선택</span>
            )}
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(score => (
              <button
                key={score}
                type="button"
                onClick={() => setValues(prev => ({ ...prev, [dim.name]: score }))}
                className="p-0.5 rounded transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    score <= (values[dim.name] ?? 0)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-muted-foreground/25 hover:text-amber-200 hover:fill-amber-200'
                  }`}
                />
              </button>
            ))}
          </div>
          <input type="hidden" name={dim.name} value={values[dim.name] ?? ''} />
        </div>
      ))}
    </div>
  )
}
