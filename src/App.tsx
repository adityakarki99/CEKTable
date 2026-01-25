import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TableDemo from './pages/TableDemo'
import TableComponents from './pages/TableComponents'
import './App.css'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/demo" element={<TableDemo />} />
        <Route path="/components" element={<TableComponents />} />
      </Routes>
    </div>
  )
}

export default App
