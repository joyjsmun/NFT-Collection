 // SPDX-License-Identifier: MIT
  pragma solidity ^0.8.4;

  import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
  import "@openzeppelin/contracts/access/Ownable.sol";
  import "./IWhitelist.sol";



contract CryptoDevs is ERC721Enumerable, Ownable {
    
//@dev _baseTokenURI for computing{tokenURI}
//If set, the resulting URI for each token will be the concatenation of the 'baseURI' and the 'tokenId'.

    string _baseTokenURI;
    IWhitelist whitelist;

    bool public presaleStarted;

    uint256 public presaleEnded;
    
    //@dev ERC721 constructor takes in a "name" and a "symbol" to the token colletion.
    //Constructor for Crypto Devs takes in the baseURI to set _baseTokenURI for the collection.ERC721
    //It also initializes and instance of whitelist interface.
    constructor(string memory _baseURI, address whitelistContract) ERC721("CryptoDevs","CD"){
        _baseTokenURI = _baseURI;
        whitelist = IWhitelist(whitelistContract);

        
        //@dev startPreSale starts a presale for the whitelisted address
        function startPreSale() public onlyOwner {  
            presaleStarted = true;
            presaleEnded = block.timestamp + 5 minutes;
            
        }

        //@dev presaleMint allow a user to mint one NFT per transaction during the presale
        function presaleMint() public payable {
            
        }
        
        //@dev mint allows a user to mint 1 NFT per transaction after the presale has ended.
        function  mint() public payable {
            
        }

    }

}