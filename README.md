# sCrypt CLI

A CLI tool to make development of sCrypt faster and easier.

## Installation

```sh
npm install -g scrypt-cli
```

## Usage

### Create a new sCrypt project

```sh
scrypt project my-proj
```

The command creates a new directory `my-proj` which contains a demo sCrypt smart contract along with needed scaffolding. 

Read the projects `README.md` for more info on how to test and deploy the generated smart contract.

### Compile sCrypt smart contracts

```sh
scrypt compile
```

This will search current project for classes extending `SmartContract` and compile them. This will produce a [contract description file](https://github.com/sCrypt-Inc/scryptlib#contract-description-file) for each compiled class which . The files will be stored under the `scrypts` directory.

### Publish project
```sh
scrypt publish
```

This will check the structure of the current project and publish it on NPM.
