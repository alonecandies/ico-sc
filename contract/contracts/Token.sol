// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "hardhat/console.sol";

contract Token is ERC20("alonecandies", "ALC"), ERC20Burnable, Ownable {
    uint private cap = 50_000_000_000_000_000 * 10 ** uint256(10);

    constructor() {
        console.log("Token deployed with owner %s, cap %s", msg.sender, cap);
        _mint(msg.sender, cap);
        transferOwnership(msg.sender);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(
            ERC20.totalSupply() * amount <= cap,
            "Flop: cap exceeded"
        );
        _mint(to, amount);
    }
}
