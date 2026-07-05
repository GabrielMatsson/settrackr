type Props = {
  value: number
  target: number
  label: string
  centerText?: string
  color?: string
}

export default function ProgressRing({ value, target, label, centerText, color = "#6366f1" }: Props) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const percent = target > 0 ? Math.min(value / target, 1) : 0
  const offset = circumference * (1 - percent)
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 70 70">
          <circle cx="35" cy="35" r={radius} fill="none" stroke="var(--ring-track)" strokeWidth="8" />
          <circle
            cx="35" cy="35" r={radius}
            fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-gray-900 dark:text-white font-semibold text-xs">{centerText ?? `${value}/${target}`}</span>
        </div>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-xs">{label}</p>
    </div>
  )
}
