import Head from 'next/head'
import Image from 'next/image'
import Web3Modal from "web3modal"
import { Contract, providers, utils } from "ethers";
import { useEffect, useRef, useState } from 'react'
import styles from '../styles/Home.module.css'
import {NFT_CONTRACT_ABI,NFT_CONTRACT_ADDRESS} from "../constants"
import { getJsonWalletAddress } from 'ethers/lib/utils';


/*
1.connect wallet
2.user already connected the wallet

*/
 

export default function Home() {
  const [isOwner, setIsOwner] = useState(false);
  const [presaleStarted,setPresaleStarted] = useState(false);
  const [presaleEnded,setPresaleEnded] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);

  const web3ModalRef = useRef();


  const connectWallet = async () => {
    try {
    //When used for the first time, it prompts the user to connect their wallet
    //Update 'walletConnected' to be true

    await getProviderOrSigner();
    setWalletConnected(true);

    } catch (err) {
      console.error(err);
    }
  }

  const startPresale = async () => {
    try {
      //It needs a Signer here since this is a "write" a transaction
      const signer = await getProviderOrSigner(true);
      //Create a new instance of the Contract with a signer, which allows update methods
      const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS,NFT_CONTRACT_ABI,signer);
      
      //Call the startPresale from the contract
      const txn = await whitelistContract.startPresale();
      //wait for the transaction to get mined
      await txn.wait();
      
      await checkIfPresaleStarted();

    } catch (error) {
      console.error(error)
    }

  }

  const checkIfPresaleStarted = async () => {
    try {
      //Get the provider from web3Modal,which in this case is MetaMask
      //No need for the Signer here, as it is only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // It connected to the contract using provider,so, it will only have read-only access to the contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS,NFT_CONTRACT_ABI,provider);
      //call the presaleStarted from the contract
      const _presaleStarted = await nftContract.presaleStated();
      if(!_presaleStarted){
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;

    } catch (error) {
      console.error(error);

      return false;
    }
  }




  const checkIfPresaleEnded = async () => {
    try {
      //Get the provider from web3Modal, which in our case is Metamask
      //No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      //It connected to the Contract using a Provider,so it will only have read-only access to the Contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      )
      //This will return a BigNumber because presaleEnded is a uint256
      //This will return a timestamp in seconds
      const _presaleEndTime = await nftContract.presaleEnded();
      //Date.now()/1000 returns the current time in seconds
      const currentTimeInSeconds = Date.now()/ 1000;
      // a Big Number, so we are using the lt(less than function) instead of `<`
      // it compares if the _presaleEndTime timestamp is less than the current tim
      // which means presale has ended
      const hasPresaleEnded = _presaleEndTime.lt(Math.floor(currentTimeInSeconds));
      
      if(hasPresaleEnded){
        setPresaleEnded(true)
      }else{
        setPresaleEnded(false)
      }
      return hasPresaleEnded;
        

    } catch (err) {
      console.error(err);
      return false
    }
  }

  //calls the contract to retrieve the owner
  const getOwner = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ABI,
        NFT_CONTRACT_ADDRESS,
        provider
      )
      //call the owner function from the contract
      const _owner = await nftContract.owner();
      // We will get the signer now to extract the address of the currently connected MetaMask account
      const signer = await getProviderOrSigner(true);
       // Get the address associated to the signer which is connected to  MetaMask
      const userAddress = await signer.getAddress();


      if(userAddress.toLowerCase() === _owner.toLowerCase()){
        setIsOwner(true);

      }
    } catch (err) {
      console.error(err)
    }
  }

  
  




    const getProviderOrSigner = async (needSigner = false) => {
      // Connect to Metamask
      // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);
  
      // If user is not connected to the Rinkeby network, let them know and throw an error
      const { chainId } = await web3Provider.getNetwork();
      if (chainId !== 4) {
        window.alert("Change the network to Rinkeby");
        throw new Error("Change network to Rinkeby");
      }
  
      if (needSigner) {
        const signer = web3Provider.getSigner();
        return signer;
      }
      return web3Provider;
    };

    const onPageLoad = async () => {
      await connectWallet();
      await getOwner();

      const presaleStarted = await checkIfPresaleStarted();

      if(presaleStarted) {
        await checkIfPresaleEnded();
      }

    }

  useEffect(() => {
    if(!walletConnected){
      //if wallet is not connected, create a new instance of Web3Modal and connect the Metamask
        web3ModalRef.current = new Web3Modal({
        network:"rinkeby",
        providerOptions:{},
        //inject with metamask
        disableInjectedProvider:false,
      });
      
      onPageLoad();
    }
  },[])

  function renderBody(){
    if(!walletConnected){
      return(
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      )
    }

    if(isOwner && !presaleStarted){
      //render a button to start the presale
      return(
        <button onClick={startPresale}>Start Presale</button>
      )
    }

    if(!presaleStarted){
      // just say that presale hasn't started yet, come back later
      return(
        <div>Presale has not started yet. Come back later!</div>
      )
    }

    if(presaleStarted && !presaleEnded){
      //allow users to mint in presale
      //they need to be in a whitelist for this to work
    }

    if(presaleEnded){
      //allow users to take part in public sale
    }
  }

  return (
   <div>
     <Head>
       <title>NFT Collection</title>
     </Head>
     <div className={styles.main}>
      {renderBody()}
     </div>
   </div>
  )
}
