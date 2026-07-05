import FoodShell from "./components/FoodShell"

export default function FoodTrackingLayout({ children }: { children: React.ReactNode }) {
  return <FoodShell>{children}</FoodShell>
}
