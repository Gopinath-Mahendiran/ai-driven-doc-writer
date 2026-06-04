import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Theme } from "@radix-ui/themes";
// import {Theme} from "@radix-ui/themes/styles.css"
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Theme accentColor="crimson" grayColor="sand" radius="large" scaling="95%">
	        <App />
    </Theme>
  </StrictMode>,
)