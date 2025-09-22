import { Layout } from '@/component'
import { BrowserRouter } from 'react-router-dom'
import "./index.css"
import "./assets/styles/global.css"
import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import { SidebarProvider } from './components/ui/sidebar'

function App() {

  return (
    <>
      <BrowserRouter>
        <MantineProvider>
          <SidebarProvider>
            <Layout />
          </SidebarProvider>
        </MantineProvider>
      </BrowserRouter>
    </>
  )
}

export default App
