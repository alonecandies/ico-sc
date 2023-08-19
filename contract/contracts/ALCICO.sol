//SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ALCICO is Ownable {
    using SafeERC20 for IERC20;
    address payable public _wallet;
    uint256 public USDT_rate;
    IERC20 public token;
    IERC20 public usdtToken;

    event BuyTokenByUSDT(address buyer, uint256 amount);
    event SetUSDTToken(IERC20 tokenAddress);
    event SetUSDTRate(uint256 newRate);

    constructor(uint256 usdt_rate, IERC20 icotoken, address payable wallet) {
        USDT_rate = usdt_rate;
        token = icotoken;
        _wallet = wallet;
    }

    function setUSDTToken(IERC20 token_address) public onlyOwner {
        usdtToken = token_address;
        emit SetUSDTToken(token_address);
    }

    function setUSDTRate(uint256 new_rate) public onlyOwner {
        USDT_rate = new_rate;
        emit SetUSDTRate(new_rate);
    }

    function buyTokenByUSDT(uint256 USDTAmount) external {
        uint256 amount = getTokenAmountUSDT(USDTAmount);
        require(amount > 0, "Amount is zero");
        require(
            token.balanceOf(address(this)) >= amount,
            "Insufficient token for sale"
        );
        require(
            msg.sender.balance >= USDTAmount,
            "Insufficient account balance"
        );
        SafeERC20.safeTransferFrom(
            usdtToken,
            msg.sender,
            address(this),
            USDTAmount
        );
        SafeERC20.safeTransfer(token, msg.sender, amount);
        emit BuyTokenByUSDT(msg.sender, amount);
    }

    function getTokenAmountUSDT(
        uint256 USDTAmount
    ) public view returns (uint256) {
        return USDTAmount * USDT_rate;
    }

    // deprecated as don't implement buy with native
    // function withdraw() public onlyOwner {
    //     payable(msg.sender).transfer(address(this).balance);
    // }

    function withdrawErc20() public onlyOwner {
        usdtToken.transfer(_wallet, usdtToken.balanceOf(address(this)));
    }
}
