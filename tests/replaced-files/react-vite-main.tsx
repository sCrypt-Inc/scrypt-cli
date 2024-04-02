import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import { Scrypt, bsv } from 'scrypt-ts'

import { DappReactVite } from './contracts/dappReactVite'
import artifact from '../artifacts/dappReactVite.json'

DappReactVite.loadArtifact(artifact)

Scrypt.init({
  apiKey: 'testnet_3OJHoUTWnhTtVGck0T6ZpV2Cx3lcLw0UchOfl4aPtfA8D10Kf',
  network: bsv.Networks.testnet,
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
