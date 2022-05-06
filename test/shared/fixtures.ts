import { Contract, Wallet } from 'ethers';
import { deployContract } from 'ethereum-waffle';
import { artifacts } from 'hardhat';

import UniswapFactory from '../V2/UniswapV2Factory.json';
import UniswapRouter from '../V2/UniswapV2Router02.json';

const overrides = {
  gasLimit: 9999999,
};

interface RouterFixture {
  router: Contract;
}

export async function routerFixture([wallet]: Wallet[]): Promise<RouterFixture> {
  const WETH9 = await artifacts.readArtifact('WETH9');

  // deploy WETH9
  const WETH = await deployContract(wallet, WETH9);

  // deploy factory
  const factory = await deployContract(wallet, UniswapFactory, [wallet.address]);

  // deploy router
  const router = await deployContract(wallet, UniswapRouter, [factory.address, WETH.address], overrides);

  return { router };
}
