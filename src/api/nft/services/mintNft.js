const algosdk = require("algosdk")
const PROSPECTORS_MNEMONIC = process.env.PROSPECTORS_MNEMONIC
const PURESTAKE_API = process.env.PURESTAKE_API
const ALGO_NODE = process.env.ALGO_NODE
const { waitForConfirmation } = require("../../../utils/helpers")

const mintNft = async (url, metadata, unit) => {
  const strippedFileName = metadata.fileName
    .split("-")
    .join(" ")
    .replace(".png", "")

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
    const note = enc.encode(JSON.stringify({ metadata }))
    const defaultFrozen = false
    const decimals = 0
    const totalIssuance = 1
    const unitName = unit.toString()
    const assetName = strippedFileName
    const assetMetadataHash = undefined
    const manager = address
    const reserve = address
    const freeze = undefined
    const clawback = undefined

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
    console.log("ERROR", error)
  }
}

module.exports = {
  mintNft,
}
