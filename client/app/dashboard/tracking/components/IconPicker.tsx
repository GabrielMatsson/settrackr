"use client"

import { Dumbbell, Flame, Zap, Target, Footprints, Trophy, Heart, Star } from "lucide-react"

const ICONS = [
  { name: "Dumbbell",   Icon: Dumbbell   },
  { name: "Flame",      Icon: Flame      },
  { name: "Zap",        Icon: Zap        },
  { name: "Target",     Icon: Target     },
  { name: "Footprints", Icon: Footprints },
  { name: "Trophy",     Icon: Trophy     },
  { name: "Heart",      Icon: Heart      },
  { name: "Star",       Icon: Star       },
]

type Props = {
  value: string
  onChange: (name: string) => void
}

export default function IconPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {ICONS.map(({ name, Icon }) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            value === name
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400"
          }`}
        >
          <Icon size={18} />
        </button>
      ))}
    </div>
  )
}
