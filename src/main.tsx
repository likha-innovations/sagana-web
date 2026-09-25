import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Providers } from '@/providers'
import { logger } from '@/lib/logger'
import App from './App'
import './index.css'

logger.bootstrap('Sagana Web Console initialized')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>
)
