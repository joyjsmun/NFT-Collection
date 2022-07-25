const {ethers} = require("hardhat");
require("dotenv").config({path:".env"});
const {WHITELIST_CONTRACT_ADDRESS,METADATA_URL} = require("./constants");

async function main(){
  //Address of the whitelist contract that I deployed in the previous module
  const whitelistContract = WHITELIST_CONTRACT_ADDRESS;
  //URL from where it can extract the metadata for a NFT
  const metadataURL = METADATA_URL;

  //A contractFactory in the ethers.js is an abstraction used to deploy new smart contracts,
  //so cryptoDevsContract here is a factory for instances of our CryptoDevsContract.
  const cryptoDevsContract = await ethers.getContractFactory("CryptoDevs");

  //deploy the contract
  const deployedCryptoDevsContract = await cryptoDevsContract.deploy(
    metadataURL,
    whitelistContract
  )

  console.log(
    "Contract Address:",
    deployedCryptoDevsContract.address
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
