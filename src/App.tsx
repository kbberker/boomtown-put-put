import { Routes, Route } from 'react-router'
import { Home } from './Home'
import { HoleSetup } from './holes/HoleSetup'
import { NewRound } from './round/NewRound'
import { HoleEntry } from './round/HoleEntry'
import { Scorecard } from './round/Scorecard'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/holes" element={<HoleSetup />} />
      <Route path="/new-round" element={<NewRound />} />
      <Route path="/scorecard" element={<Scorecard />} />
      <Route path="/hole/:holeIndex" element={<HoleEntry />} />
    </Routes>
  )
}

export default App
