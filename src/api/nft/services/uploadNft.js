const { NFTStorage, File } = require("nft.storage")
const fs = require("fs")
const NFT_STORAGE_API = process.env.PROSPECTORS_API

const uploadNft = async (metadata, dir, fileName) => {
  try {
    const { description } = metadata
    const fileType = "png"
    const client = new NFTStorage({ token: NFT_STORAGE_API })
    return await client.store({
      name: fileName,
      description: description,
      image: new File([fs.readFileSync(dir)], `${fileName}`, {
        type: `image/${fileType}`,
      }),
    })
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  uploadNft,
}
