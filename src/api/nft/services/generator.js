const { startCreating, buildSetup } = require(`./generator/src/main`)

module.exports = async () => {
  try {
    await buildSetup()
    await startCreating()
    return
  } catch (error) {
    console.log(error)
  }
}
