const basePath = process.cwd()
const { MODE } = require(`${basePath}/constants/blend_mode.js`)
const { NETWORK } = require(`${basePath}/constants/network.js`)

const network = NETWORK.eth

// General metadata for Ethereum
const namePrefix = "Your Collection"
const description = "Remember to replace this description"
const baseUri = "ipfs://NewUriToReplace"

const solanaMetadata = {
  symbol: "YC",
  seller_fee_basis_points: 1000, // Define how much % you want from secondary market sales 1000 = 10%
  external_url: "https://www.youtube.com/c/hashlipsnft",
  creators: [
    {
      address: "7fXNuer5sbZtaTEPhtJ5g5gNtuyRoKkvxdjEjEnPN4mC",
      share: 100,
    },
  ],
}

const shuffleLayerConfigurations = false

const debugLogs = false

const format = {
  width: 512,
  height: 512,
  smoothing: false,
}

const gif = {
  export: false,
  repeat: 0,
  quality: 100,
  delay: 500,
}

const text = {
  only: false,
  color: "#ffffff",
  size: 20,
  xGap: 40,
  yGap: 40,
  align: "left",
  baseline: "top",
  weight: "regular",
  family: "Courier",
  spacer: " => ",
}

const pixelFormat = {
  ratio: 2 / 128,
}

const background = {
  generate: true,
  brightness: "80%",
  static: false,
  default: "#000000",
}

const extraMetadata = {}

const rarityDelimiter = "#"

const uniqueDnaTorrance = 10000

const preview = {
  thumbPerRow: 5,
  thumbWidth: 50,
  imageRatio: format.height / format.width,
  imageName: "preview.png",
}

const preview_gif = {
  numberOfImages: 5,
  order: "ASC", // ASC, DESC, MIXED
  repeat: 0,
  quality: 100,
  delay: 500,
  imageName: "preview.gif",
}

const buildConfig = async () => {
  const defaultEditionSize = 1
  // grab configuration values from db
  const layers = await strapi.db.query("api::layer.layer").findMany()
  const layersArr = layers.map((layer) => {
    return {
      name: layer.Name,
      number: layer.layerOrder,
    }
  })

  const getLayerConfiguration = () => {
    const layersOrder = layersArr
      .sort(a, (b) => a.number + b.number)
      .map((layer) => ({
        name: layer.name,
      }))
    return { defaultEditionSize, layersOrder }
  }

  const config = {
    namePrefix,
    description,
    baseUri,
    layerConfiguration: getLayerConfiguration(),
    solanaMetadata,
    shuffleLayerConfigurations,
    debugLogs,
    format,
    gif,
    text,
    pixelFormat,
    background,
    extraMetadata,
    rarityDelimiter,
    uniqueDnaTorrance,
    preview,
    preview_gif,
  }

  fs.writeFile(configDir, JSON.stringify(config), (err) => {
    if (err) console.log(err)
  })
}

export default buildConfig

// format,
// baseUri,
// description,
// background,
// uniqueDnaTorrance,
// layerConfigurations,
// rarityDelimiter,
// shuffleLayerConfigurations,
// debugLogs,
// extraMetadata,
// text,
// namePrefix,
// network,
// solanaMetadata,
// gif,
