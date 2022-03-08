const { NETWORK } = require("../services/generator/constants/network")
const { transformAlgoUnitName } = require("../../../utils/helpers")

//    let selectedElement = _element.layer.selectedElement
// THIS IS ALOG FORMATING
//attributesList[_element.layer.name] = selectedElement.name
const processMetadata = (config, metadataArr) => {
  const { chain, project_url, unit_name } = config
  const network = chain.Code

  const processedMetadata = metadataArr.map((assetMetadata) => {
    if (network === NETWORK.ALGO) {
      const { name, description, attributes, edition } = assetMetadata

      const properties = {}

      attributes.forEach((attribute) => {
        const { trait_type, value } = attribute
        properties[trait_type] = value
      })

      console.log("ATTRIBUTES", attributes)

      const unitName = transformAlgoUnitName(unit_name, edition)

      return {
        fileName: name,
        edition,
        unitName,
        standard: "arc69",
        description: description,
        external_url: project_url,
        mime_type: "image/png",
        properties,
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
