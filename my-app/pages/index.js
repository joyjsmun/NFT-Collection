import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'
import styles from '../styles/Home.module.css'
import Web3Modal from "web3modal";
import { providers,Contract, utils } from 'ethers';
import {abi,NFT_CONTRACT_ADDRESS} from "../constants";



export default function Home(){
  const [presaleStarted,setPresaleStarted] = useState(false);
  const [presaleEnded,setPresaleEnded] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  //tokenIdsMinted keep track of the number of tokenIds that have minted
  const [tokenIdsMinted,setTokenIdsMinted] = useState('0');
  const [loading,setLoading] = useState(false);
  //check if the currently connected metamask wallet is the owner of the contract or not
  const [isOwner,setIsOwner] = useState(false);
  //Create a reference to the web3 modal (used for connecting to metamaks) which persists as long as the page is open
  const web3ModalRef = useRef();
  


  const presaleMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,signer);
      const tx = await nftContract.presaleMint({
        //value signifies the cost of one crypto dev which is "0.001" eth.
        //we are parsing '0.01' string to ether using the utils library from ethers.js
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
    } catch (err) {
      console.error(err);
    }
  }

  const publicMint = async () => {
    try {

      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,signer);
      const tx = await nftContract.mint({
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!")
      
    } catch (err) {
      console.error(err)
    }
  }

  const startPresale = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,signer);
      //call the startPresale from the contract
      const tx = await nftContract.startPresale();
      setLoading(true);
      //wait fro the transaction to get mined
      await tx.wait();
      setLoading(false);
      // set the presale started to true
      await checkIfPresaleStarted();
    } catch (err) {
      console.error(err);
    }
  }

  const checkIfPresaleStarted = async () => {
    try {
        const provider = await getProviderOrSigner();
        // get an instance of your nft contract
        const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,provider); 
        const _presaleStarted = await nftContract.presaleStarted();
        if(!_presaleStarted) {
          await getOwner();
        }
        setPresaleStarted(_presaleStarted);
        return _presaleStarted;

    } catch (err) {
      console.error(err);
    }
  };

  const checkIfPresaleEnded = async () =>{
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,provider);
      const _presaleEnded = await nftContract.presaleEnded();
      //_presaleEnded is a Big Number, so we are using the lt(less than function) instead of '<'
      // Date.now()/1000 returns the current tiem in seconds
      // we compare if the _presaleEnded timestamp is less than the current time
      // which means presale has ended
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now()/1000));
      if(hasEnded){
        setPresaleEnded(true);
      }else{
        setPresaleEnded(false);
      }
      
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  // call the contract to retrieve the owner
  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,provider);
      //call the owner function from the contract
      const _owner = await nftContract.owner(); 
      //we will get the singer now to extract the address of the currently connected metamask account
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      if(address.toLowerCase() === _owner.toLowerCase()){
        setIsOwner(true);
      }


    } catch (err) {
      console.error(err.message);
    }
  }


  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.log(err);
    }

  }

  //gets the number of tokenIds that have been minted
  const getTokenIdsMinted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS,abi,provider);
      const _tokenIds = await nftContract.tokenIds();
      setTokenIdsMinted(_tokenIds.toString());

    } catch (err) {
      console.error(err);
    }
  }

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const {chainId} = await web3Provider.getNetwork();
    if(chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli");
    }

    if(needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }


  useEffect(() => {
    if(!walletConnected){
      web3ModalRef.current = new Web3Modal({
        network:"goerli",
        providerOptions:{},
        disableInjectedProvider:false,
      });
      connectWallet();

      const _presaleStarted = checkIfPresaleStarted();
      if(_presaleStarted) {
        checkIfPresaleEnded();
      }

      getTokenIdsMinted();

      //set an interval which gets called every 5 seconds to check presale has ended
      const presaleEndedInterval = setInterval(async function(){
        const _presaleStarted = await checkIfPresaleStarted();
        if(_presaleStarted){
          const _presaleEnded = await checkIfPresaleEnded();
          if(_presaleEnded){
            clearInterval(presaleEndedInterval);
          }
        }
      },5*1000);
      //set an interval to get the number of token Ids minted every 5 seconds
    setInterval(async function(){
      await getTokenIdsMinted();
    },5*1000);
    }
  },[]);

  //returns a button based on the state of the dapp
  const renderButton = () => {
    if(!walletConnected){
      return(
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      )
    }

    if(loading){
      return <button className={styles.button}>Loading...</button>
    }

    //If connected user is the owner, and presale hasn't started yet, allow them to start the presale
if(isOwner && !presaleStarted){
  return (
    <button className={styles.button} onClick={startPresale}>
      Start Presale!!!
    </button>
  )
}

//If connected user is not the owner but presale hasn't started yet, tell them that
if(!presaleStarted){
  return(
    <div>
      <div className={styles.description}>Presale hasn't started yet!!</div>
    </div>
  )
}


if(presaleStarted && !presaleEnded){
  return(
    <div>
      <div className={styles.description}>
      Presale has started!!! If your address is whitelisted, Mint a Crypto Dev 🥳
      </div>
      <button className={styles.button} onClick={presaleMint}>
        Pre-sale Mint!!! 🚀
      </button>
    </div>
  )
}

if(presaleStarted && presaleEnded){
  return(
    <button className={styles.button} onClick={publicMint}>
      Public Mint!!! 🚀
    </button>
  )
}

  }


  return(
    <div>
      <Head>
        <title>Crypto Devs NFT</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href='/favicon.ico' />
      </Head>
      <div className={styles.main}>
       <div>
         <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
         <div className={styles.description}>
           It's an NFT collection for devleopers in Crypto.
         </div>
         <div className={styles.description}>
           {tokenIdsMinted}/20 have been minted
         </div>
         {renderButton()}
       </div>
       <div>
         <img className={styles.image} src="./cryptodevs/0.svg" />
       </div>
      </div>
    </div>
  )
}
