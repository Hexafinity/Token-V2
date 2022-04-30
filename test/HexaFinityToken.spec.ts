/* eslint-disable node/no-missing-import */
import chai, { expect } from 'chai';
import { Contract, constants } from 'ethers';
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
const TEST_AMOUNT = expandTo18Decimals(10000);

describe('HexaFinityToken', () => {
  const provider = new MockProvider({
    ganacheOptions: {
      hardfork: 'istanbul',
      mnemonic:
        'horn horn horn horn horn horn horn horn horn horn horn horn',
      gasLimit: 9999999,
    },
  });
  const [wallet, taxReceiver, other] = provider.getWallets();
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
    expect(await token.name()).to.eq('HexaFinity');
    expect(await token.symbol()).to.eq('HEXA');
    expect(await token.decimals()).to.eq(18);
    expect(await token.totalSupply()).to.eq(TOTAL_SUPPLY);
    expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY);
  });

  it('approve', async () => {
    await expect(token.approve(other.address, TEST_AMOUNT))
      .to.emit(token, 'Approval')
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.allowance(wallet.address, other.address)).to.eq(
      TEST_AMOUNT,
    );
  });

  it('transfer', async () => {
    await expect(token.transfer(other.address, TEST_AMOUNT))
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.balanceOf(wallet.address)).to.eq(
      TOTAL_SUPPLY.sub(TEST_AMOUNT),
    );
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT);
  });

  it('transfer:fail', async () => {
    await expect(token.transfer(other.address, TOTAL_SUPPLY.add(1))).to
      .be.reverted;
    await expect(token.connect(other).transfer(wallet.address, 1)).to.be
      .reverted;
  });

  it('transferFrom', async () => {
    await token.approve(other.address, TEST_AMOUNT);
    await expect(
      token
        .connect(other)
        .transferFrom(wallet.address, other.address, TEST_AMOUNT),
    )
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.allowance(wallet.address, other.address)).to.eq(
      0,
    );
    expect(await token.balanceOf(wallet.address)).to.eq(
      TOTAL_SUPPLY.sub(TEST_AMOUNT),
    );
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT);
  });

  it('transferFrom:max', async () => {
    await token.approve(other.address, constants.MaxUint256);
    await expect(
      token
        .connect(other)
        .transferFrom(wallet.address, other.address, TEST_AMOUNT),
    )
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.allowance(wallet.address, other.address)).to.eq(
      constants.MaxUint256.sub(TEST_AMOUNT),
    );
    expect(await token.balanceOf(wallet.address)).to.eq(
      TOTAL_SUPPLY.sub(TEST_AMOUNT),
    );
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT);
  });

  it('increaseAllowance, decreaseAllowance', async () => {
    await expect(token.increaseAllowance(other.address, TEST_AMOUNT))
      .to.emit(token, 'Approval')
      .withArgs(wallet.address, other.address, TEST_AMOUNT);
    expect(await token.allowance(wallet.address, other.address)).to.eq(
      TEST_AMOUNT,
    );
    await expect(token.decreaseAllowance(other.address, TEST_AMOUNT))
      .to.emit(token, 'Approval')
      .withArgs(wallet.address, other.address, 0);
    expect(await token.allowance(wallet.address, other.address)).to.eq(
      0,
    );
  });

  it('includeInReward, excludeFromReward, isExcludedFromReward', async () => {
    expect(await token.isExcludedFromReward(other.address)).to.eq(
      false,
    );
    expect(await token.isExcludedFromReward(taxReceiver.address)).to.eq(
      true,
    );
    await token.excludeFromReward(other.address);
    expect(await token.isExcludedFromReward(other.address)).to.eq(true);
    await token.includeInReward(other.address);
    expect(await token.isExcludedFromReward(other.address)).to.eq(
      false,
    );
  });

  it('includeInFee, excludeFromFee, isExcludedFromFee', async () => {
    expect(await token.isExcludedFromFee(other.address)).to.eq(false);
    expect(await token.isExcludedFromFee(wallet.address)).to.eq(true);
    expect(await token.isExcludedFromFee(taxReceiver.address)).to.eq(
      true,
    );
    await token.excludeFromFee(other.address);
    expect(await token.isExcludedFromFee(other.address)).to.eq(true);
    await token.includeInFee(other.address);
    expect(await token.isExcludedFromFee(other.address)).to.eq(false);
  });

  it('setTaxReceiverAddress', async () => {
    await token.setTaxReceiverAddress(other.address);
    expect(await token.isExcludedFromReward(other.address)).to.eq(true);
    expect(await token.isExcludedFromFee(other.address)).to.eq(true);
  });

  it('setSwapAndLiquifyEnabled', async () => {
    expect(await token.setSwapAndLiquifyEnabled(false))
      .to.emit(token, 'SwapAndLiquifyEnabledUpdated')
      .withArgs(false);
  });
});
