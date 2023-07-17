# Integrating frontend

We will introduce how to integrate the front end, including connecting wallets, deploying contracts, and calling contracts.


## Initialize the contract class

Use the contract artifact file to initialize the contract class at the front end. 

```ts
import { PROJECT_NAME } from './contracts/PROJECT_FILENAME';
import artifact  from '../artifacts/PROJECT_FILENAME.json');
PROJECT_NAME.loadArtifact(artifact);
```

## Connect wallet

`Signer` is the class that accesses the private key. Private keys can sign transactions to authorize users to perform certain actions.

`Provider` is an abstraction for operations on the blockchain, such as broadcasting transactions. Usually not involved in signing transactions.


Call the `requestAuth()` interface of the signer to request to connect to the wallet.

```ts
try {
    const provider = new ScryptProvider();
    const signer = new SensiletSigner(provider);

    const { isAuthenticated, error } = await signer.requestAuth();
    if (!isAuthenticated) {
        throw new Error(error);
    }

} catch (error) {
    console.error("connect wallet failed", error);
}
```

## Calling contract

Calling the contract requires the following work:

1. Get latest contract instance by Scrypt API `Scrypt.contractApi.getLatestInstance()`. 

2. Create a new contract instance via the `.next()` method of the current instance. Update the state of the new instance state.

3. Call the methods public method on the contract instance to send the transaction to execute the contract on the blockchain.


```ts

// `npm run deploy:contract` to get deployment transaction id
const contract_id = {
  /** The deployment transaction id */
  txId: "65d80537b63bc7fe12280826cdb9fa4424add5c08def0340ddc8444908c03d9e",
  /** The output index */
  outputIndex: 0,
};


const instance = await Scrypt.contractApi.getLatestInstance(
        PROJECT_NAME,
        contract_id
    );

// create the next instance from the current
let nextInstance = instance.next();
// apply updates on the next instance locally
nextInstance.count++;
// call the method of current instance to apply the updates on chain
const { tx: tx_i } = await instance.methods.increment({
    next: {
        instance: nextInstance,
        balance
    }
} as MethodCallOptions<PROJECT_NAME>);
```

## Learn sCrypt

If you want to learn more about sCrypt, go [here](https://scrypt.io/docs).