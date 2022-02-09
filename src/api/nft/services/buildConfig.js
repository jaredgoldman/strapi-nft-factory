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

const getLayerConfiguration = async (collection) => {
  const groupName = collection.Name
  const layers = await strapi.db.query("api::layer.layer").findMany({
    populate: true,
    where: {
      group: {
        Name: {
          $eq: groupName,
        },
      },
    },
  })
  const growEditionSizeTo = 1
  try {
    const layersArr = layers.map((layer) => {
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

    return [{ growEditionSizeTo, layersOrder }]
  } catch (error) {
    console.log(error)
  }
}

const buildConfig = async () => {
  const { collection, chain } = await strapi.db
    .query(`api::config.config`)
    .findOne({
      populate: true,
    })

  const layerConfigurations = await getLayerConfiguration(collection)

  // TODO: add rest of config to be editable via strapi interface

  const config = {
    collection,
    chain,
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

  return config
}

module.exports = { buildConfig }
