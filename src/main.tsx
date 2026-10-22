import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import '@fontsource/plus-jakarta-sans/800.css'
import './design/tokens.css'
import './design/global.css'
import { router } from './app/router'
import { acquireTabLock, TabBlockedScreen } from './app/TabGuard'

const root = createRoot(document.getElementById('root')!)

void acquireTabLock().then((isOnlyTab) => {
  root.render(
    <StrictMode>
      {isOnlyTab ? <RouterProvider router={router} /> : <TabBlockedScreen />}
    </StrictMode>,
  )
})
