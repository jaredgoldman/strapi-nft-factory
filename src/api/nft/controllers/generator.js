const fs = require("fs")
const axios = require("axios")
const path = require("path")
const mime = require("mime-types")

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
 * @return {Object}
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
 * Saves nft data locally
 * @param {String} url
 * @param {String} fileName
 */
const saveNftData = async (url, fileName, upload) => {
  console.log("FILENAME", fileName)
  strapi.db.query("api::nft.nft").create({
    data: {
      title: fileName,
      url,
      image: upload,
    },
  })
}

/**
 * Uploads nft Asset to dataabase
 * @param {String} nftDir``
 */
saveAssetLocally = async (nftDir) => {
  const name = path.basename(nftDir)
  const buffer = fs.statSync(nftDir)
  const upload = await strapi.plugins.upload.services.upload.upload({
    data: {
      path: "images",
    },
    files: {
      path: nftDir,
      name: name,
      type: mime.lookup(nftDir),
      size: buffer.size,
    },
  })
  return upload
}

/**
 * Uploads and mints each NFT
 * @param {Array} metadata``
 * @return {Array} metadataArr
 */
const uploadAndMint = async (config, metadata) => {
  const { save_asset: saveAsset } = config
  try {
    const metadataArr = []
    const nfts = fs.readdirSync(buildDir, (err) => {
      console.log(err)
    })

    await asyncForEach(nfts, async (fileName, i) => {
      console.log(`uploading and minting edition ${i + 1}`)
      const nftDir = path.join(buildDir, fileName)
      const assetMetadata = metadata[i]
      // upload each nft
      console.log("***** uploading to ipfs *****")
      const ifpsMetadata = await uploadNft(assetMetadata, nftDir, fileName)

      // get asset url1
      console.log("***** retreiving asset source *****")
      const { url } = await getAssetData(ifpsMetadata)

      if (!url) {
        throw new Error("Error uploading to ifps")
      }
      // // mint nft with data
      console.log("***** minting nft *****")

      const assetId = await mintNft(url, assetMetadata)

      if (saveAsset) {
        console.log("***** nft minted - saving to database *****")
        const upload = await saveAssetLocally(nftDir)
        await saveNftData(url, fileName, upload)
      }

      metadataArr.push({
        url,
        assetId,
      })
    })
    console.log("***** returning data *****")
    return metadataArr
  } catch (error) {
    console.log("ERROR")
    // console.log("ERROR", error.response.data)
  }
}

const userCache = {}

/**
 * Cache user as to limit interaction
 * @param {String} userReferer
 * @return {Boolean}
 */
const cacheUser = (userReferer) => {
  if (userCache[userReferer]) {
    // if user has requested service within the last 10 minutes, return false
    if (userCache[userReferer] + 20000 < Date.now()) {
      userCache[userReferer] = Date.now()
      return true
    }
    return false
  }
  // if user is unkown, cache user and current timestamp and move on
  userCache[userReferer] = Date.now()
  return true
}

module.exports = {
  async createNft(ctx) {
    try {
      const user = ctx.request.header.referer
      // cache user or tell to wait
      const runProcess = cacheUser(user)

      if (runProcess) {
        console.log("***** building config*****")
        const config = await buildConfig()

        console.log("***** config built *****")
        await getNftBaseAssets(config)
        // Wait until layers are created before proceeding
        await wait(1000)

        console.log("***** generating nft(s) *****")
        const metadataArr = await generateNfts(config)

        console.log("***** processing metadata *****")
        const processedMetadata = processMetadata(config, metadataArr)

        ctx.body = await uploadAndMint(config, processedMetadata)
      } else {
        ctx.body = "please wait 1 minute before trying again"
      }
    } catch (error) {
      console.log("ERROR", error)
    }
  },
}
