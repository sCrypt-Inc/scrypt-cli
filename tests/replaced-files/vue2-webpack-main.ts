import Vue from 'vue'
import App from './App.vue'

import { DappVue2Webpack } from './contracts/dappVue2Webpack'
import artifact from '../artifacts/dappVue2Webpack.json'

import { Scrypt, bsv } from 'scrypt-ts'

DappVue2Webpack.loadArtifact(artifact)

Scrypt.init({
  apiKey: 'testnet_3OJHoUTWnhTtVGck0T6ZpV2Cx3lcLw0UchOfl4aPtfA8D10Kf',
  network: bsv.Networks.testnet,
})

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')