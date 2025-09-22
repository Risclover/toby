import { Layout } from '@/component'
import { BrowserRouter } from 'react-router-dom'
import "./index.css"
import "./assets/styles/global.css"
import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';

function App() {

  return (
    <>
      <BrowserRouter>
        <MantineProvider>
          <Layout />
        </MantineProvider>
      </BrowserRouter>
    </>
  )
}

export default App
