const algosdk = require("algosdk")
const PROSPECTORS_MNEMONIC = process.env.PROSPECTORS_MNEMONIC
const PURESTAKE_API = process.env.PURESTAKE_API
const ALGO_NODE = process.env.ALGO_NODE
const { waitForConfirmation } = require("../../../../utils/helpers")

const mintAlgoNft = async (assetData) => {
  const {
    fileName,
    unitName,
    standard,
    description,
    mime_type,
    properties,
    external_url,
    image,
  } = assetData

  const metadata = {
    standard,
    description,
    external_url,
    mime_type,
    properties,
  }

  const url = image

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
    const note = enc.encode(JSON.stringify(metadata))
    const defaultFrozen = false
    const decimals = 0
    const totalIssuance = 1
    const assetName = fileName
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
    await waitForConfirmation(algodClient, tx.txId, 5000)
    const ptx = await algodClient.pendingTransactionInformation(tx.txId).do()
    assetID = ptx["asset-index"]
    return { assetID, ...metadata }
  } catch (error) {
    console.log("ERROR", error)
  }
}

module.exports = {
  mintAlgoNft,
}
