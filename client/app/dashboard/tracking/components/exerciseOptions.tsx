export function getSetOptions() {
  const options = []
  for (let i = 1; i <= 10; i++) {
    options.push(<option key={i} value={i}>{i} set</option>)
  }
  return options
}

export function getRepOptions() {
  const options = []
  for (let i = 1; i <= 30; i++) {
    options.push(<option key={i} value={i}>{i} reps</option>)
  }
  return options
}
