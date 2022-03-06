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
  return data.image.slice(7)
}

/**
 * Formats unit numbering
 * @param {String} unitName
 * @param {Number} editionNum
 * @return {String} transformedUnitName
 */
const transformUnitName = (unitName, editionNum) => {
  if (editionNum < 10) {
    return `${unitName}00${editionNum.toString()}`
  }
  if (editionNum < 100) {
    return `${unitName}0${editionNum.toString()}`
  }
  return `${unitName}${editionNum.toString()}`
}

// const uploadAndMint = async (nfts, config, metadata) => {
//   const metadataArr = []
//   const { save_asset: saveAsset, collection, unitName } = config

//   const errorArray = await asyncForEach(nfts, async (fileName, i) => {
//     const editionNum = i + 1
//     const unitEditionName = transformUnitName(unitName, editionNum)

//     console.log(`uploading and minting edition ${editionNum}`)
//     const nftDir = path.join(buildDir, fileName)
//     const assetMetadata = metadata[i]

//     console.log("***** uploading to ipfs *****")
//     const ifpsMetadata = await uploadNft(assetMetadata, nftDir, fileName)

//     console.log("***** retreiving asset source *****")
//     const { cid } = await getAssetData(ifpsMetadata)
//     const httpUrl = `https://${IPFS_GATEWAY}/ipfs/${cid}`
//     const url = `ipfs://${cid}`

//     console.log("***** minting nft *****")
//     const assetId = await mintNft(url, assetMetadata, unitEditionName, fileName)

//     if (saveAsset) {
//       console.log("***** nft minted - saving to database *****")
//       const upload = await saveAssetToMediaLibarary(nftDir)
//       await saveNftData(url, fileName, upload, collection)
//     }
//     metadataArr.push({
//       httpUrl,
//       assetId,
//     })
//   })
//   if (errorArray.length) {
//     console.log("***** attempting again on errors *****")
//     const erroredNfts = errorArray.map((index) => nfts[index])
//     const erroredMetadata = errorArray.map((index) => metadata[index])
//     // recursively try uploading errored nfts again
//     uploadAndMint(erroredNfts, config, erroredMetadata)
//   } else {
//     console.log("***** success, no more errors ******")
//     return metadataArr
//   }
// }

/**
 * Uploads and mints each NFT
 * @param {Array} metadata``
 * @return {Array} metadataArr
 */
const uploadAndMintProcess = async (config, metadata) => {
  const { save_asset: saveAsset, collection, unitName } = config
  const nfts = fs.readdirSync(buildDir, (err) => {
    console.log(err)
  })

  nfts.sort((a, b) => {
    return (
      Number(a.slice(8).replace(".png", "")) -
      Number(b.slice(8).replace(".png", ""))
    )
  })

  const ipfsMetadata = await uploadProcess(nfts, metadata)

  const assetUrls = await retreiveAssetProcess(ipfsMetadata)

  const mintedNfts = await mintNftProcess(assetUrls, metadata, unitName)

  return mintedNfts
}

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

const retreiveAssetProcess = async (ipnfts, error = false) => {
  const assetUrlArray = []
  const assetErrorArray = await asyncForEach(ipnfts, async (ipnft, i) => {
    console.log(`fetching asset url for edition ${i + 1}`)
    const assetUrl = await getAssetData(ipnft)
    assetUrlArray.push(assetUrl)
  })
  if (assetErrorArray.length) {
    error = true
    console.log("there were errors")
    const erroredIpnfts = assetErrorArray.map((index) => ipnfts[index])
    console.log("ERRORED IPNFTS ARRAY", erroredIpnfts)
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

const mintNftProcess = async (cids, metadata, unitName, error = false) => {
  const metadataArr = []
  const mintErrorArray = await asyncForEach(cids, async (cid, i) => {
    console.log(`minting edition ${i + 1}`)
    const httpUrl = `https://${IPFS_GATEWAY}/ipfs/${cid}`
    const url = `ipfs://${cid}`
    const assetMetadata = metadata[i]
    const fileName = cid.split("/")[1]
    const editionNum = i + 1
    const unitEditionName = transformUnitName(unitName, editionNum)

    const assetId = await mintNft(url, assetMetadata, unitEditionName, fileName)
    metadataArr.push({
      httpUrl,
      assetId,
    })
  })
  if (mintErrorArray.length) {
    const erroredCids = mintErrorArray.map((index) => cids[index])
    const erroredMetadata = mintErrorArray.map((index) => metadata[index])
    mintNftProcess(erroredCids, erroredMetadata, unitName, true)
  } else {
    if (error) {
      metadata.sort((a, b) => {
        const aString = a.split("-")[1]
        const aNum = Number(aString.replace(".png", ""))
        const bString = b.split("-")[1]
        const bNum = Number(bString.replace(".png", ""))
        return aNum - bNum
      })
    }
    return metadataArr
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

        ctx.body = await uploadAndMintProcess(config, processedMetadata)
      } else {
        ctx.body = "please wait 1 hour before trying again"
      }
    } catch (error) {
      console.log("ERROR", error)
    }
  },
}
