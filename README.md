# HexaFinity Token

Name: HexaFinity
Symbol: HEXA
Total supply: 6 trillion
Decimal: 18

Burn rate	0.2%
Tax Rate	0.6%
Holder rewards	0.2%
Liquidity pool	0.6%

## Deploy HexaFinity Token to network and verify

#### BSC Testnet

```shell
npx hardhat run --network testnet scripts/2_hexa_upgradable_deploy.js
npx hardhat verify --network testnet <address_deployed> <constructor arg 1 - router address> <constructor arg 2 - tax receiver address>
```

#### BSC Mainnet

```shell
npx hardhat run --network mainnet scripts/2_hexa_upgradable_deploy.js
npx hardhat verify --network mainnet <address_deployed> <constructor arg 1 - router address> <constructor arg 2 - tax receiver address>
```

## Compile

```shell
npm run compile
```

## Test

```shell
npm run test
```

## Clean

```shell
npm run clean
```

## lint

```shell
npm run lint
```

## lint fix

```shell
npm run lint:fix
```

## format fix

```shell
npm run format:fix
```

## HexaFinityTokenUpgradable address
0xBABE0ef140F02b77b26039a91d3b003F2445CD87
