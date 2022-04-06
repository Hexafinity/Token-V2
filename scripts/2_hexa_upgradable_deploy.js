// works for deployment to rinkeby
const { ethers, upgrades } = require('hardhat');

async function main() {
    
  // Initialize parameters for contract constructor
  /*
    testnet: 0xD99D1c33F9fC3444f8101754aBC46c52416550D1
    mainnet: 0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F
  */
  const routerAddress = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"; // pancakeswap v2 router for testnet
  // const routerAddress = "0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F"; // pancakeswap v2 router for mainnet
  const taxReceiverAddress = "0xB3baAc32C0D7b2266043bF735467FFFCbf746f50"; // temp tax receiver address
  // const taxReceiverAddress = "0xdbb5633eee15f0649d8747e6f65abdf0078c264a"; // tax receiver address

  // Start Deploying
  console.log("Deploying contracts with the account...");

  const HexaFinityToken = await ethers.getContractFactory("HexaFinityTokenUpgradable");
  const hfToken = await upgrades.deployProxy(HexaFinityToken, [routerAddress, taxReceiverAddress]);

  await hfToken.deployed();

  console.log("HexaFinityToken deployed to:", hfToken.address);
}
  
main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
