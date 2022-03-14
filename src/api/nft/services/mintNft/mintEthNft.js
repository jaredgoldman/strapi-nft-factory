const API_URL = process.env.ALCHEMY_NODE
const API_KEY = process.env.ALCHEMY_API_KEY
const { createAlchemyWeb3 } = require("@alch/alchemy-web3")
const web3 = createAlchemyWeb3(API_URL)

const mintEthNft = async (assetData) => {}

module.exports = {
  mintEthNft,
}
