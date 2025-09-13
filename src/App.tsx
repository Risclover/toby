import { AppRoutes } from '@/routes'
import { Navbar } from '@/components'
import { BrowserRouter } from 'react-router-dom'
import "./assets/styles/global.css"

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
