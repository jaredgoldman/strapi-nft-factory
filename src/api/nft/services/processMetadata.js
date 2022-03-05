const { NETWORK } = require("../services/generator/constants/network")

const processMetadata = (config, metadataArr) => {
  const { chain, project_url } = config
  const network = chain.Code
  const processedMetadata = metadataArr.map((assetMetadata) => {
    if (network === NETWORK.ALGO) {
      return {
        standard: "arc69",
        description: assetMetadata.description,
        external_url: project_url,
        attributes: assetMetadata.attributes,
      }
    }
  })
  if (network === NETWORK.ETH) {
    return assetMetadata
  }
  // if (network === NETWORK.SOL) {
  // }
  return processedMetadata
}

module.exports = { processMetadata }
