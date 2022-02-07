const fs = require("fs")
const path = require("path")

const layersDir = path.join(__dirname, "../../../../.tmp/layers")

// const handleLayerDirCreated = () => {
//   if (fs.existsSync(layersDir)) {
//     fs.rmdirSync(layersDir, { recursive: true })
//   }
// }

const getNftBaseAssets = async () => {
  const { collection } = await strapi.db.query(`api::config.config`).findOne({
    populate: true,
  })
  const groupName = collection.Name
  try {
    // if layers exists already, remove it
    fs.statSync(layersDir),
      (err, stat) => {
        if (!err) {
          fs.unlink(layersDir, (err) => {
            if (err) console.log(err)
          })
        }
        if (err) console.log(err)
      }

    fs.mkdirSync(layersDir, { recursive: true }, (err) => {
      if (err) console.log(err)
    })
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
    layers.forEach(async (layer) => {
      const layerDir = path.resolve(layersDir, layer.Name)

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

      fs.mkdirSync(layerDir, { recursive: true })
      layerAssets.forEach(async (asset) => {
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
        const source = path.resolve(
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
  } catch (error) {
    console.log(error)
  }
}
