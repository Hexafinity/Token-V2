/* eslint-disable no-process-exit */
// works for deployment to bsctest
const { ethers, upgrades } = require('hardhat');

async function main() {
  // Initialize parameters for contract constructor
  /*
    testnet: 0xD99D1c33F9fC3444f8101754aBC46c52416550D1
    mainnet: 0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F
  */
  const routerAddress = '0x89F70d27c3661595eA37C131edD55A0B3AFeBC34'; // pancakeswap v2 router for testnet
  // const routerAddress = "0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F"; // pancakeswap v2 router for mainnet
  const taxReceiverAddress = '0xdBB5633eEe15F0649D8747e6F65aBDF0078C264a'; // temp tax receiver address
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
