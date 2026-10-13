import { Notifications } from "@mantine/notifications";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { PrimeReactProvider } from "primereact/api";
import { BrowserRouter } from "react-router-dom";

import { Layout } from "@/components";
import { AppProviders } from "./AppProviders";

import "./index.css";
import "./assets/styles/globals.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/schedule/styles.css";
import "@/assets/styles/MantineOverrides.css";
import "primereact/resources/themes/lara-light-cyan/theme.css";

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AppProviders>
        <BrowserRouter>
          <PrimeReactProvider>
            <Notifications />
            <Layout />
          </PrimeReactProvider>
        </BrowserRouter>
      </AppProviders>
    </GoogleOAuthProvider>
  );
}

export default App;