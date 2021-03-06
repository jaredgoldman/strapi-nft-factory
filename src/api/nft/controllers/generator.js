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
 * @param {string}} ipnft
 * @return {string} assetUrl
 */
const getAssetData = async (ipnft) => {
  const { data } = await axios.get(
    `https://${IPFS_GATEWAY}/ipfs/${ipnft}/metadata.json`
  )
  return { ipnft, ...data }
}

/**
 * Proceed with saving, retrieving, minting and saving assets locally
 * @param {Object} config
 * @param {Array} metadata
 * @returns {Array} mintedNfts
 */
const uploadAndMintProcess = async (config, metadata) => {
  const { save_asset: saveAsset, collection } = config
  const nfts = fs.readdirSync(buildDir, (err) => {
    console.log(err)
  })

  nfts.sort((a, b) => {
    return (
      Number(a.split("-")[1].replace(".png", "")) -
      Number(b.split("-")[1].replace(".png", ""))
    )
  })

  const ipfsMetadata = await uploadProcess(nfts, metadata)

  const assetsData = await retreiveAssetProcess(ipfsMetadata)

  const mintedNfts = await mintNftProcess(assetsData, metadata)

  if (saveAsset) {
    console.log("***** saving asset locally *****")
    saveAssetLocallyProcess(assetsData, nfts, collection)
  }

  return mintedNfts
}

/**
 * Proceed with saving, retrieving, minting and saving assets locally
 * @param {Array} assetsData
 * @param {Array} nfts
 * @param {String} collection
 */
const saveAssetLocallyProcess = async (assetsData, nfts, collection) => {
  await asyncForEach(nfts, async (fileName, i) => {
    const assetData = assetsData[i]
    const { image } = assetData
    const nftPath = path.join(buildDir, fileName)
    const upload = await saveAssetToMediaLibarary(nftPath)
    saveNftData(image, fileName, upload, collection)
  })
}

/**
 * Save asset to media library and create instance in NFT collection
 * @param {Array} nfts
 * @param {Array} metadata
 * @returns {Array} ifpsMetadataArray
 */
const uploadProcess = async (nfts, metadata) => {
  const ifpsMetadataArray = []
  const uploadErrorArray = await asyncForEach(nfts, async (fileName, i) => {
    console.log(`uploading edition ${i + 1}`)
    const nftDir = path.join(buildDir, fileName)
    const assetMetadata = metadata[i]
    const { ipnft } = await uploadNft(assetMetadata, nftDir, fileName)
    ifpsMetadataArray.push(ipnft)
  })
  if (uploadErrorArray.length) {
    // TODO: add error fallback here
  } else {
    return ifpsMetadataArray
  }
}

/**
 * Retreive asset image link from IPFS gateway
 * @param {Array} ipnfts
 * @param {Boolean} error
 * @returns {Array} assetUrlArray
 */
const retreiveAssetProcess = async (ipnfts, error = false) => {
  const assetUrlArray = []
  const assetErrorArray = await asyncForEach(ipnfts, async (ipnft, i) => {
    console.log(`fetching asset url for edition ${i + 1}`)
    const assetData = await getAssetData(ipnft)
    assetUrlArray.push(assetData)
  })
  if (assetErrorArray.length) {
    // add recursive case to deal with errors - mainly network timeouts
    console.log("ERRORED ARRAY", assetErrorArray)
    error = true
    console.log("handling asset source errors")
    const erroredIpnfts = assetErrorArray.map((index) => ipnfts[index])
    retreiveAssetProcess(erroredIpnfts, true)
  } else {
    if (error) {
      assetUrlArray.sort((a, b) => {
        const aString = a.split("-")[1]
        const aNum = Number(aString.replace(".png", ""))
        const bString = b.split("-")[1]
        const bNum = Number(bString.replace(".png", ""))
        return aNum - bNum
      })
    }
    return assetUrlArray
  }
}

/**
 * Mint each nft on desired blockchain
 * @param {Array} assetsData
 * @param {Array} metaData
 * @param {Boolean} error
 * @return {Array} metadataArr
 */
const mintNftProcess = async (assetsData, metadata, error = false) => {
  const metadataArr = []
  await asyncForEach(assetsData, async (assetData, i) => {
    const { image } = assetData

    const assetMetadata = { ...metadata[i], ...assetData }

    const cidWithImage = image.slice(7)

    const editionNum = i + 1
    console.log(`minting edition ${editionNum}`)

    const httpUrl = `https://${IPFS_GATEWAY}/ipfs/${cidWithImage}`

    const nftMetadata = await mintNft(assetMetadata)

    metadataArr.push({
      httpUrl,
      ...nftMetadata,
    })
  })
  return metadataArr
}

const userCache = {}

/**
 * Cache user as to limit interaction
 * @param {String} userReferer
 * @return {Boolean}
 */
const cacheUser = (userReferer) => {
  if (userCache[userReferer]) {
    // if user has requested service within the last hour, return false
    if (userCache[userReferer] + 36000000 < Date.now()) {
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

        const mintedAssets = await uploadAndMintProcess(
          config,
          processedMetadata
        )
        ctx.body = mintedAssets
      } else {
        ctx.body = "please wait 1 hour before trying again"
      }
    } catch (error) {
      console.log("ERROR", error)
    }
  },
}
