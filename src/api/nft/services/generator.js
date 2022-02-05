const { startCreating, buildSetup } = require(`./generator/src/main`)

module.exports = async () => {
  try {
    buildSetup()
    await startCreating()
    return
  } catch (error) {
    console.log(error)
  }
}
