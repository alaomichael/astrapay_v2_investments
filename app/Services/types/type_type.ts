export interface TypeType {
    rfiRecordId: string,
    rfiCode: string,
    typeName: string,
    lowestAmount: number,
    highestAmount: number,
    // duration: string,
    interestRate: number,
    isRolloverAllowed: boolean,
    quantityIssued: number,
    quantityAvailableForIssue: number,
    availableTypes: Array<string>,
    minimumAllowedPeriodOfInvestment: string,
    maximumAllowedPeriodOfInvestment: string,
    currencyCode: string,
    // dailyMinimumLimit: number,
    // dailyMaximumLimit: number,
    // weeklyMinimumLimit: number,
    // weeklyMaximumLimit: number,
    // monthlyMinimumLimit: number,
    // monthlyMaximumLimit: number,
    // yearlyMinimumLimit: number,
    // yearlyMaximumLimit: number,
    isAutomated: boolean,
    // isRenewable: boolean,
    description: string,
    features: Array<string>,
    requirements: Array<string>,
    createdBy: string,
    tagName: string,
    lng: string,
    lat: string,
    status: string,
}
