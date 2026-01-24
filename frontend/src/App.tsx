import { Layout } from '@/component'
import { BrowserRouter } from 'react-router-dom'
import "./index.css"
import "./assets/styles/globals.css"
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import "@/assets/styles/MantineOverrides.css"
import { MantineProvider } from '@mantine/core';
import { PrimeReactProvider } from 'primereact/api';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import { Notifications } from "@mantine/notifications"

function App() {
  return (
    <>
      <BrowserRouter>
        <PrimeReactProvider>
          <MantineProvider theme={{ primaryShade: 7 }}>
            <Notifications />
            <Layout />
          </MantineProvider>
        </PrimeReactProvider>
      </BrowserRouter>
    </>
  )
}

export default App
