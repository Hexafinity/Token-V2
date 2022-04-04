const { expect } = require("chai");
const { ethers, upgrades, getNamedAccounts, deployments } = require("hardhat");
const { time, expectRevert } = require("@openzeppelin/test-helpers");

const { GasLogger } = require("../utils/helper");

require("dotenv").config();

let gasLogger = new GasLogger();

describe.only("HexaFinityToken", function () {
  let owner, alice, bob, carol, darren;
  let hfToken;

  before(async function () {
    [owner, alice, bob, carol, darren] = await ethers.getSigners();
    const HexaFinityToken = await ethers.getContractFactory("HexaFinityToken");
    
    hfToken = await upgrades.deployProxy(HexaFinityToken, [alice, bob]);
    await hfToken.deployed();
    
    // get balance of owner
    console.log("🚀 | balance before transfer", await hfToken.balanceOf(owner.address));
    await hfToken.connect(owner).transfer(carol, 1000);
    console.log("🚀 | balance after transfer", await hfToken.balanceOf(owner.address));
  });

  it("Check received tax amount", async function () {
    await hfToken.connect(carol);
    console.log("🚀 | balance", await hfToken.balanceOf(carol.address));

  });
});
