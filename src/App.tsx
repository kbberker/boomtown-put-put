import { Routes, Route, useNavigate } from 'react-router'
import { Home } from './Home'
import { HoleSetup } from './holes/HoleSetup'
import { NewRound } from './round/NewRound'
import { Scorecard } from './round/Scorecard'
import './App.css'

function HoleSetupRoute() {
  const navigate = useNavigate()
  return <HoleSetup onBack={() => navigate('/')} />
}

function NewRoundRoute() {
  const navigate = useNavigate()
  return <NewRound onStart={() => navigate('/scorecard')} />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/holes" element={<HoleSetupRoute />} />
      <Route path="/new-round" element={<NewRoundRoute />} />
      <Route path="/scorecard" element={<Scorecard />} />
    </Routes>
  )
}

export default App
