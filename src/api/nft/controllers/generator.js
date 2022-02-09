const fs = require("fs")
const axios = require("axios")
const path = require("path")

const { buildConfig } = require("../services/buildConfig")
const { getBaseNftAssets } = require("../services/getNftBaseAssets")
const { generateNfts } = require("../services/generator/src/main")
const { asyncForEach } = require("../../../utils/helpers")
const { mintNft } = require("../services/mintNft")

const buildDir = path.join(__dirname, "../../../../.tmp/build/images")

const IFPS_METADATA = {
  description: "test.png",
}

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

const handleNfts = async () => {
  try {
    let metadataArr = []
    const nfts = fs.readdirSync(buildDir, (err) => {
      console.log(err)
    })

    await asyncForEach(nfts, async (fileName) => {
      const nftDir = path.join(buildDir, fileName)
      // upload each nft
      console.log("***** uploading to ipfs *****")
      const metadata = await uploadNft(IFPS_METADATA, nftDir, fileName)
      // get asset url
      console.log("***** retreiving asset source *****")
      const { url } = await getAssetData(metadata)
      // // mint nft with data
      console.log("***** minting nft *****")
      const assetId = await mintNft(url)
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
      await getBaseNftAssets()
      console.log("***** generating nft(s) *****")
      await generateNfts(config)
      ctx.body = await handleNfts()
    } catch (error) {
      console.log("ERROR", error)
    }
  },
}
