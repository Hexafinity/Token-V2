import { Contract, Wallet } from 'ethers';
import { deployContract } from 'ethereum-waffle';

import UniswapFactory from '@uniswap/v2-core/build/UniswapV2Factory.json';
import UniswapRouter from '../../artifacts/contracts/test/UniswapV2Router02.sol/UniswapV2Router02.json';
import WETH9 from '../../artifacts/contracts/test/WETH9.sol/WETH9.json';

const overrides = {
  gasLimit: 9999999,
};

interface RouterFixture {
  router: Contract;
}

export async function routerFixture([
  wallet,
]: Wallet[]): Promise<RouterFixture> {
  // deploy WETH9
  const WETH = await deployContract(wallet, WETH9);

  // deploy factory
  const factory = await deployContract(wallet, UniswapFactory, [
    wallet.address,
  ]);

  // deploy router
  const router = await deployContract(
    wallet,
    UniswapRouter,
    [factory.address, WETH.address],
    overrides,
  );

  return { router };
}
