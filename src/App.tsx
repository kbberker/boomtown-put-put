import { Routes, Route, useNavigate } from 'react-router'
import { Home } from './Home'
import { HoleSetup } from './holes/HoleSetup'
import './App.css'

function HoleSetupRoute() {
  const navigate = useNavigate()
  return <HoleSetup onBack={() => navigate('/')} />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/holes" element={<HoleSetupRoute />} />
    </Routes>
  )
}

export default App
