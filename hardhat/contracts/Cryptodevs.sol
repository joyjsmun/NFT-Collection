 // SPDX-License-Identifier: MIT
  pragma solidity ^0.8.4;

  import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
  import "@openzeppelin/contracts/access/Ownable.sol";
  import "./IWhitelist.sol";



contract CryptoDevs is ERC721Enumerable, Ownable {
    
//@dev _baseTokenURI for computing{tokenURI}
//If set, the resulting URI for each token will be the concatenation of the 'baseURI' and the 'tokenId'.
    string _baseTokenURI;
    
    //Whitelist contract instance
    IWhitelist whitelist;

    //boolean to keep track of whether presale started or not
    bool public presaleStarted;

    //timestamp for when presale would end
    uint256 public presaleEnded;

    //max number of CryptoDevs
    uint256 public maxTokenIds = 20;

    //total number of tokenids minted
    uint256 public tokenIds;

    //_price is the price of one Crypto Dev NFT
    uint256 public  _price = 0.01 ether;

    //_paused is used to pause the contract in case of emergency
    bool public _paused;


    modifier  onlyWhenNotPaused {
        require(!_paused,"The contract currently paused!");
        _;
    }
    
    
    //@dev ERC721 constructor takes in a "name" and a "symbol" to the token colletion.
    //Constructor for Crypto Devs takes in the baseURI to set _baseTokenURI for the collection.ERC721
    //It also initializes and instance of whitelist interface.
    constructor(string memory baseURI, address whitelistContract) ERC721("CryptoDevs","CD"){
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);

        
        //@dev startPreSale starts a presale for the whitelisted address
        function startPreSale() public onlyOwner {  
            presaleStarted = true;
            presaleEnded = block.timestamp + 5 minutes;
            
        }

        //@dev presaleMint allow a user to mint one NFT per transaction during the presale
        // only when the contract is not paused, presaleMint function can excute
        function presaleMint() public payable onlyWhenNotPaused {
            require(presaleStarted && block.timestamp < presaleEnded, "Presale ended");
            //address of the user who is sending this transaction shoud be in the whitelist
            require(whitelist.whitelistedAddress(msg.sender),"You are not in the whitelist");
            require(tokenIds < maxTokenIds,"Exceeded the limit");
            //msg.value - 전송하는 이더리움의 양 , msg.sender - 함수를 호출한 사람
            require(msg.value >= _price, "Ether sent is not correct");

            tokenIds +=1;
            //minting NFT to the sender
            _safeMint(msg.sender, tokenIds);
        }
        
        //@dev mint allows a user to mint 1 NFT per transaction after the presale has ended.
        // only when the contract is not paused, mint function can excute
        function  mint() public payable onlyWhenNotPaused {
            require(presaleStarted && block.timestamp >= presaleEnded, "Presale has not ended")
            require(tokenIds < maxTokenIds,"Exceeded the limit");
            require(msg.value >= _price, "Ether sent is not correct");
            tokenIds +=1;

            _safeMint(msg.sender, tokenIds);

        }
        
        //@dev _baseURI overrides the Openzeppelin's ERC721 implementation which by default returned an empty string for the baseURI
        function _baseURI()  internal view virtual override returns (string memory) {
            return _baseTokenURI;
        }

        //@dev setPused makes the contract paused or unpaused
        function setPaused(bool val) public onlyOwner{
            _paused = val;
        }


       // @dev withdraw sends all the ether in the contract to the owner of the contract
        function withdraw() public onlyOwner {
            address owner = owner();
            //sending the amount of eth that contract has to the owner
            uint256 amount = address(this).balance;
            (bool sent, ) = _owner.call{value: amount}("");
            require(sent, "Failed to send ether");
        }

        //Function to receive Ether.msg.data must be empty
        receive() external payable {}

        //Fallback function is called when msg.data is not empty
        fallback() external payable{}

    }

}