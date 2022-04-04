// works for deployment to rinkeby
const { ethers, upgrades } = require('hardhat');

async function main() {
  const HexaFinityToken = await ethers.getContractFactory("HexaFinityToken");

  // Initialize parameters for contract constructor
  const routerAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // pancakeswap v2 router for testnet and mainnet
  const taxReceiverAddress = "0xB3baAc32C0D7b2266043bF735467FFFCbf746f50"; // temp tax receiver address
  // const taxReceiverAddress = "0xdbb5633eee15f0649d8747e6f65abdf0078c264a"; // tax receiver address
  
  // Start Deploying
  console.log("Deploying contracts with the account...");

  const hfToken = await upgrades.deployProxy(HexaFinityToken, [routerAddress, taxReceiverAddress]);
  await hfToken.deployed();

  console.log('HexaFinityToken deployed to:', hfToken.address);

  
  console.log("Account balance:", (await deployer.getBalance()).toString());
}
  
main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
