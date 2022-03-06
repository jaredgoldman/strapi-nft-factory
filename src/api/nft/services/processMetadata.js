const { NETWORK } = require("../services/generator/constants/network")

const processMetadata = (config, metadataArr) => {
  const { chain, project_url } = config
  const network = chain.Code
  const processedMetadata = metadataArr.map((assetMetadata) => {
    if (network === NETWORK.ALGO) {
      return {
        fileName: assetMetadata.name,
        standard: "arc69",
        description: assetMetadata.description,
        external_url: project_url,
        mime_type: "image/png",
        properties: assetMetadata.attributes,
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
