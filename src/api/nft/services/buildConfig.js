const rarityDelimiter = "#"

const preview_gif = {
  numberOfImages: 5,
  order: "ASC", // ASC, DESC, MIXED
  repeat: 0,
  quality: 100,
  delay: 500,
  imageName: "preview.gif",
}

const getLayerConfiguration = async (collectionName) => {
  const layers = await strapi.db.query("api::layer.layer").findMany({
    populate: true,
    where: {
      group: {
        Name: {
          $eq: collectionName,
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

const getConfigData = async () => {
  // get global config
  const { configuration } = await strapi.db
    .query(`api::generator-config.generator-config`)
    .findOne({
      populate: true,
    })
  // query configs for populated config
  return await strapi.db.query("api::configuration.configuration").findOne({
    populate: true,
    where: {
      id: configuration.id,
    },
  })
}

const buildConfig = async () => {
  const config = await getConfigData()
  const {
    collection,
    shuffle_layer_configurations,
    description,
    debug_logs,
    width,
    height,
    smoothing,
    export_gif,
    gif_repeat,
    gif_quality,
    gif_delay,
    text,
    text_color,
    text_size,
    text_x_gap,
    text_y_gap,
    text_align,
    text_baseline,
    text_weight,
    text_family,
    text_spacer,
    background,
    background_brightness,
    static_background,
    background_color,
    unique_dna_torrance,
    extra_metadata,
    collection_name,
    project_url,
    chain,
  } = config
  const collectionName = collection.Name
  const layerConfigurations = await getLayerConfiguration(collectionName)
  const backgroundBrightness = `${background_brightness.toString()}%`

  const format = {
    width,
    height,
    smoothing,
  }

  const preview = {
    thumbPerRow: 5,
    thumbWidth: 50,
    imageRatio: format.height / format.width,
    imageName: "preview.png",
  }

  const gif = {
    export: export_gif,
    repeat: gif_repeat,
    quality: gif_quality,
    delay: gif_delay,
  }

  const textData = {
    only: text,
    color: text_color,
    size: text_size,
    xGap: text_x_gap,
    yGap: text_y_gap,
    align: text_align,
    baseline: text_baseline,
    weight: text_weight,
    family: text_family,
    spacer: text_spacer,
  }

  const pixelFormat = {
    ratio: 2 / 128,
  }

  const backgroundData = {
    generate: background,
    brightness: backgroundBrightness,
    static: static_background,
    default: background_color,
  }

  const uniqueDnaTorrance = unique_dna_torrance
  const extraMetadata = extra_metadata
  return {
    collection: collectionName,
    chain,
    description,
    namePrefix: collection_name,
    description,
    baseUri: project_url,
    layerConfigurations,
    shuffleLayerConfigurations: shuffle_layer_configurations,
    debugLogs: debug_logs,
    format,
    gif,
    text: textData,
    pixelFormat,
    background: backgroundData,
    extraMetadata,
    rarityDelimiter,
    uniqueDnaTorrance,
    preview,
    preview_gif,
  }
}

module.exports = { buildConfig }
