import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import OrderPage from './pages/OrderPage'
import AdminPage from './pages/AdminPage'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<OrderPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  )
}

export default App
