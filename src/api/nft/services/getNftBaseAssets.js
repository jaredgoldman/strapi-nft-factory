const fs = require("fs")
const path = require("path")
const layersDir = path.join(__dirname, "../../../../.tmp/layers")
// const source = require("../../../../public")

const getNftBaseAssets = async (groupName = "Eyeball") => {
  try {
    fs.mkdir(layersDir, { recursive: true }, (err) => {
      if (err) console.log(err)
    })
    const layers = await strapi.db.query(`api::layer.layer`).findMany()
    // const layers = await strapi.db.query(`api::layer.layer`).findMany({
    //   populate: true,
    //   where: {
    //     group: {
    //       Name: {
    //         $eq: groupName,
    //       },
    //     },
    //   },
    // })
    layers.forEach(async (layer) => {
      const layerDir = path.resolve(layersDir, layer.Name)
      fs.mkdir(layerDir, { recursive: true }, (err) => {
        if (err) console.log(err)
      })
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
      layerAssets.forEach(async (asset) => {
        // figure out assets rariry
        const rarity = asset.Rarity
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
    await getNftBaseAssets()
    return
  } catch (error) {
    console.log(error)
  }
}