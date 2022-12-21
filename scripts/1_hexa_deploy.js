/* eslint-disable no-process-exit */
// works for deployment to rinkeby
const { ethers } = require("hardhat");

async function main() {
  // Initialize parameters for contract constructor
  /*
    testnet: 0xD99D1c33F9fC3444f8101754aBC46c52416550D1
    mainnet: 0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F
  */

  const routerAddress = '0xD99D1c33F9fC3444f8101754aBC46c52416550D1'; // pancakeswap v2 router for testnet
  // const routerAddress = "0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F"; // panckaeswap v2 router for mainnet
  const taxReceiverAddress = '0x35a8276acc795618bcfeac47be808d5a7e77ff0a'; // temp tax receiver address

  // const taxReceiverAddress = "0x35a8276acc795618bcfeac47be808d5a7e77ff0a"; // tax receiver address

  // Start Deploying
  console.log("Deploying contracts with the account...");

  const HexaFinityToken = await ethers.getContractFactory("HexaFinityToken");
  const hfToken = await HexaFinityToken.deploy(routerAddress, taxReceiverAddress);

  await hfToken.deployed();


  console.log('HexaFinityToken deployed to:', hfToken.address);

  try {
    await run('verify:verify', {
      address: hfToken.address,
      constructorArguments: [routerAddress, taxReceiverAddress],
    });
    console.log('HexaFinityToken verify success');
  } catch (e) {
    console.log(e);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

  // npx hardhat run --network testnet scripts/1_hexa_deploy.js

  // 0x2ECF506E9317b85Fe3CF4B6DcF2C6795E463C2d7 (v1)
  // 0xcfc7bd6C960814F69DDbBD279043F8ec15dB7EE7 (v2)
  // 0xc4181DA69100fb38fD8276B617502B747FDA734f (v3)
  // 0xC67ff82980F27c67205A1BAE59a2b51594DeA869 (v4)
  // 0x37e8e8010BcBE932d4C3b3880f1aC7198Ac5e2D7 (v5)

      // tenderly test
    // swapExactTokensForTokens
    // 1000000000000000
    // 6806911018854530038215,6803500000000000000000
    // ["0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd","0x2ECF506E9317b85Fe3CF4B6DcF2C6795E463C2d7"]
    // 0xb2EdF179Ba06043d018DF4302E4103822588D114, 0xF773241e5A83b4F1bAf403550c04BDEcdC535a7f
    // 2670430140