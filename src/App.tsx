import { TimerScreen } from './components/TimerScreen'
import { SettingsProvider } from './state/SettingsProvider'

export default function App() {
  return (
    <SettingsProvider>
      <TimerScreen />
    </SettingsProvider>
  )
}
