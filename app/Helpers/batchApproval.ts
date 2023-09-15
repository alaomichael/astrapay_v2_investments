const batchApproval = async (investments, investmentId, walletId, requestType) => {
  console.log(investmentId, walletId, requestType)
  for await (const inv of investments) {
    console.log('Loop ', inv)
  }
}

export { batchApproval }
