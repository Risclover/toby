import { AppRoutes } from '@/routes'
import './App.css'
import { Navbar } from '@/components'
import { BrowserRouter } from 'react-router-dom'

function App() {
  return (
    <>
      <BrowserRouter>
        <Navbar />
        <AppRoutes />
      </BrowserRouter>
    </>
  )
}

export default App
