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
const { saveAssetToMediaLibarary, saveNftData } = require("../services/saveNft")
const IPFS_GATEWAY = process.env.IPFS_GATEWAY

const buildDir = path.join(__dirname, "../../../../.tmp/build/images")

/**
 * Gets link to actual asset from IFPS
 * @param {Object}} metadata
 * @return {Object}
 */
const getAssetData = async (metadata) => {
  try {
    const { data } = await axios.get(
      `https://${IPFS_GATEWAY}/ipfs/${metadata.ipnft}/metadata.json`
    )

    return {
      cid: data.image.slice(7),
      fileName: data.name,
      description: data.description,
    }
  } catch (error) {
    console.log("ERROR", error)
  }
}

const transformUnitName = (unitName, editionNum) => {
  const editionString = editionNum.toString()
  if (editionNum < 10) {
    return `${unitName}00${editionString}`
  }
  if (editonNum < 100) {
    return `${unitName}0${editionString}`
  }
  return `${unitName}${editionString}`
}

/**
 * Uploads and mints each NFT
 * @param {Array} metadata``
 * @return {Array} metadataArr
 */
const uploadAndMint = async (config, metadata) => {
  wait(1000)
  const { save_asset: saveAsset, collection, unitName } = config

  try {
    const metadataArr = []
    const nfts = fs.readdirSync(buildDir, (err) => {
      console.log(err)
    })

    await asyncForEach(nfts, async (fileName, i) => {
      if (i < nfts.length) {
        const editionNum = i + 1
        const unitEditionName = transformUnitName(unitName, editionNum)

        console.log(`uploading and minting edition ${editionNum}`)
        const nftDir = path.join(buildDir, fileName)
        const assetMetadata = metadata[i]
        // upload each nft

        console.log("***** uploading to ipfs *****")
        const ifpsMetadata = await uploadNft(assetMetadata, nftDir, fileName)
        // get asset url1
        console.log("***** retreiving asset source *****")
        const { cid } = await getAssetData(ifpsMetadata)
        const httpUrl = `https://${IPFS_GATEWAY}/ipfs/${cid}`
        const url = `ipfs://${cid}`

        console.log("***** minting nft *****")
        const assetId = await mintNft(
          url,
          assetMetadata,
          unitEditionName,
          fileName
        )

        if (saveAsset) {
          console.log("***** nft minted - saving to database *****")
          const upload = await saveAssetToMediaLibarary(nftDir)
          await saveNftData(url, fileName, upload, collection)
        }
        metadataArr.push({
          httpUrl,
          assetId,
        })
      }
      // // mint nft with data
    })
    // console.log("***** returning data *****")
    return metadataArr
  } catch (error) {
    console.log("ERROR", error)
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
