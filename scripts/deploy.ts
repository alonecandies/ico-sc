import { ethers, hardhatArguments } from "hardhat";
import * as Config from "./config";

async function main() {
  await Config.initConfig();
  const network = hardhatArguments.network ? hardhatArguments.network : "dev";
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const token = await ethers.deployContract("Token");
  Config.setConfig(network + ".token", await token.getAddress());
  const vault = await ethers.deployContract("Vault");
  Config.setConfig(network + ".vault", await vault.getAddress());

  console.log("Token address:", await token.getAddress());
  console.log("Vault address:", await vault.getAddress());

  Config.saveConfig();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
