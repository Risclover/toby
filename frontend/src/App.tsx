import { Layout } from '@/component'
import { BrowserRouter } from 'react-router-dom'
import "./index.css"
import "./assets/styles/globals.css"
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import "@/assets/styles/MantineOverrides.css"
import { MantineProvider } from '@mantine/core';
import { PrimeReactProvider } from 'primereact/api';
import "primereact/resources/themes/lara-light-cyan/theme.css";

function App() {
  return (
    <>
      <BrowserRouter>
        <PrimeReactProvider>
          <MantineProvider theme={{ primaryShade: 7 }}>
            <Layout />
          </MantineProvider>
        </PrimeReactProvider>
      </BrowserRouter>
    </>
  )
}

export default App
