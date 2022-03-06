const asyncForEach = async (array, callback) => {
  const errorArray = []
  for (let index = 0; index < array.length; index++) {
    try {
      await callback(array[index], index, array)
    } catch (error) {
      // Let's have some standards here folks
      if (errorArray.length > 100) {
        break
      }
      console.log("error - continuing", index)
      errorArray.push(index)
      continue
    }
  }
  return errorArray
}
// wait for confirmation on the Algo blockchain
const waitForConfirmation = async function (algodClient, txId, timeout) {
  if (algodClient == null || txId == null || timeout < 0) {
    throw new Error("Bad arguments")
  }

  const status = await algodClient.status().do()
  if (status === undefined) {
    throw new Error("Unable to get node status")
  }

  const startround = status["last-round"] + 1
  let currentround = startround

  while (currentround < startround + timeout) {
    const pendingInfo = await algodClient
      .pendingTransactionInformation(txId)
      .do()
    if (pendingInfo !== undefined) {
      if (
        pendingInfo["confirmed-round"] !== null &&
        pendingInfo["confirmed-round"] > 0
      ) {
        //Got the completed Transaction
        return pendingInfo
      } else {
        if (
          pendingInfo["pool-error"] != null &&
          pendingInfo["pool-error"].length > 0
        ) {
          // If there was a pool error, then the transaction has been rejected!
          throw new Error(
            "Transaction " +
              txId +
              " rejected - pool error: " +
              pendingInfo["pool-error"]
          )
        }
      }
    }
    await algodClient.statusAfterBlock(currentround).do()
    currentround++
  }
  throw new Error(
    "Transaction " + txId + " not confirmed after " + timeout + " rounds!"
  )
}

const wait = async (duration) => {
  await new Promise((res) => {
    setTimeout(res, duration)
  })
}

module.exports = {
  asyncForEach,
  waitForConfirmation,
  wait,
}
