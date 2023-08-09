import Vue from 'vue'
import App from './App.vue'

import './assets/main.css'

import { Counter } from './contracts/counter'
import artifact from '../artifacts/counter.json'

import { Scrypt, bsv } from 'scrypt-ts'

Counter.loadArtifact(artifact)

Scrypt.init({
  apiKey: 'testnet_3OJHoUTWnhTtVGck0T6ZpV2Cx3lcLw0UchOfl4aPtfA8D10Kf',
  network: bsv.Networks.testnet,
})

new Vue({
  render: (h) => h(App)
}).$mount('#app')