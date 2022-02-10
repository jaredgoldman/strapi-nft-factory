const fs = require("fs")
const path = require("path")
const { asyncForEach } = require("../../../utils/helpers")

const layersDir = path.join(__dirname, "../../../../.tmp/layers")

const handleLayerDirCreated = () => {
  if (fs.existsSync(layersDir)) {
    fs.rmdirSync(layersDir, { recursive: true, force: true })
    fs.mkdirSync(layersDir)
  }
}

const getNftBaseAssets = async () => {
  // Check for previously  generated layers file and delete if present
  handleLayerDirCreated()

  const { collection } = await strapi.db.query(`api::config.config`).findOne({
    populate: true,
  })

  const groupName = collection.Name

  try {
    const layers = await strapi.db.query(`api::layer.layer`).findMany({
      populate: true,
      where: {
        group: {
          Name: {
            $eq: groupName,
          },
        },
      },
    })

    asyncForEach(layers, async (layer) => {
      const layerDir = path.resolve(layersDir, layer.Name)

      fs.mkdirSync(layerDir, { recursive: true })

      const layerAssets = await strapi.db.query("api::image.image").findMany({
        populate: true,
        where: {
          layer: {
            Name: {
              $eq: layer.Name,
            },
          },
        },
      })

      // go no further if layer has no assets
      if (!layerAssets.length) {
        return
      }

      asyncForEach(layerAssets, async (asset) => {
        // figure out assets rariry
        const rarity = asset.Rarity

        // check for valid rarity
        if (!rarity) {
          console.log(`${asset.Name} has no rarity assigned!`)
        }
        // append on assetDir
        const assetDir = path.join(
          layersDir,
          layer.Name,
          `${asset.Name}#${rarity}.png`
        )
        // create file source
        const source = path.join(
          __dirname,
          `../../../../public/${asset.Asset.url}`
        )
        // read file from file source
        const png = fs.readFileSync(source, (err) => {
          if (err) console.log(error)
        })
        // write file to proper layer
        fs.writeFileSync(assetDir, png, (err) => {
          if (err) console.log(err)
        })
      })
    })
  } catch (error) {
    console.log(error)
  }
}

module.exports = { getNftBaseAssets }
//   try {
//     await getNftBaseAssets()
//     // Wait until layers are created before proceeding
//     await new Promise((res) => {
//       setTimeout(res, 2000)
//     })
//   } catch (error) {
//     console.log(error)
//   }
// }
