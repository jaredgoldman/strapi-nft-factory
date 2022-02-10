const fs = require("fs")
const axios = require("axios")
const path = require("path")

const { buildConfig } = require("../services/buildConfig")
const { getNftBaseAssets } = require("../services/getNftBaseAssets")
const { generateNfts } = require("../services/generator/src/main")
const { asyncForEach, wait } = require("../../../utils/helpers")
const { uploadNft } = require("../services/uploadNft")
const { mintNft } = require("../services/mintNft")
const { processMetadata } = require("../services/processMetadata")

const buildDir = path.join(__dirname, "../../../../.tmp/build/images")

/**
 * Gets link to actual asset from IFPS
 * @param {Object}} metadata
 * @return {Object} sum
 */
const getAssetData = async (metadata) => {
  try {
    const { data } = await axios.get(
      `https://dweb.link/ipfs/${metadata.ipnft}/metadata.json`
    )

    return {
      url: `https://dweb.link/ipfs${data.image.slice(6)}`,
      fileName: data.name,
      description: data.description,
    }
  } catch (error) {
    console.log("ERROR", error)
  }
}

/**
 * Uploads and mints each NFT
 * @param {Array} metadata``
 * @return {Array} metadataArr
 */
const uploadAndMint = async (metadata) => {
  try {
    const metadataArr = []
    const nfts = fs.readdirSync(buildDir, (err) => {
      console.log(err)
    })

    await asyncForEach(nfts, async (fileName, i) => {
      const nftDir = path.join(buildDir, fileName)
      const assetMetadata = metadata[i]

      // upload each nft
      console.log("***** uploading to ipfs *****")
      const ifpsMetadata = await uploadNft(assetMetadata, nftDir, fileName)

      // get asset url1
      console.log("***** retreiving asset source *****")
      const { url } = await getAssetData(ifpsMetadata)

      // // mint nft with data
      console.log("***** minting nft *****")
      const assetId = await mintNft(url, metadata)

      console.log("***** nft minted! *****")
      metadataArr.push({
        url,
        assetId,
      })
    })
    return metadataArr
  } catch (err) {
    console.log(err)
  }
}

module.exports = {
  async createNft(ctx) {
    try {
      console.log("***** building config*****")
      const config = await buildConfig()

      console.log("***** config built *****")
      await getNftBaseAssets()

      // Wait until layers are created before proceeding
      await wait(1000)

      console.log("***** generating nft(s) *****")
      const metadataArr = await generateNfts(config)

      console.log("***** processing metadata *****")
      const processedMetadata = processMetadata(config, metadataArr)

      ctx.body = await uploadAndMint(processedMetadata)
    } catch (error) {
      console.log("ERROR", error)
    }
  },
}
