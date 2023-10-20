export const settings = [
    {
        rfiName: "Astra Polaris",
        rfiCode: "APMFB",
        rfiImageUrl: "http://www.rfi-image.com/01",
        initiationNotificationEmail: [{ email: 'devmichaelalao@gmail.com', name:'michael'}, { email:'contactleomax@gmail.com'},],
        activationNotificationEmail:[{ email: 'devmichaelalao@gmail.com' }, { email:'contactleomax@gmail.com',name:'leomax'},],
        maturityNotificationEmail:[{ email: 'devmichaelalao@gmail.com' }, { email:'contactleomax@gmail.com',name:'international'},],
        payoutNotificationEmail: [{ email: 'devmichaelalao@gmail.com' ,name:'oga admin'}, { name:'payout admin',email:'contactleomax@gmail.com'},],
        rolloverNotificationEmail: [{ email: 'devmichaelalao@gmail.com',name:'mr admin' }, { email:'contactleomax@gmail.com',name:'rollover admin'},],
        liquidationNotificationEmail: [{ email: 'devmichaelalao@gmail.com',name:'the admin' }, { email:'contactleomax@gmail.com',name:'liquidation admin'},],
        fundingSourceTerminal: "sagamy",
        investmentWalletId: "656565656565", //"1234560001",//SIGWALLET_166922392334423",
        payoutWalletId: "656565656565", //"1234560001",//SIGWALLET_166922392334423",
        isPayoutAutomated: true,
        isInvestmentAutomated: true,
        isRolloverAutomated: true,
        isAllPayoutSuspended: false,
        isAllRolloverSuspended: false,
        tagName: "default setting",
        currencyCode: "NGN",
        liquidationPenalty: 25
    },
];

export enum requirementEnum {
    THIRD_PARTY = "Third Party",
    COMPREHENSIVE = "Comprehensive",
    TRAVEL = "Travel",
}
