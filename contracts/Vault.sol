// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "hardhat/console.sol";

contract Vault is Ownable, AccessControlEnumerable {
    IERC20 private token;
    uint256 public maximumWithdrawalAmount;
    bool public isWithdrawalEnabled;
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");

    function setIsWithdrawalEnabled(
        bool _isWithdrawalEnabled
    ) external onlyOwner {
        isWithdrawalEnabled = _isWithdrawalEnabled;
    }

    function setMaximumWithdrawalAmount(
        uint256 _maximumWithdrawalAmount
    ) external onlyOwner {
        maximumWithdrawalAmount = _maximumWithdrawalAmount;
    }

    function setToken(IERC20 _token) external onlyOwner {
        token = _token;
    }

    constructor() {
        console.log("Vault deployed with owner %s", msg.sender);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function withdraw(uint256 _amount, address _to) external onlyWithdrawers {
        require(isWithdrawalEnabled, "withdrawal is disabled");
        require(
            hasRole(WITHDRAWER_ROLE, msg.sender),
            "withdrawer role required"
        );
        require(
            _amount <= maximumWithdrawalAmount,
            "amount exceeds maximum withdrawal amount"
        );
        token.transfer(_to, _amount);
    }

    function deposit(uint256 _amount) external {
        require(token.balanceOf(msg.sender) >= _amount, "insufficient balance");
        SafeERC20.safeTransferFrom(token, msg.sender, address(this), _amount);
    }

    modifier onlyWithdrawers() {
        require(
            owner() == msg.sender || hasRole(WITHDRAWER_ROLE, msg.sender),
            "withdrawer role required"
        );
        _;
    }
}
