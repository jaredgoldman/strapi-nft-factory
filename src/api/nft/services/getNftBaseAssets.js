const { group } = require("console")
const fs = require("fs")
const path = require("path")

const layersDir = path.join(__dirname, "../../../../.tmp/layers")

const handleLayerDirCreated = () => {
  if (fs.existsSync(layersDir)) {
    fs.rmdirSync(layersDir, { recursive: true, force: true })
    fs.mkdirSync(layersDir)
  }
}

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

const getNftBaseAssets = async () => {
  const { collection } = await strapi.db.query(`api::config.config`).findOne({
    populate: true,
  })

  const groupName = collection.Name

  console.log("GROUPNAME", groupName)

  try {
    // const layers = await strapi.db.query(`api::layer.layer`).findMany()
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
      console.log("LAYER NAME", layer.Name)
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

module.exports = async () => {
  try {
    handleLayerDirCreated()
    await getNftBaseAssets()
    // Wait until layers are created before proceeding
    await new Promise((res) => {
      setTimeout(res, 2000)
    })
  } catch (error) {
    console.log(error)
  }
}
