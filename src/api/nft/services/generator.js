const { startCreating } = require(`./generator/src/main`)

module.exports = async () => {
  try {
    await startCreating()
    return
  } catch (error) {
    console.log(error)
  }
}
