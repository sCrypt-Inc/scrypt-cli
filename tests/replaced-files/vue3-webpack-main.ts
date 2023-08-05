import { createApp } from 'vue'
import App from './App.vue'

import { DappVue3Webpack } from './contracts/dappVue3Webpack'
import artifact from '../artifacts/dappVue3Webpack.json'

import { Scrypt, bsv } from 'scrypt-ts'

DappVue3Webpack.loadArtifact(artifact)

Scrypt.init({
  apiKey: 'testnet_3OJHoUTWnhTtVGck0T6ZpV2Cx3lcLw0UchOfl4aPtfA8D10Kf',
  network: bsv.Networks.testnet,
})

createApp(App).mount('#app')