export const getUserWalletAverageBalance = function getUserWalletAverageBalance(walletBalanceHistory, period) {
    return new Promise((resolve, reject) => {
        if (!walletBalanceHistory || !period || period <= 0) {
            reject(
                new Error("Incomplete parameters,walletBalanceHistory or period is missing.")
            );
        }
        let averageBalance;
        let totalBalance: number = 0;
        period = Number(period); // convert to number
        period = period * 30; // convert month to days
        walletBalanceHistory.forEach(function (item) {
            // console.log(item.balance);
            // console.log(typeof item.balance);
            // add balance to total balance
            totalBalance += item.balance;
                })
        // console.log("user total balance: " + totalBalance);
        // console.log("The period in days is " + period);
        averageBalance = Number(totalBalance / period);
        // console.log(`The average Balance for this user is ${averageBalance}.`);
        return resolve(averageBalance);
    });
};