import { TimerScreen } from './components/TimerScreen'
import { DEFAULT_ROUTINE } from './engine/routine'

export default function App() {
  return <TimerScreen routine={DEFAULT_ROUTINE} />
}
