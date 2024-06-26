# sCrypt CLI

A CLI tool to make development of sCrypt faster and easier.

[![Build Status](https://travis-ci.com/sCrypt-Inc/scrypt-cli.svg?branch=master)](https://travis-ci.com/sCrypt-Inc/scrypt-cli)

## Usage

>**Note:**
>Node version 16 or greater is required.

### Create a new sCrypt smart contract project

```sh
npx scrypt-cli project my-proj
```
 
 or simply

```sh
npx scrypt-cli p my-proj
```

The command creates a new directory `my-proj` which contains a demo sCrypt smart contract along with needed scaffolding. 

Read the projects `README.md` for more info on how to test and deploy the generated smart contract.

You can also use the following command to generate a stateful smart contract project:

```sh
npx scrypt-cli p --state my-proj
```

Lastly, you can create an sCrypt library project with the following option:

```sh
npx scrypt-cli p --lib my-lib
```


### Compile sCrypt smart contracts

```sh
npx scrypt-cli compile
```


This will search current project for classes extending `SmartContract` and compile them. This will produce a [contract artifact file](https://github.com/sCrypt-Inc/scryptlib#contract-description-file) for each compiled class. The files will be stored under the `artifacts` directory. 

The command needs to run in the root directory of the project.


### Compile sCrypt Smart Contract under Watch

```sh
npx scrypt-cli compile --watch
```
Initiate smart contract compilation in watch mode. This mode allows you to observe real-time updates and notifications regarding any errors specific to the smart contract compilation phase, which are distinct from TypeScript errors. During watch mode, smart contracts get automatically compiled after a change is made to any of the smart contract source files.

### Compile using the --asm option

```sh
npx scrypt-cli compile --asm
```
The `--asm` option is used to apply inline assembly optimizations. These are defined under the `.asm/` directory in the root of the project (auto genereted when using `--asm` option with the `project` command).
Read more in [the docs](https://docs.scrypt.io/advanced/inline-asm).

### Deploy sCrypt smart contracts

```sh
npx scrypt-cli deploy
```

This will create a deployment script template `deploy.ts` if it doesn't exist yet. If it does it executes it. Projects generated using the sCrypt CLI will already have `deploy.ts` present.


You can also run a deployment script with a different name using the `f` option:
```sh
npx scrypt-cli deploy -f myDeployScript.ts
```

### Verify a deployed smart contract

With the `verify` you can verify that a already deployed output script was produced by the specified sCrypt code.

```sh
npx scrypt-cli verify <scriptHash> <contractPath>
```

The first positional argument is the double-SHA256 hash of the deployed output script, commonly used by block explorers to index scripts. The second one is the path to the file which contains the sCrypt smart contract. Note, that the file must also include all the code it depends on, i.e. third party libraries. 

Using the `network` option, you can specify on which network the contract is deployed. This defaults to `test`, indicating the Bitcoin testnet:

```sh
npx scrypt-cli verify --network main <scriptHash> <contractPath>
```

You can also specify the version of sCrypt used during verification. By default, the command will use the version specified in `package.json`:

```sh
npx scrypt-cli verify -V 0.2.1-beta.9 <scriptHash> <contractPath>
```

### Get system info

When filing an issue a lot of time it's useful to provide information about your system. You can get this information with the following command:

```sh
npx scrypt-cli system
```


### Show version

Show the version of scrypt-cli:

```sh
npx scrypt-cli -v
```

### Using latest version

1. run command with `latest` tag: 

```sh
npx scrypt-cli@latest -v
```

or 

2. clear cache to fetch the latest version: 

```sh
npx clear-npx-cache
npx scrypt-cli -v
```
