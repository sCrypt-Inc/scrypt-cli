import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';



import { DappAngular } from './contracts/dappAngular'
import artifact from '../artifacts/dappAngular.json'

import { Scrypt, bsv } from 'scrypt-ts'

DappAngular.loadArtifact(artifact)

Scrypt.init({
  apiKey: 'testnet_3OJHoUTWnhTtVGck0T6ZpV2Cx3lcLw0UchOfl4aPtfA8D10Kf',
  network: bsv.Networks.testnet,
})

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
