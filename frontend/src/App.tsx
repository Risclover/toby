import { Layout } from '@/components'
import { BrowserRouter } from 'react-router-dom'
import "./index.css"
import "./assets/styles/globals.css"
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/schedule/styles.css';
import "@/assets/styles/MantineOverrides.css"
import { createTheme, MantineProvider } from '@mantine/core';
import { PrimeReactProvider } from 'primereact/api';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import { Notifications } from "@mantine/notifications"
import { AppProviders } from './AppProviders';
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  const theme = createTheme({
    colors: {
      'main-blue': ['rgb(5, 5, 73)', '#5FCCDB', '#44CADC', '#2AC9DE', '#1AC2D9', '#11B7CD', '#09ADC3', '#0E99AC', '#128797', '#147885'],
      'bright-pink': ['#F0BBDD', '#ED9BCF', '#EC7CC3', '#ED5DB8', '#F13EAF', '#F71FA7', '#FF00A1', '#E00890', '#C50E82', '#AD1374'],
    },
  });
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AppProviders>
        <BrowserRouter>
          <PrimeReactProvider>
            <MantineProvider theme={{ primaryShade: 7 }}>
              <Notifications />
              <Layout />
            </MantineProvider>
          </PrimeReactProvider>
        </BrowserRouter>
      </AppProviders>
    </GoogleOAuthProvider>
  )
}

export default App
