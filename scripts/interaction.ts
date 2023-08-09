require("dotenv").config();
const { Web3 } = require("web3");
const tokenABI = require("../constants/ABI/token.json");

const tokenAddress = "0x085A1e22E1922b0E262A89DA4AE313E7F13fF797";
const privKey = process.env.PRIV_KEY;
const myAddress = "0x1D8197e9C63b1cBf16Ea2896F3EB4241c6A29347";

async function interact() {
  const web3 = new Web3(
    new Web3.providers.HttpProvider(
      "https://data-seed-prebsc-1-s1.binance.org:8545/"
    )
  );
  const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);

  const myBalance = await tokenContract.methods.balanceOf(myAddress).call();

  console.log(myBalance);

  await web3.eth.accounts.wallet.add(privKey);

  const tx = await tokenContract.methods.transfer(myAddress, 1000).send({
    from: myAddress,
    gasLimit: web3.utils.toHex(3100000),
  });

  console.log(tx);
}

interact();
