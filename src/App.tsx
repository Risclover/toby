import { AppRoutes } from '@/routes'
import { Navbar } from '@/component'
import { BrowserRouter } from 'react-router-dom'
import "./assets/styles/global.css"
import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';

function App() {
  return (
    <>
      <BrowserRouter>
        <MantineProvider>
          <Navbar />
          <AppRoutes />
        </MantineProvider>
      </BrowserRouter>
    </>
  )
}

export default App
