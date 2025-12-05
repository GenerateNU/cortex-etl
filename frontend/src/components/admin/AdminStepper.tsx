import { Fragment, type FC } from 'react'

export type AdminStepStatus = 'completed' | 'current' | 'pending' | 'disabled'

export interface AdminStep {
  label: string
  status: AdminStepStatus
}

interface AdminStepperProps {
  steps: AdminStep[]
  onStepClick?: (index: number) => void
}

// All items are aligned to the top. Connectors have top margin to center with circles.
export const AdminStepper: FC<AdminStepperProps> = ({ steps, onStepClick }) => {
  // Height of the circle is 2.25rem (h-9, 36px), so to center a 4px (1rem) connector:
  // Top margin should be half of circle minus half of connector = (36-4)/2 = 16px (1rem)
  // So use mt-4 or inline marginTop: 16px for precise alignment.
  const circleHeightPx = 36
  const connectorHeightPx = 4
  const connectorMarginTopPx = (circleHeightPx - connectorHeightPx) / 2 // 16

  return (
    <div className="w-full flex items-start px-2 gap-0">
      <div
        className="grid w-full"
        style={{
          gridTemplateColumns: `repeat(${steps.length * 2 - 1}, minmax(0, 1fr))`,
          alignItems: 'start',
          width: '100%',
        }}
      >
        {steps.map((step, index) => {
          const isClickable = !!onStepClick && step.status !== 'disabled'

          const baseCircleClasses =
            'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors'

          const circleClasses =
            step.status === 'completed'
              ? `${baseCircleClasses} border-emerald-400 bg-emerald-500/10 text-emerald-300`
              : step.status === 'current'
                ? `${baseCircleClasses} border-primary-400 bg-primary-500/10 text-primary-300`
                : step.status === 'disabled'
                  ? `${baseCircleClasses} border-slate-700 text-slate-600`
                  : `${baseCircleClasses} border-slate-500 text-slate-200`

          const connectorActive =
            index < steps.length - 1 &&
            (steps[index + 1].status === 'current' ||
              steps[index + 1].status === 'completed')

          return (
            <Fragment key={step.label}>
              {/* Step circle aligned to top, label below */}
              <div className="flex flex-col items-center justify-start min-w-0">
                <button
                  type="button"
                  className="flex flex-col items-center justify-start focus:outline-none w-full"
                  disabled={!isClickable}
                  onClick={isClickable ? () => onStepClick?.(index) : undefined}
                  tabIndex={isClickable ? 0 : -1}
                  style={{ background: 'none', padding: 0 }}
                >
                  <div
                    className={circleClasses}
                    style={{ lineHeight: '2.25rem' }}
                  >
                    {index + 1}
                  </div>
                  <div className="mt-2 w-full flex justify-center">
                    <div className="text-sm font-medium text-slate-100 text-center leading-tight break-words whitespace-normal">
                      {step.label}
                    </div>
                  </div>
                </button>
              </div>
              {/* Connector, except after last step, with top margin to center */}
              {index < steps.length - 1 && (
                <div
                  className={`h-1 rounded-full transition-colors flex-1`}
                  style={{
                    backgroundColor: connectorActive
                      ? 'var(--color-primary-500, #6366f1)'
                      : '#334155',
                    minWidth: 32,
                    width: '100%',
                    marginTop: connectorMarginTopPx,
                  }}
                  aria-hidden
                />
              )}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
