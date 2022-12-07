import hre, { artifacts, ethers } from "hardhat";
import { Contract, constants } from "ethers";
import { expect } from "chai";
import { BigNumber, utils } from 'ethers';
import { expandTo18Decimals } from './shared/utilities';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import UniswapV2Router02 from "./V2/UniswapV2Router02.json"

describe("Integration tests", () => {
    let token: Contract;
    let admin: SignerWithAddress;
    let taxReceiver: SignerWithAddress;
    let user0: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    const ROUTER = "0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F";
    const TOTAL_SUPPLY = expandTo18Decimals(6 * 10 ** 12);
    const TEST_AMOUNT = expandTo18Decimals(10000);
    beforeEach(async function () {
        [admin, taxReceiver, user0, user1, user2] = await hre.ethers.getSigners();
        const TokenContract = await hre.ethers.getContractFactory("contracts/HexaFinityTokenUpgradable.sol:HexaFinityTokenUpgradable");
        token = await hre.upgrades.deployProxy(
            TokenContract,
            [
                ROUTER,
                taxReceiver.address
            ]
        );
        await token.deployed();
    });

    it('transfer', async () => {
        await expect(token.transfer(user0.address, TEST_AMOUNT))
            .to.emit(token, 'Transfer')
            .withArgs(admin.address, user0.address, TEST_AMOUNT);
        let transferAmount = expandTo18Decimals(1)
        await token.connect(user0).transfer(user1.address, transferAmount);
        expect(await token.balanceOf(user0.address)).to.eq(TEST_AMOUNT.sub(transferAmount));
    });

    it('addLiquidityToPancakeSwap', async () => {
        const ABI = UniswapV2Router02.abi;
        const PancakeSwap = await hre.ethers.getContractAt(ABI, ROUTER, admin);
        await token.approve(PancakeSwap.address, TEST_AMOUNT);
        await PancakeSwap.addLiquidityETH(token.address, TEST_AMOUNT, 0, 0, admin.address, constants.MaxUint256, {"value": expandTo18Decimals(1)});
        const WETH = await PancakeSwap.WETH();
        await PancakeSwap.swapETHForExactTokens(10**15, [WETH, token.address], user0.address, constants.MaxUint256, {"value": expandTo18Decimals(1)})
    });
});