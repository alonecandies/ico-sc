import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, parseEther } from "ethers";
import * as chai from "chai";

import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import tokenABI from "../constants/ABI/token.json";

describe("ALCICO", function () {
  let owner: HardhatEthersSigner;
  let alice: HardhatEthersSigner;

  let alcico: any;
  let token: any;
  let usdt: any;

  let aliceTokenContract: Contract;
  let aliceUSDTContract: Contract;

  let alcicoAddress: string;
  let tokenAddress: string;
  let usdtAddress: string;

  beforeEach(async () => {
    await ethers.provider.send("hardhat_reset", []);
    [owner, alice] = await ethers.getSigners();

    token = await ethers.deployContract("Token");
    usdt = await ethers.deployContract("USDT");

    await token.waitForDeployment();
    await usdt.waitForDeployment();

    tokenAddress = await token.getAddress();
    usdtAddress = await usdt.getAddress();

    aliceTokenContract = new ethers.Contract(tokenAddress, tokenABI, alice);
    aliceUSDTContract = new ethers.Contract(usdtAddress, tokenABI, alice);

    const ALCICOFactory = await ethers.getContractFactory("ALCICO");
    alcico = await ALCICOFactory.deploy(2, tokenAddress, owner.address);
    await alcico.waitForDeployment();

    alcicoAddress = await alcico.getAddress();

    await alcico.setUSDTToken(usdtAddress);
    await token.transfer(alcicoAddress, parseEther("200"));
  });

  it("should set right rates and set other rate", async function () {
    expect(await alcico.USDT_rate()).to.equal(2);

    await alcico.setUSDTRate(4);
    expect(await alcico.USDT_rate()).to.equal(4);
  });

  it("should set usdt address and set other usdt address", async function () {
    expect(await alcico.usdtToken()).to.equal(usdtAddress);

    await alcico.setUSDTToken(tokenAddress);
    expect(await alcico.usdtToken()).to.equal(tokenAddress);
  });

  it("should get right token amount by usdt rate", async function () {
    expect(await alcico.getTokenAmountUSDT(100)).to.equal(200);
  });

  it("should buy right amount of tokens by usdt", async function () {
    await usdt.transfer(alice.address, parseEther("100"));
    await aliceUSDTContract.approve(
      alcicoAddress,
      usdt.balanceOf(alice.address)
    );
    await alcico.connect(alice).buyTokenByUSDT(parseEther("100"));

    expect(await token.balanceOf(alice.address)).to.equal(parseEther("200"));
    expect(await usdt.balanceOf(alice.address)).to.equal(0);
    expect(await usdt.balanceOf(alcicoAddress)).to.equal(parseEther("100"));
  });

  it("should return error if buyer don't have enough usdt", async function () {
    await usdt.transfer(alice.address, parseEther("10"));
    await aliceUSDTContract.approve(alcicoAddress, parseEther("15"));
    await expect(
      alcico.connect(alice).buyTokenByUSDT(parseEther("15"))
    ).revertedWith("ERC20: transfer amount exceeds balance");
  });

  it("should return error if contract don't have enough token for sale", async function () {
    await usdt.transfer(alice.address, parseEther("150"));
    await aliceUSDTContract.approve(alcicoAddress, parseEther("150"));
    await expect(
      alcico.connect(alice).buyTokenByUSDT(parseEther("150"))
    ).to.be.revertedWith("Insufficient token for sale");
  });

  it("owner can withdraw usdt from contract", async function () {
    await usdt.transfer(alice.address, parseEther("100"));
    await aliceUSDTContract.approve(alcicoAddress, parseEther("100"));
    await alcico.connect(alice).buyTokenByUSDT(parseEther("100"));
    await alcico.connect(owner).withdrawErc20();
    expect(await usdt.balanceOf(alcicoAddress)).to.equal(0);
    expect(await usdt.balanceOf(owner.address)).to.equal(
      parseEther("500000000")
    );
  });

  it("other can't withdraw usdt from contract", async function () {
    await usdt.transfer(alice.address, parseEther("100"));
    await aliceUSDTContract.approve(alcicoAddress, parseEther("100"));
    await alcico.connect(alice).buyTokenByUSDT(parseEther("100"));
    await expect(alcico.connect(alice).withdrawErc20()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });
});
