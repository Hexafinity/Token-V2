// address for bsc main net
var routerAddress = '0x10ED43C718714eb63d5aA57B78B54704E256024E';

// address for test net
var testRouterAddress = '0xD99D1c33F9fC3444f8101754aBC46c52416550D1';
const HexaFinityToken = artifacts.require("HexaFinityToken");

module.exports = function(deployer) {
	// Arguments are: contract, initialSupply
  // deployer.deploy(HexaFinityToken, routerAddress);
  deployer.deploy(HexaFinityToken, testRouterAddress);
};
