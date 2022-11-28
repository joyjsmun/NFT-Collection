
export default function handler(req,res) {
    //get the tokenId from the query params
    const tokenId = req.query.tokenId;

    //as all the images are uploaded on github, we can extract the images from github.
    const image_url =
"https://raw.githubusercontent.com/LearnWeb3DAO/NFT-Collection/main/my-app/public/cryptodevs/";

res.status(200).json({
    name:"Cryto Joy Dev #" + tokenId,
    description: "Crypto Joy dev is a collection of developer is crypto",
    image: image_url + tokenId + ".svg",
});

}
