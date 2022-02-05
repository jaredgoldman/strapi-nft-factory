// const basePath = process.cwd()
// const { MODE } = require(`./generator/constants/blend_mode`)
// const { NETWORK } = require(`./generator/constants/network`)
// const network = NETWORK.eth
const fs = require("fs")
const path = require("path")
const configDir = path.join(__dirname, "../../../../.tmp/config.json")

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

const debugLogs = true

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
  console.log("BUILDING CONFIG")
  const getLayerConfiguration = async () => {
    const layers = await strapi.db.query("api::layer.layer").findMany()
    const growEditionSizeTo = 1
    try {
      const layersArr = layers.map((layer) => {
        console.log(layer.Name + " " + layer.layerOrder)
        return {
          name: layer.Name,
          number: layer.layerOrder,
        }
      })
      const layersOrder = layersArr
        .sort((a, b) => a.number - b.number)
        .map((layer) => ({
          name: layer.name,
        }))

      console.log(layersOrder)

      return [{ growEditionSizeTo, layersOrder }]
    } catch (error) {
      console.log(error)
    }
  }

  const layerConfigurations = await getLayerConfiguration()

  // TODO: add rest of config to be editable via strapi interface

  const config = {
    namePrefix,
    description,
    baseUri,
    layerConfigurations,
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

  fs.statSync(configDir, (err, stat) => {
    if (!err) {
      fs.unlink(configDir, (err) => {
        if (err) console.log(err)
      })
    }
    if (err) console.log(err)
  })

  fs.writeFileSync(configDir, JSON.stringify(config), (err) => {
    if (err) console.log(err)
  })
}

module.exports = async () => {
  try {
    buildConfig()
  } catch (error) {
    console.log(error)
  }
}
