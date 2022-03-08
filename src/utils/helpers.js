const asyncForEach = async (array, callback) => {
  const errorArray = []
  for (let index = 0; index < array.length; index++) {
    try {
      await callback(array[index], index, array)
    } catch (error) {
      console.log("ERROR", error)
      console.log("error on index", index)
      errorArray.push(index)
      continue
    }
  }
  return errorArray
}
// wait for confirmation on the Algo blockchain
const waitForConfirmation = async (algodclient, txId) => {
  let response = await algodclient.status().do()
  let lastround = response["last-round"]
  while (true) {
    const pendingInfo = await algodclient
      .pendingTransactionInformation(txId)
      .do()
    if (
      pendingInfo["confirmed-round"] !== null &&
      pendingInfo["confirmed-round"] > 0
    ) {
      //Got the completed Transaction
      console.log(
        "Transaction " +
          txId +
          " confirmed in round " +
          pendingInfo["confirmed-round"]
      )
      break
    }
    lastround++
    await algodclient.statusAfterBlock(lastround).do()
  }
}

const wait = async (duration) => {
  await new Promise((res) => {
    setTimeout(res, duration)
  })
}

/**
 * Formats unit numbering
 * @param {String} unitName
 * @param {Number} editionNum
 * @return {String} transformedUnitName
 */
const transformAlgoUnitName = (unitName, editionNum) => {
  if (editionNum < 10) {
    return `${unitName}00${editionNum.toString()}`
  }
  if (editionNum < 100) {
    return `${unitName}0${editionNum.toString()}`
  }
  return `${unitName}${editionNum.toString()}`
}

module.exports = {
  asyncForEach,
  waitForConfirmation,
  wait,
  transformAlgoUnitName,
}
