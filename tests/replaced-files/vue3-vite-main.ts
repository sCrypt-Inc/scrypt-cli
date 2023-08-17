import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

import { DappVue3Vite } from './contracts/dappVue3Vite'
import artifact from '../artifacts/dappVue3Vite.json'

import { Scrypt, bsv } from 'scrypt-ts'

DappVue3Vite.loadArtifact(artifact)

Scrypt.init({
  apiKey: 'testnet_3OJHoUTWnhTtVGck0T6ZpV2Cx3lcLw0UchOfl4aPtfA8D10Kf',
  network: bsv.Networks.testnet,
})

createApp(App).mount('#app')