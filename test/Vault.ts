import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, keccak256, parseEther } from "ethers";
import * as chai from "chai";

import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import tokenABI from "../constants/ABI/token.json";
import vaultABI from "../constants/ABI/vault.json";

describe("Vault", function () {
  let owner: HardhatEthersSigner,
    alice: HardhatEthersSigner,
    bob: HardhatEthersSigner,
    carol: HardhatEthersSigner;

  let vault: any;
  let token: any;

  let aliceTokenContract: Contract;
  let aliceVaultContract: Contract;
  let bobVaultContract: Contract;
  let carolVaultContract: Contract;

  let vaultAddress: string;
  let tokenAddress: string;

  beforeEach(async () => {
    await ethers.provider.send("hardhat_reset", []);
    [owner, alice, bob, carol] = await ethers.getSigners();

    vault = await ethers.deployContract("Vault");
    token = await ethers.deployContract("Token");
    await vault.waitForDeployment();
    await token.waitForDeployment();

    await vault.setToken(token);

    vaultAddress = await vault.getAddress();
    tokenAddress = await token.getAddress();

    aliceTokenContract = new ethers.Contract(tokenAddress, tokenABI, alice);

    aliceVaultContract = new ethers.Contract(vaultAddress, vaultABI, alice);

    bobVaultContract = new ethers.Contract(vaultAddress, vaultABI, bob);

    carolVaultContract = new ethers.Contract(vaultAddress, vaultABI, carol);
  });

  ////// Happy Path
  it("Should deposit into the Vault", async () => {
    await token.transfer(alice.address, parseEther((1 * 10 ** 6).toString()));

    await aliceTokenContract.approve(
      vaultAddress,
      await aliceTokenContract.balanceOf(alice.address)
    );
    await aliceVaultContract.deposit(parseEther((500 * 10 ** 3).toString()));

    expect(await token.balanceOf(vaultAddress)).equal(
      parseEther((500 * 10 ** 3).toString())
    );
  });
  it("Should withdraw", async () => {
    //grant withdrawer role to Bob
    let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
    await vault.grantRole(WITHDRAWER_ROLE, bob.address);

    // setter vault functions

    await vault.setIsWithdrawalEnabled(true);
    await vault.setMaximumWithdrawalAmount(parseEther((1 * 10 ** 6).toString()));

    // alice deposit into the vault
    await token.transfer(alice.address, parseEther((1 * 10 ** 6).toString()));

    await aliceTokenContract.approve(
      vaultAddress,
      token.balanceOf(alice.address)
    );
    await aliceVaultContract.deposit(parseEther((500 * 10 ** 3).toString()));

    // bob withdraw into alice address
    await bobVaultContract.withdraw(
      parseEther((300 * 10 ** 3).toString()),
      alice.address
    );

    expect(await token.balanceOf(vaultAddress)).equal(
      parseEther((200 * 10 ** 3).toString())
    );
    expect(await token.balanceOf(alice.address)).equal(
      parseEther((800 * 10 ** 3).toString())
    );
  });
  ///////Unhappy Path/////////
  it("Should not deposit, Insufficient account balance", async () => {
    await token.transfer(alice.address, parseEther((1 * 10 ** 6).toString()));
    aliceTokenContract.approve(vaultAddress, token.balanceOf(alice.address));
    await expect(
      aliceVaultContract.deposit(parseEther((2 * 10 ** 6).toString()))
    ).revertedWith("insufficient balance");
  });
  it("Should not withdraw, Withdraw is not available ", async () => {
    //grant withdrawer role to Bob
    let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
    await vault.grantRole(WITHDRAWER_ROLE, bob.address);

    // setter vault functions

    await vault.setIsWithdrawalEnabled(false);
    await vault.setMaximumWithdrawalAmount(parseEther((1 * 10 ** 6).toString()));

    // alice deposit into the vault
    await token.transfer(alice.address, parseEther((1 * 10 ** 6).toString()));
    await aliceTokenContract.approve(
      vaultAddress,
      token.balanceOf(alice.address)
    );
    await aliceVaultContract.deposit(parseEther((500 * 10 ** 3).toString()));

    // bob withdraw into alice address
    await expect(
      bobVaultContract.withdraw(
        parseEther((300 * 10 ** 3).toString()),
        alice.address
      )
    ).revertedWith("withdrawal is disabled");
  });
  it("Should not withdraw, Exceed maximum amount ", async () => {
    //grant withdrawer role to Bob
    let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
    await vault.grantRole(WITHDRAWER_ROLE, bob.address);

    // setter vault functions

    await vault.setIsWithdrawalEnabled(true);
    await vault.setMaximumWithdrawalAmount(parseEther((1 * 10 ** 3).toString()));

    // alice deposit into the vault
    await token.transfer(alice.address, parseEther((1 * 10 ** 6).toString()));
    await aliceTokenContract.approve(
      vaultAddress,
      token.balanceOf(alice.address)
    );
    await aliceVaultContract.deposit(parseEther((500 * 10 ** 3).toString()));

    // bob withdraw into alice address
    await expect(
      bobVaultContract.withdraw(
        parseEther((2 * 10 ** 3).toString()),
        alice.address
      )
    ).revertedWith("amount exceeds maximum withdrawal amount");
  });
  it("Should not withdraw, Caller is not a withdrawer", async () => {
    //grant withdrawer role to Bob
    let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
    await vault.grantRole(WITHDRAWER_ROLE, bob.address);

    // setter vault functions

    await vault.setIsWithdrawalEnabled(true);
    await vault.setMaximumWithdrawalAmount(parseEther((1 * 10 ** 3).toString()));

    // alice deposit into the vault
    await token.transfer(alice.address, parseEther((1 * 10 ** 6).toString()));
    await aliceTokenContract.approve(
      vaultAddress,
      token.balanceOf(alice.address)
    );
    await aliceVaultContract.deposit(parseEther((500 * 10 ** 3).toString()));

    // bob withdraw into alice address
    await expect(
      carolVaultContract.withdraw(
        parseEther((1 * 10 ** 3).toString()),
        alice.address
      )
    ).revertedWith("withdrawer role required");
  });
  it("Should not withdraw, ERC20: transfer amount exceeds balance", async () => {
    //grant withdrawer role to Bob
    let WITHDRAWER_ROLE = keccak256(Buffer.from("WITHDRAWER_ROLE")).toString();
    await vault.grantRole(WITHDRAWER_ROLE, bob.address);

    // setter vault functions

    await vault.setIsWithdrawalEnabled(true);
    await vault.setMaximumWithdrawalAmount(parseEther((5 * 10 ** 3).toString()));

    // alice deposit into the vault
    await token.transfer(alice.address, parseEther((1 * 10 ** 6).toString()));
    await aliceTokenContract.approve(
      vaultAddress,
      token.balanceOf(alice.address)
    );
    await aliceVaultContract.deposit(parseEther((2 * 10 ** 3).toString()));

    // bob withdraw into alice address
    await expect(
      bobVaultContract.withdraw(
        parseEther((3 * 10 ** 3).toString()),
        alice.address
      )
    ).revertedWith("ERC20: transfer amount exceeds balance");
  });
});
