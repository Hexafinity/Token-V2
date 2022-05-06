/* eslint-disable no-process-exit */
// works for deployment to rinkeby
const { ethers, upgrades } = require('hardhat');

async function main() {
  // Initialize parameters for contract constructor
  /*
    testnet: 0x89F70d27c3661595eA37C131edD55A0B3AFeBC34
    mainnet: 0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F
  */
  const routerAddress = '0x89F70d27c3661595eA37C131edD55A0B3AFeBC34'; // HexaFinityRouter for testnet
  // const routerAddress = "0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F"; // HexaFinityRouter for mainnet
  const taxReceiverAddress = '0xe5D1cb60cb065bf23d3022D02a205D829Feb9831'; // temp tax receiver address
  // const taxReceiverAddress = "0xdbb5633eee15f0649d8747e6f65abdf0078c264a"; // tax receiver address

  // Start Deploying
  console.log('Deploying contracts with the account...');

  const HexaFinityToken = await ethers.getContractFactory('HexaFinityToken');
  const hfToken = await HexaFinityToken.deploy(routerAddress, taxReceiverAddress);

  await hfToken.deployed();

  console.log('HexaFinityToken deployed to:', hfToken.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
