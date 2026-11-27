import { Check } from 'lucide-react'
import { PASSWORD_RULES } from '@/lib/password-reset'

interface PasswordChecklistProps {
  password: string
  hasError?: boolean
}

export function PasswordChecklist({ password, hasError = false }: PasswordChecklistProps) {
  return (
    <ul className="space-y-1.5 pt-1 pl-1" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const valid = rule.test(password)
        const isError = hasError && !valid

        return (
          <li key={rule.id} className="flex items-center gap-2 text-xs">
            {valid ? (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              </span>
            ) : (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isError ? 'bg-red-600' : 'bg-text-secondary'
                  }`}
                />
              </span>
            )}
            <span
              className={
                valid ? 'text-primary font-medium' : isError ? 'text-red-600' : 'text-text-email'
              }
            >
              {rule.label}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
