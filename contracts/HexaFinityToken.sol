// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./interfaces/IPancakeFactory.sol";
import "./interfaces/IPancakeRouter02.sol";
import "./interfaces/IPancakePair.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @dev Implementation of the {IBEP20} interface.
 */
contract HexaFinityToken is IERC20, Ownable, ReentrancyGuard {

  bool inSwapAndLiquify;
  bool public swapAndLiquifyEnabled = false;

  uint8 private constant _decimals = 18;

  /**
   * @dev Percentage of the static reflection fee.
   */
  uint16 private constant DEFAULT_REWARD_FEE = 2;
  uint16 private constant DEFAULT_LIQUIDITY_FEE = 6;
  uint16 private constant DEFAULT_BURN_FEE = 2;
  uint16 private constant DEFAULT_TAX_FEE = 6;
  /**
   * @dev Percentage of the static reflection fee.
   */
  uint16 public _rewardFee = DEFAULT_REWARD_FEE;
  uint16 private _previousRewardFee = DEFAULT_REWARD_FEE;

  /**
   * @dev Percentage of the liquidity fee.
   */

  uint16 public _liquidityFee = DEFAULT_LIQUIDITY_FEE;
  uint16 private _previousLiquidityFee = DEFAULT_LIQUIDITY_FEE;

  /**
   * @dev Percentage of the auto burn fee.
   */
  uint16 public _burnFee = DEFAULT_BURN_FEE;
  uint16 private _previousBurnFee = DEFAULT_BURN_FEE;

  /**
   * @dev Percentage of the owner fee.
   */
  uint16 public _taxFee = DEFAULT_TAX_FEE;
  uint16 private _previousTaxFee = DEFAULT_TAX_FEE;

  /**
   * @dev Sets the values for {NAME} and {SYMBOL}, and {DECIMALS}
   *
   * All three of these values are constants: they can only be set once during
   * construction.
   */

  string private constant _name = "HexaFinity";
  string private constant _symbol = "HEXA";

  address[] private _excluded;

  address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

  address public taxFeeAddress;

  IPancakeRouter02 public pancakeswapV2Router;
  address public pancakeswapV2Pair;

  uint256 private constant MAX = type(uint256).max;
  uint256 private constant _tTotal = 6000 * 10**9 * 10**_decimals;
  uint256 private _rTotal = (MAX - (MAX % _tTotal));
  uint256 private _tFeeTotal;
  /**
   * @dev denomiator of rate calculation.
   */
  uint256 private constant RATE_DENOMINATOR = 10**3;

  /**
   * @dev The maximum transaction amount to minimize and break the impact of
   * Whale actions.
   */
  uint256 public _maxTxAmount = 30 * 10**9 * 10**_decimals;

  /**
   * @dev The number of tokens sell, to add to the liquidity.
   */
  uint256 public numTokensSellToAddToLiquidity = 3 * 10**9 * 10**_decimals;

  mapping(address => uint256) private _rOwned;
  mapping(address => uint256) private _tOwned;
  mapping(address => mapping(address => uint256)) private _allowances;

  mapping(address => bool) private _isExcludedFromFee;

  mapping(address => bool) private _isExcluded;

  event SwapAndLiquifyEnabledUpdated(bool enabled);
  event LiquidityAdded(uint256 tokenAmount, uint256 bnbAmount);
  event SwapAndLiquifyStatus(string status);
  event SwapAndLiquify(uint256 tokensSwapped, uint256 bnbReceived, uint256 tokensIntoLiquidity);

  modifier lockTheSwap() {
    inSwapAndLiquify = true;
    _;
    inSwapAndLiquify = false;
  }

  constructor(address _router, address _taxFeeAddress) {
    _rOwned[_msgSender()] = _rTotal;

    IPancakeRouter02 _pancakeswapV2Router = IPancakeRouter02(_router);
    // Create a pancakeswap pair for this new token
    pancakeswapV2Pair = IPancakeFactory(_pancakeswapV2Router.factory()).createPair(
      address(this),
      _pancakeswapV2Router.WETH()
    );

    // set the rest of the contract variables
    pancakeswapV2Router = _pancakeswapV2Router;

    // set tax receiver address
    taxFeeAddress = _taxFeeAddress;

    //exclude owner and this contract from fee
    _isExcludedFromFee[owner()] = true;
    _isExcludedFromFee[address(this)] = true;
    _isExcludedFromFee[_taxFeeAddress] = true;

    //exclude tax receiver and burn address from reward
    _isExcluded[taxFeeAddress] = true;
    _isExcluded[BURN_ADDRESS] = true;
    _isExcluded[pancakeswapV2Pair] = true;

    emit Transfer(address(0), _msgSender(), _tTotal);
  }

  function name() external pure returns (string memory) {
    return _name;
  }

  function symbol() external pure returns (string memory) {
    return _symbol;
  }

  function decimals() external pure returns (uint8) {
    return _decimals;
  }

  function totalSupply() external pure override returns (uint256) {
    return _tTotal;
  }

  function balanceOf(address account) public view override returns (uint256) {
    if (_isExcluded[account]) return _tOwned[account];
    return tokenFromReflection(_rOwned[account]);
  }

  function transfer(address recipient, uint256 amount) external override returns (bool) {
    _transfer(_msgSender(), recipient, amount);
    return true;
  }

  function allowance(address owner, address spender) external view override returns (uint256) {
    return _allowances[owner][spender];
  }

  function approve(address spender, uint256 amount) external override returns (bool) {
    _approve(_msgSender(), spender, amount);
    return true;
  }

  function transferFrom(
    address sender,
    address recipient,
    uint256 amount
  ) external override returns (bool) {
    require(_allowances[sender][_msgSender()] >= amount, "Not allowed amount");
    _transfer(sender, recipient, amount);
    _approve(sender, _msgSender(), _allowances[sender][_msgSender()] - amount);
    return true;
  }

  function increaseAllowance(address spender, uint256 addedValue) external virtual returns (bool) {
    _approve(_msgSender(), spender, _allowances[_msgSender()][spender] + addedValue);
    return true;
  }

  function decreaseAllowance(address spender, uint256 subtractedValue)
    external
    virtual
    returns (bool)
  {
    require(_allowances[_msgSender()][spender] >= subtractedValue, "Not allowed amount");
    _approve(_msgSender(), spender, _allowances[_msgSender()][spender] - subtractedValue);
    return true;
  }

  function isExcludedFromReward(address account) external view returns (bool) {
    return _isExcluded[account];
  }

  function totalFees() external view returns (uint256) {
    return _tFeeTotal;
  }

  function totalBurned() external view returns (uint256) {
    return balanceOf(BURN_ADDRESS);
  }

  function reflectionFromToken(uint256 tAmount, bool deductTransferFee)
    public
    view
    returns (uint256)
  {
    require(tAmount <= _tTotal, "Amount must be less than supply");
    if (!deductTransferFee) {
      (uint256 rAmount, , , , , ) = _getValues(tAmount);
      return rAmount;
    } else {
      (, uint256 rTransferAmount, , , , ) = _getValues(tAmount);
      return rTransferAmount;
    }
  }

  function tokenFromReflection(uint256 rAmount) public view returns (uint256) {
    require(rAmount <= _rTotal, "Amount must be less than total reflections");
    uint256 currentRate = _getRate();
    return rAmount / currentRate;
  }

  function excludeFromReward(address account) public onlyOwner {
    require(!_isExcluded[account], "Account is already excluded");
    if (_rOwned[account] > 0) {
      _tOwned[account] = tokenFromReflection(_rOwned[account]);
    }
    _isExcluded[account] = true;
    _excluded.push(account);
  }

  /**
   * @dev limit excluded addresses list to avoid aborting functions with
   * "out-of-gas" exception.
   */
  function includeInReward(address account) external onlyOwner {
    require(_isExcluded[account], "Account is not excluded");
    uint256 length = _excluded.length;
    for (uint256 i = 0; i < length; i++) {
      if (_excluded[i] == account) {
        _excluded[i] = _excluded[_excluded.length - 1];
        _tOwned[account] = 0;
        _isExcluded[account] = false;
        _excluded.pop();
        break;
      }
    }
  }

  function _transferBothExcluded(
    address sender,
    address recipient,
    uint256 tAmount
  ) private {
    (
      uint256 rAmount,
      uint256 rTransferAmount,
      uint256 rFee,
      uint256 tTransferAmount,
      uint256 tFee,
      uint256 tLiquidity
    ) = _getValues(tAmount);
    require(_tOwned[sender] >= tAmount, "Not enough Balance");
    require(_rOwned[sender] >= rAmount, "Not enough Balance");
    _tOwned[sender] = _tOwned[sender] - tAmount;
    _rOwned[sender] = _rOwned[sender] - rAmount;
    _tOwned[recipient] = _tOwned[recipient] + tTransferAmount;
    _rOwned[recipient] = _rOwned[recipient] + rTransferAmount;
    _takeLiquidity(tLiquidity);
    _reflectFee(rFee, tFee);
    emit Transfer(sender, recipient, tTransferAmount);
  }

  //to receive BNB from pancakeswapV2Router when swapping
  receive() external payable {}

  function _reflectFee(uint256 rFee, uint256 tFee) private {
    _rTotal = _rTotal - rFee;
    _tFeeTotal = _tFeeTotal + tFee;
  }

  function _getValues(uint256 tAmount)
    private
    view
    returns (
      uint256,
      uint256,
      uint256,
      uint256,
      uint256,
      uint256
    )
  {
    (uint256 tTransferAmount, uint256 tFee, uint256 tLiquidity) = _getTValues(tAmount);
    (uint256 rAmount, uint256 rTransferAmount, uint256 rFee) = _getRValues(
      tAmount,
      tFee,
      tLiquidity,
      _getRate()
    );
    return (rAmount, rTransferAmount, rFee, tTransferAmount, tFee, tLiquidity);
  }

  function _getTValues(uint256 tAmount)
    private
    view
    returns (
      uint256,
      uint256,
      uint256
    )
  {
    uint256 tFee = calculateTaxFee(tAmount);
    uint256 tLiquidity = calculateLiquidityFee(tAmount);
    uint256 tTransferAmount = tAmount - tFee - tLiquidity;
    return (tTransferAmount, tFee, tLiquidity);
  }

  function _getRValues(
    uint256 tAmount,
    uint256 tFee,
    uint256 tLiquidity,
    uint256 currentRate
  )
    private
    pure
    returns (
      uint256,
      uint256,
      uint256
    )
  {
    uint256 rAmount = tAmount * currentRate;
    uint256 rFee = tFee * currentRate;
    uint256 rLiquidity = tLiquidity * currentRate;
    uint256 rTransferAmount = rAmount - rFee - rLiquidity;
    return (rAmount, rTransferAmount, rFee);
  }

  function _getRate() private view returns (uint256) {
    (uint256 rSupply, uint256 tSupply) = _getCurrentSupply();
    return rSupply / tSupply;
  }

  /**
   * @dev limit excluded addresses list to avoid aborting functions with
   * "out-of-gas" exception.
   */
  function _getCurrentSupply() private view returns (uint256, uint256) {
    uint256 rSupply = _rTotal;
    uint256 tSupply = _tTotal;
    uint256 length = _excluded.length;
    for (uint256 i = 0; i < length; i++) {
      if (_rOwned[_excluded[i]] > rSupply || _tOwned[_excluded[i]] > tSupply)
        return (_rTotal, _tTotal);
      rSupply = rSupply - _rOwned[_excluded[i]];
      tSupply = tSupply - _tOwned[_excluded[i]];
    }
    if (rSupply < _rTotal / _tTotal) return (_rTotal, _tTotal);
    return (rSupply, tSupply);
  }

  function _takeLiquidity(uint256 tLiquidity) private {
    uint256 currentRate = _getRate();
    uint256 rLiquidity = tLiquidity * currentRate;
    _rOwned[address(this)] = _rOwned[address(this)] + rLiquidity;
    if (_isExcluded[address(this)]) _tOwned[address(this)] = _tOwned[address(this)] + tLiquidity;
  }

  function calculateTaxFee(uint256 _amount) private view returns (uint256) {
    return (_amount * _rewardFee) / RATE_DENOMINATOR;
  }

  function calculateLiquidityFee(uint256 _amount) private view returns (uint256) {
    return (_amount * _liquidityFee) / RATE_DENOMINATOR;
  }

  function removeAllFee() private {
    if (_rewardFee == 0 && _liquidityFee == 0 && _taxFee == 0 && _burnFee == 0) return;

    _previousRewardFee = _rewardFee;
    _previousLiquidityFee = _liquidityFee;
    _previousTaxFee = _taxFee;
    _previousBurnFee = _burnFee;

    _rewardFee = 0;
    _liquidityFee = 0;
    _taxFee = 0;
    _burnFee = 0;
  }

  function restoreAllFee() private {
    _rewardFee = _previousRewardFee;
    _liquidityFee = _previousLiquidityFee;
    _burnFee = _previousBurnFee;
    _taxFee = _previousTaxFee;
  }

  function isExcludedFromFee(address account) external view returns (bool) {
    return _isExcludedFromFee[account];
  }

  function _approve(
    address owner,
    address spender,
    uint256 amount
  ) private {
    require(owner != address(0), "BEP20: approve from the zero address");
    require(spender != address(0), "BEP20: approve to the zero address");

    _allowances[owner][spender] = amount;
    emit Approval(owner, spender, amount);
  }

  function _transfer(
    address from, // sender
    address to, // recipient
    uint256 amount
  ) private {
    require(from != address(0), "BEP20: transfer from the zero address");
    require(to != address(0), "BEP20: transfer to the zero address");
    require(amount > 0, "Transfer amount must be greater than zero");

    // is the token balance of this contract address over the min number of
    // tokens that we need to initiate a swap + liquidity lock?
    // also, don't get caught in a circular liquidity event.
    // also, don't swap & liquify if sender is pancakeswap pair.
    uint256 contractTokenBalance = balanceOf(address(this));
    bool overMinTokenBalance = contractTokenBalance >= numTokensSellToAddToLiquidity;
    if (
      overMinTokenBalance && !inSwapAndLiquify && from != pancakeswapV2Pair && swapAndLiquifyEnabled
    ) {
      contractTokenBalance = numTokensSellToAddToLiquidity;
      //add liquidity
      swapAndLiquify(contractTokenBalance);
    }

    //transfer amount, it will take reward, burn, liquidity, tax fee
    _tokenTransfer(from, to, amount);
  }

  function swapAndLiquify(uint256 contractTokenBalance) private lockTheSwap {
    // split the contract balance into halves
    uint256 half = contractTokenBalance / 2;
    uint256 otherHalf = contractTokenBalance - half;

    // capture the contract's current BNB balance.
    // this is so that we can capture exactly the amount of BNB that the
    // swap creates and does not make the liquidity event include any BNB that
    // has been manually sent to the contract
    uint256 initialBalance = address(this).balance;

    // swap tokens for BNB
    swapTokensForBnb(half); // this breaks the BNB

    // how much BNB did we just swap into?
    uint256 newBalance = address(this).balance - initialBalance;

    // add liquidity to Pancakeswap
    addLiquidity(otherHalf, newBalance);

    emit SwapAndLiquify(half, newBalance, otherHalf);
  }

  // @dev The swapAndLiquify function uses this for swap to BNB
  function swapTokensForBnb(uint256 tokenAmount) private returns (bool status) {
    address[] memory path = new address[](2);
    path[0] = address(this);
    path[1] = pancakeswapV2Router.WETH();

    _approve(address(this), address(pancakeswapV2Router), tokenAmount);

    // make the swap
    // A reliable Oracle is to be introduced to avoid possible sandwich attacks.
    try
      pancakeswapV2Router.swapExactTokensForETHSupportingFeeOnTransferTokens(
        tokenAmount,
        0, // accept any amount of BNB
        path,
        address(this),
        block.timestamp
      )
    {
      emit SwapAndLiquifyStatus("Success");
      return true;
    } catch {
      emit SwapAndLiquifyStatus("Failed");
      return false;
    }
  }

  function addLiquidity(uint256 tokenAmount, uint256 bnbAmount) private {
    // approve token transfer to cover all possible scenarios
    _approve(address(this), address(pancakeswapV2Router), tokenAmount);

    // add liquidity and get LP tokens to contract itself
    // A reliable Oracle is to be introduced to avoid possible sandwich attacks.
    pancakeswapV2Router.addLiquidityETH{value: bnbAmount}(
      address(this),
      tokenAmount,
      0, // slippage is unavoidable
      0, // slippage is unavoidable
      address(this),
      block.timestamp
    );
    emit LiquidityAdded(tokenAmount, bnbAmount);
  }

  //this method is responsible for taking all fee, if takeFee is true
  function _tokenTransfer(
    address sender,
    address recipient,
    uint256 amount
  ) private {
    if (_isExcludedFromFee[sender] || _isExcludedFromFee[recipient]) {
      removeAllFee();
    } else {
      require(amount <= _maxTxAmount, "Transfer amount exceeds the maxTxAmount");
    }

    //Calculate burn amount and development amount
    uint256 burnAmt = (amount * _burnFee) / RATE_DENOMINATOR;
    uint256 taxFeeAmt = (amount * _taxFee) / RATE_DENOMINATOR;

    if (_isExcluded[sender] && !_isExcluded[recipient]) {
      _transferFromExcluded(sender, recipient, amount - burnAmt - taxFeeAmt);
    } else if (!_isExcluded[sender] && _isExcluded[recipient]) {
      _transferToExcluded(sender, recipient, amount - burnAmt - taxFeeAmt);
    } else if (_isExcluded[sender] && _isExcluded[recipient]) {
      _transferBothExcluded(sender, recipient, amount - burnAmt - taxFeeAmt);
    } else {
      _transferStandard(sender, recipient, amount - burnAmt - taxFeeAmt);
    }

    //Temporarily remove fees to transfer to burn address and development wallet
    _rewardFee = 0;
    _liquidityFee = 0;

    //Send transfers to burn address and development wallet
    if (burnAmt > 0) _transferToExcluded(sender, BURN_ADDRESS, burnAmt);
    if (taxFeeAmt > 0) _transferToExcluded(sender, taxFeeAddress, taxFeeAmt);

    //Restore reward and liquidity fees
    _rewardFee = _previousRewardFee;
    _liquidityFee = _previousLiquidityFee;

    if (_isExcludedFromFee[sender] || _isExcludedFromFee[recipient]) restoreAllFee();
  }

  function _transferStandard(
    address sender,
    address recipient,
    uint256 tAmount
  ) private {
    (
      uint256 rAmount,
      uint256 rTransferAmount,
      uint256 rFee,
      uint256 tTransferAmount,
      uint256 tFee,
      uint256 tLiquidity
    ) = _getValues(tAmount);
    require(_rOwned[sender] >= rAmount, "Not Enough Balance");
    _rOwned[sender] = _rOwned[sender] - rAmount;
    _rOwned[recipient] = _rOwned[recipient] + rTransferAmount;
    _takeLiquidity(tLiquidity);
    _reflectFee(rFee, tFee);
    emit Transfer(sender, recipient, tTransferAmount);
  }

  function _transferToExcluded(
    address sender,
    address recipient,
    uint256 tAmount
  ) private {
    (
      uint256 rAmount,
      uint256 rTransferAmount,
      uint256 rFee,
      uint256 tTransferAmount,
      uint256 tFee,
      uint256 tLiquidity
    ) = _getValues(tAmount);
    require(_rOwned[sender] >= rAmount, "Not Enough Balance");
    _rOwned[sender] = _rOwned[sender] - rAmount;
    _tOwned[recipient] = _tOwned[recipient] + tTransferAmount;
    _rOwned[recipient] = _rOwned[recipient] + rTransferAmount;
    _takeLiquidity(tLiquidity);
    _reflectFee(rFee, tFee);
    emit Transfer(sender, recipient, tTransferAmount);
  }

  function _transferFromExcluded(
    address sender,
    address recipient,
    uint256 tAmount
  ) private {
    (
      uint256 rAmount,
      uint256 rTransferAmount,
      uint256 rFee,
      uint256 tTransferAmount,
      uint256 tFee,
      uint256 tLiquidity
    ) = _getValues(tAmount);
    require(_tOwned[sender] >= tAmount, "Not Enough Balance");
    require(_rOwned[sender] >= rAmount, "Not Enough Balance");
    _tOwned[sender] = _tOwned[sender] - tAmount;
    _rOwned[sender] = _rOwned[sender] - rAmount;
    _rOwned[recipient] = _rOwned[recipient] + rTransferAmount;
    _takeLiquidity(tLiquidity);
    _reflectFee(rFee, tFee);
    emit Transfer(sender, recipient, tTransferAmount);
  }

  /**
   * @dev The owner can withdraw BNB collected in the contract from
   * `swapAndLiquify` or if someone sends BNB directly to the contract.
   *
   * The swapAndLiquify function converts half of the contractTokenBalance
   * tokens to BNB. For every swapAndLiquify function call, a small amount
   * of BNB remains in the contract. This amount grows over time with the
   * swapAndLiquify function being called throughout the life of the contract.
   *
   * This amount will migrate via the Multi-Signature owner's wallet and
   * be used for charity purposes according to public consent.
   */
  function migrateLeftoverBnb(address payable recipient, uint256 amount)
    external
    onlyOwner
    nonReentrant
  {
    require(recipient != address(0), "BEP20: recipient cannot be the zero address");
    require(
      amount <= address(this).balance,
      "BEP20: amount should not exceed the contract balance."
    );
    recipient.transfer(amount);
  }

  function excludeFromFee(address account) public onlyOwner {
    _isExcludedFromFee[account] = true;
  }

  function includeInFee(address account) external onlyOwner {
    _isExcludedFromFee[account] = false;
  }

  function setRewardFeePercent(uint16 rewardFee) external onlyOwner {
    _rewardFee = rewardFee;
  }

  function setLiquidityFeePercent(uint16 liquidityFee) external onlyOwner {
    _liquidityFee = liquidityFee;
  }

  function setBurnFeePercent(uint16 burnFee) external onlyOwner {
    _burnFee = burnFee;
  }

  function setTaxFeePercent(uint16 taxFee) external onlyOwner {
    _taxFee = taxFee;
  }

  function setTaxFeeAddress(address _taxFeeAddress) external onlyOwner {
    require(_taxFeeAddress != address(0), "HEXA: Address Zero is not allowed");
    excludeFromReward(_taxFeeAddress);
    excludeFromFee(_taxFeeAddress);
    taxFeeAddress = _taxFeeAddress;
  }

  /**
   * @dev Call this function to enable Swap and Liquify.
   */
  function setSwapAndLiquifyEnabled(bool _enabled) external onlyOwner {
    swapAndLiquifyEnabled = _enabled;
    emit SwapAndLiquifyEnabledUpdated(_enabled);
  }

  /**
   * @dev Update the Router address if Pancakeswap upgrades to a
   * newer version.
   */
  function setRouterAddress(address newRouter) external onlyOwner {
    IPancakeRouter02 _newRouter = IPancakeRouter02(newRouter);
    address get_pair = IPancakeFactory(_newRouter.factory()).getPair(
      address(this),
      _newRouter.WETH()
    );
    //checks if pair already exists
    if (get_pair == address(0)) {
      pancakeswapV2Pair = IPancakeFactory(_newRouter.factory()).createPair(
        address(this),
        _newRouter.WETH()
      );
    } else {
      pancakeswapV2Pair = get_pair;
    }
    pancakeswapV2Router = _newRouter;
  }
}
