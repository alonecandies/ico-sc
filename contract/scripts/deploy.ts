import { ethers, hardhatArguments } from "hardhat";
import * as Config from "./config";

async function main() {
  await Config.initConfig();
  const network = hardhatArguments.network ? hardhatArguments.network : "dev";
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const token = await ethers.deployContract("Token");
  Config.setConfig(network + ".token", await token.getAddress());
  const usdt = await ethers.deployContract("USDT");
  Config.setConfig(network + ".usdt", await usdt.getAddress());
  const alcico = await ethers.deployContract("ALCICO");
  Config.setConfig(network + ".alcico", await alcico.getAddress());

  Config.saveConfig();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
