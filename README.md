# HexaFinity Token
Name: HexaFinity
Symbol: HEXA
Total supply: 600 billion
Decimal: 18
Burn rate: 1%
Tax rate: 2%
Holder rewards: 2%

## Deploy HexaFinity Token to network and verify
#### BSC Testnet
```shell
npx hardhat run --network testnet scripts/1_hexa_deploy.js
npx hardhat verify --network testnet <address_deployed> <constructor arg 1 - router address> <constructor arg 2 - tax receiver address>
```

#### BSC Mainnet
```shell
npx hardhat run --network mainnet scripts/1_hexa_deploy.js
npx hardhat verify --network mainnet <address_deployed> <constructor arg 1 - router address> <constructor arg 2 - tax receiver address>
```

## Test
```shell
npx hardhat test
```

## Clean 
```shell
npx hardhat clean
```