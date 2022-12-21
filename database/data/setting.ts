export const settings = [
    {
        rfiName: "Sigma Octantis",
        rfiCode: "S8",
        rfiImageUrl: "http://www.rfi-image.com/01",
        initiationNotificationEmail: "devmichaelalao@gmail.com",
        activationNotificationEmail: "devmichaelalao@gmail.com",
        maturityNotificationEmail: "devmichaelalao@gmail.com",
        payoutNotificationEmail: "devmichaelalao@gmail.com",
        rolloverNotificationEmail: "devmichaelalao@gmail.com",
        liquidationNotificationEmail: "devmichaelalao@gmail.com",
        fundingSourceTerminal: "sagami",
        investmentWalletId: "1234560001",//SIGWALLET_166922392334423",
        payoutWalletId: "1234560001",//SIGWALLET_166922392334423",
        isPayoutAutomated: true,
        isInvestmentAutomated: true,
        isRolloverAutomated: true,
        isAllPayoutSuspended: false,
        isAllRolloverSuspended: false,
        tagName: "default setting",
        currencyCode: "NGN"
    },
];

export enum requirementEnum {
    THIRD_PARTY = "Third Party",
    COMPREHENSIVE = "Comprehensive",
    TRAVEL = "Travel",
}
