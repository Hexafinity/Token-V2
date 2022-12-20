/* eslint-disable no-process-exit */
// works for deployment to bsctest
const { ethers, upgrades } = require('hardhat');

async function main() {
  // Initialize parameters for contract constructor
  /*
    testnet: 0xD99D1c33F9fC3444f8101754aBC46c52416550D1
    mainnet: 0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F
  */
  const routerAddress = '0xD99D1c33F9fC3444f8101754aBC46c52416550D1'; // pancakeswap v2 router for testnet
  // const routerAddress = "0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F"; // pancakeswap v2 router for mainnet
  const taxReceiverAddress = '0x35a8276acc795618bcfeac47be808d5a7e77ff0a'; // temp tax receiver address
  // const taxReceiverAddress = "0x35a8276acc795618bcfeac47be808d5a7e77ff0a"; // tax receiver address

  // Start Deploying
  console.log('Deploying contracts with the account...');

  const HexaFinityToken = await ethers.getContractFactory('HexaFinityTokenUpgradable');
  const hfToken = await upgrades.deployProxy(HexaFinityToken, [routerAddress, taxReceiverAddress]);

  await hfToken.deployed();

  console.log('HexaFinityToken deployed to:', hfToken.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

    // npx hardhat run --network testnet scripts/2_hexa_upgradable_deploy.js
    // npx hardhat verify --network testnet 0x2cc73c3E08836AE5a8cA175eA82642dD423c422a
    // 0x0Da3B4E6127887037E47aEbA0B0f57912539F8Ae
    // 0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd // WBNB

    // test cases
    // without fees
    // https://testnet.bscscan.com/tx/0x5e5ede7748f5e4ce89c91e18250b5605594f956ce9c931807587c02ffba27b1a

    // tenderly test
    // swapExactTokensForTokens
    // 1000000000000000
    // 48941145519549556673952
    // ["0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd","0x021b26d646B0Ad2CC8F814489155afFfA4b3B75d"]
    // 0xb2EdF179Ba06043d018DF4302E4103822588D114, 0xF773241e5A83b4F1bAf403550c04BDEcdC535a7f
    // 2670430140