const mime = require("mime-types")
const path = require("path")
const fs = require("fs")

/**
 * Uploads nft Asset to strapi media library
 * @param {String} nftDir``
 */
saveAssetToMediaLibarary = async (nftDir) => {
  const name = path.basename(nftDir)
  const buffer = fs.statSync(nftDir)
  const upload = await strapi.plugins.upload.services.upload.upload({
    data: {
      path: "images",
    },
    files: {
      path: nftDir,
      name: name,
      type: mime.lookup(nftDir),
      size: buffer.size,
    },
  })
  return upload
}

/**
 * Creates new NFT entry
 * @param {String} url
 * @param {String} fileName
 * @param {Object} upload
 * @param {String} collectionName
 */
const saveNftData = async (url, fileName, upload, collectionName) => {
  const collectionType = await strapi.db.query("api::group.group").findOne({
    where: {
      name: collectionName,
    },
  })
  try {
    strapi.entityService.create("api::nft.nft", {
      populate: {
        collection: true,
      },
      data: {
        title: fileName,
        url,
        image: upload,
        collection: collectionType.id,
      },
    })
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  saveAssetToMediaLibarary,
  saveNftData,
}
