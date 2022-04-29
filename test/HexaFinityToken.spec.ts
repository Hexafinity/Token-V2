/* eslint-disable node/no-missing-import */
import chai, { expect } from 'chai';
import { Contract } from 'ethers';
import {
  solidity,
  MockProvider,
  deployContract,
  createFixtureLoader,
} from 'ethereum-waffle';
// import { ecsign } from 'ethereumjs-util';

import {
  expandTo18Decimals,
  getApprovalDigest,
} from './shared/utilities';

import { routerFixture } from './shared/fixtures';

import HexaFinityToken from '../artifacts/contracts/HexaFinityToken.sol/HexaFinityToken.json';

chai.use(solidity);

const TOTAL_SUPPLY = expandTo18Decimals(6 * 10 ** 12);
const TEST_AMOUNT = expandTo18Decimals(10);

describe('HexaFinityToken', () => {
  const provider = new MockProvider({
    ganacheOptions: {
      hardfork: 'istanbul',
      mnemonic:
        'horn horn horn horn horn horn horn horn horn horn horn horn',
      gasLimit: 9999999,
    },
  });
  const [wallet, taxReceiver] = provider.getWallets();
  const loadFixture = createFixtureLoader([wallet]);

  let router: Contract;
  let token: Contract;
  beforeEach(async () => {
    const fixture = await loadFixture(routerFixture);

    router = fixture.router;

    token = await deployContract(wallet, HexaFinityToken, [
      router.address,
      taxReceiver.address,
    ]);
  });

  it('name, symbol, decimals, totalSupply, balanceOf', async () => {
    const name = await token.name();
    expect(name).to.eq('HexaFinity');
    expect(await token.symbol()).to.eq('HEXA');
    expect(await token.decimals()).to.eq(18);
    expect(await token.totalSupply()).to.eq(TOTAL_SUPPLY);
    expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY);
  });
});
