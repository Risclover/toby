import { AppRoutes } from '@/routes'
import { Layout } from '@/component'
import { BrowserRouter } from 'react-router-dom'
import "./index.css"
import "./assets/styles/global.css"
import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from './components/ui/sidebar'
import { AppSidebar } from './components/app-sidebar'
import { useState } from 'react'

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
