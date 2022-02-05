const fs = require("fs")
const axios = require("axios")
const algosdk = require("algosdk")
const path = require("path")
const { NFTStorage, File } = require("nft.storage")
const buildConfig = require("../services/buildConfig")
const getBaseNftAssets = require("../services/getNftBaseAssets")
const generateNfts = require("../services/generator")

const buildDir = path.join(__dirname, "../../../../.tmp/build")
// const layersDir = path.join(__dirname, "../../../../.tmp/layers")
// const configDir = path.join(__dirname, "../../../../.tmp/config.json")

const NFT_STORAGE_API = process.env.PROSPECTORS_API
const PROSPECTORS_MNEMONIC = process.env.PROSPECTORS_MNEMONIC
const PURESTAKE_API = process.env.PURESTAKE_API
const ALGO_NODE = process.env.ALGO_NODE

const IFPS_METADATA = {
  description: "test.png",
}

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

const getCidLink = async (metadata) => {
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

const mintNft = async (url) => {
  const arc69Metadata = require("../../../../.tmp/build/_metadata.json")
  try {
    const algodToken = {
      "X-API-Key": PURESTAKE_API,
    }
    const algodServer = ALGO_NODE
    const algodPort = ""
    const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort)
    const { addr: address, sk } =
      algosdk.mnemonicToSecretKey(PROSPECTORS_MNEMONIC)
    const params = await algodClient.getTransactionParams().do()
    const enc = new TextEncoder()
    const note = enc.encode(JSON.stringify({ arc69Metadata }))
    const defaultFrozen = false
    const decimals = 0
    const totalIssuance = 1
    const unitName = `test`
    const assetName = `test`
    const assetMetadataHash = undefined
    const manager = address
    const reserve = address
    const freeze = undefined
    const clawback = undefined
    console.log(address)

    let txn = algosdk.makeAssetCreateTxnWithSuggestedParams(
      address,
      note,
      totalIssuance,
      decimals,
      defaultFrozen,
      manager,
      reserve,
      freeze,
      clawback,
      unitName,
      assetName,
      url,
      assetMetadataHash,
      params
    )

    const signedTxn = txn.signTxn(sk)
    const tx = await algodClient.sendRawTransaction(signedTxn).do()
    let assetID = null
    await waitForConfirmation(algodClient, tx.txId, 1000)
    const ptx = await algodClient.pendingTransactionInformation(tx.txId).do()
    assetID = ptx["asset-index"]
    return assetID
  } catch (error) {
    console.log(error)
  }
}

const waitForConfirmation = async function (algodClient, txId, timeout) {
  if (algodClient == null || txId == null || timeout < 0) {
    throw new Error("Bad arguments")
  }

  const status = await algodClient.status().do()
  if (status === undefined) {
    throw new Error("Unable to get node status")
  }

  const startround = status["last-round"] + 1
  let currentround = startround

  while (currentround < startround + timeout) {
    const pendingInfo = await algodClient
      .pendingTransactionInformation(txId)
      .do()
    if (pendingInfo !== undefined) {
      if (
        pendingInfo["confirmed-round"] !== null &&
        pendingInfo["confirmed-round"] > 0
      ) {
        //Got the completed Transaction
        return pendingInfo
      } else {
        if (
          pendingInfo["pool-error"] != null &&
          pendingInfo["pool-error"].length > 0
        ) {
          // If there was a pool error, then the transaction has been rejected!
          throw new Error(
            "Transaction " +
              txId +
              " rejected - pool error: " +
              pendingInfo["pool-error"]
          )
        }
      }
    }
    await algodClient.statusAfterBlock(currentround).do()
    currentround++
  }
  throw new Error(
    "Transaction " + txId + " not confirmed after " + timeout + " rounds!"
  )
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
      console.log("METADATA", metadata)
      // get asset url
      console.log("***** retreiving asset source *****")
      const { url } = await getCidLink(metadata)
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

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

module.exports = {
  async createNft(ctx) {
    try {
      console.log("***** building config*****")
      await buildConfig()
      // await strapi.service("api::nft.build-config")
      console.log("***** config built *****")
      await getBaseNftAssets()
      // await strapi.service("api::nft.get-nft-base-assets")
      console.log("***** generating nft(s) *****")
      await generateNfts()
      // ctx.body = await handleNfts()\
    } catch (error) {
      console.log("ERROR", error)
    }
  },
}
