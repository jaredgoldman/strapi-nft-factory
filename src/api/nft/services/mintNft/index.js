const { mintAlgoNft } = require("./mintAlgoNft")
const { mintEthNft } = require("./mintEthNft")
const { NETWORK } = require("../generator/constants/network")

const mintNft = async (assetData, config) => {
  const { chain } = config
  const network = chain.Code
  let data

  if (network === NETWORK.ALGO) {
    data = await mintAlgoNft(assetData)
  }
  if (network === NETWORK.ETH) {
    data = await mintEthNft(assetData)
  }
  return data
}

module.expoerts = {
  mintNft,
}
