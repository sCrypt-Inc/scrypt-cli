# sCrypt CLI

A CLI tool to make development of sCrypt faster and easier.

## Installation

```sh
npm install -g scrypt-cli
```

## Usage

### Create a new sCrypt smart contract project

```sh
scrypt project my-proj
```
 
 or simply

```sh
scrypt p my-proj
```

The command creates a new directory `my-proj` which contains a demo sCrypt smart contract along with needed scaffolding. 

Read the projects `README.md` for more info on how to test and deploy the generated smart contract.

You can also use the following command to generate a statefull smart contract project:

```sh
scrypt project-statefull my-proj
```

### Create a new sCrypt library

```sh
scrypt project-lib my-lib
```
 
 or simply

```sh
scrypt lib my-lib
```

Similar as the `project` command but the generated project will contain only sCrypt library code, without a smart contract.

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
