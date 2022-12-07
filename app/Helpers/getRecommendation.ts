const Env = require("@ioc:Adonis/Core/Env");
const CURRENT_SETTING_TAGNAME = Env.get("CURRENT_SETTING_TAGNAME");
export const getRecommendation = async function getRecommendation(
  availableWalletBalance,
  settings,
  loanabilityStatus,
  userId?
): Promise<any> {
  try {
    //  lng: any, lat: any, isBvnVerified: any, performanceOnPastLoan?: any
    let recommendedAmount;
    // const userDetails = await model
    //   .query()
    //   .where({
    //     id: walletId,
    //     // userId: userId,
    //   })
    //   .first();
    let setting = await settings.query().where({ tagName: CURRENT_SETTING_TAGNAME }).first();
    // console.log("User details line 11,@ getRecommendation.ts:", userDetails);
    // console.log("settings line 12,@ getRecommendation.ts:", setting);
    //  console.log("wallet id line 13,@ getRecommendation.ts:", walletId);
    console.log("User id line 14,@ getRecommendation.ts:", userId);
    let {
      bvnVerificationWeight,
      bvnVerificationScaleRange,
      creditRegistryWeight,
      creditRegistryScaleRange,
      performanceOnPastLoanWeight,
      performanceOnPastLoanScaleRange,
      locationWeight,
      locationScaleRange,
    } = setting;

    console.log(
      "performance id line 34,@ getRecommendation.ts:",
      typeof performanceOnPastLoanWeight
    );

    let { creditRegistryRating,
      okraRating,
      lastLoanPerformanceRating } = loanabilityStatus;

    let bvnVerificationStatus = true;//userDetails.isBvnVerified;
    let bvnScore;
    creditRegistryRating = creditRegistryRating //"100";
    let creditRegistryScore;
    let performanceRating = lastLoanPerformanceRating //"100";
    let performanceOnPastLoanScore;
    // let locationScore = 0;
    // let okraScore;
    console.log("Okra rating,@ getRecommendation.ts, line 51:", okraRating);
    let walletBalance = availableWalletBalance;// userDetails.balance;
    let averageBalance = 0;
    let astraPayBalance = walletBalance;
    let astraPolarisBalance = walletBalance;
    let overallObtainableScore: number;
    let scoreObtained;

    let maximumObtainableScoreForBvn =
      Number(bvnVerificationWeight * bvnVerificationScaleRange);
    let maximumObtainableScoreForCreditRegistry =
      Number(creditRegistryWeight * creditRegistryScaleRange);
    let maximumObtainableScoreForPerformanceOnPastLoan =
      Number(performanceOnPastLoanWeight * performanceOnPastLoanScaleRange);
    let maximumObtainableScoreForLocation = Number(locationWeight * locationScaleRange);
    // let maximumObtainableScoreForOkra;
    overallObtainableScore =
      maximumObtainableScoreForBvn +
      maximumObtainableScoreForCreditRegistry +
      maximumObtainableScoreForPerformanceOnPastLoan +
      maximumObtainableScoreForLocation;

    console.log(" Overall Obtainable Score, line 73:", overallObtainableScore);

    averageBalance = calculateAverageBalance(
      astraPayBalance,
      astraPolarisBalance,
      averageBalance,
      walletBalance
    );
    performanceRating = convertPerformanceRatingToString(performanceRating);
    console.log(
      "Performance rating, line 83 @ getRecommendation: " + performanceRating
    );
    performanceOnPastLoanScore = calculatePerformanceOnPastLoanScore(
      performanceRating,
      performanceOnPastLoanScore,
      performanceOnPastLoanScaleRange,
      performanceOnPastLoanWeight
    );
    console.log(
      "performance On PastLoan Score, line 86 @ getRecommendation: " +
      performanceOnPastLoanScore
    );

    creditRegistryRating =
      convertCreditRegistryRatingToString(creditRegistryRating);
    console.log(
      "creditRegistry Rating, line 93 @ getRecommendation: " +
      creditRegistryRating
    );

    creditRegistryScore = calculateCreditRegistryScore(
      creditRegistryWeight,
      creditRegistryScaleRange,
      creditRegistryRating,
      creditRegistryScore,
    );
    console.log(
      "creditRegistry Score, line 104 @ getRecommendation: " +
      creditRegistryScore
    );

    bvnVerificationWeight;
    bvnVerificationScaleRange;
    bvnVerificationStatus;
    bvnScore;
    // '0' means false, while '1' means true
    console.log("is bvn verified: ", bvnVerificationStatus);
    if ( bvnVerificationStatus == true) {
      bvnScore = bvnVerificationScaleRange * bvnVerificationWeight;
    } else {
      bvnScore = 0 * bvnVerificationWeight;
    }
    console.log(" BvnScore ,line 119 @ getRecommendation: ", bvnScore);

    scoreObtained = creditRegistryScore + performanceOnPastLoanScore + bvnScore;
    console.log(" scoreObtained ,line 122 @ getRecommendation: ", scoreObtained);
    console.log(" averageBalance ,line 123 @ getRecommendation: ", typeof averageBalance);
    console.log(" averageBalance ,line 124 @ getRecommendation: ", averageBalance);

    recommendedAmount = (scoreObtained / overallObtainableScore) * averageBalance;
    console.log(" recommendedAmount ,line 125 @ getRecommendation: ", recommendedAmount);

    return recommendedAmount;
  } catch (error) {
    console.log(error.message);
    throw new Error("Function not implemented, @ getRecommendation helper function.");
  }
};

function calculatePerformanceOnPastLoanScore(
  performanceRating: string,
  performanceOnPastLoanScore: number,
  performanceOnPastLoanScaleRange: number,
  performanceOnPastLoanWeight: number
) {
  switch (performanceRating) {
    case "excellent":
      // console.log(
      //   "Performance score on past loan,line 139:",
      //   typeof performanceOnPastLoanScaleRange
      // );
      // console.log(
      //   "Performance score on past loan,line 142:",
      //   typeof performanceOnPastLoanWeight
      // );
      performanceOnPastLoanScore =
        Number(performanceOnPastLoanScaleRange * performanceOnPastLoanWeight);
      console.log("Performance score on past loan,line 147:", performanceOnPastLoanScore)
      break;
    case "very good":
      performanceOnPastLoanScore =
        Number((performanceOnPastLoanScaleRange - 1) * performanceOnPastLoanWeight);
      console.log("Performance score on past loan,line 144:", performanceOnPastLoanScore)
      break;
    case "good":
      performanceOnPastLoanScore =
        Number((performanceOnPastLoanScaleRange - 2) * performanceOnPastLoanWeight);
      console.log("Performance score on past loan,line 149:", performanceOnPastLoanScore)
      break;
    case "fair":
      performanceOnPastLoanScore =
        Number((performanceOnPastLoanScaleRange - 3) * performanceOnPastLoanWeight);
      console.log("Performance score on past loan,line 154:", performanceOnPastLoanScore)
      break;
    case "poor":
      performanceOnPastLoanScore =
        Number((performanceOnPastLoanScaleRange - 4) * performanceOnPastLoanWeight);
      console.log("Performance score on past loan,line 159:", performanceOnPastLoanScore)
      break;

    default:
      performanceOnPastLoanScore =
        Number((performanceOnPastLoanScaleRange - 5) * performanceOnPastLoanWeight);
      console.log(
        " default performance On PastLoan Score, line 166 @ getRecommendation: " +
        performanceOnPastLoanScore
      );
      break;
  }
  return performanceOnPastLoanScore;
}

function convertPerformanceRatingToString(performanceRating: string) {
  if (parseInt(performanceRating) >= 80 && parseInt(performanceRating) <= 100) {
    performanceRating = "excellent";
  } else if (
    parseInt(performanceRating) >= 60 &&
    parseInt(performanceRating) < 80
  ) {
    performanceRating = "very good";
  } else if (
    parseInt(performanceRating) >= 40 &&
    parseInt(performanceRating) < 60
  ) {
    performanceRating = "good";
  } else if (
    parseInt(performanceRating) >= 20 &&
    parseInt(performanceRating) < 40
  ) {
    performanceRating = "fair";
  } else if (
    parseInt(performanceRating) >= 1 &&
    parseInt(performanceRating) < 40
  ) {
    performanceRating = "poor";
  }
  return performanceRating;
}

function calculateAverageBalance(
  astraPayBalance: number,
  astraPolarisBalance: number,
  averageBalance: number,
  walletBalance: number
) {
  if (astraPayBalance && astraPolarisBalance) {
    averageBalance = (astraPayBalance + astraPolarisBalance) / 2;
    console.log("Average balance is:", averageBalance);
    console.log("wallet balance is:", walletBalance);
  }
  return averageBalance;
}

function calculateCreditRegistryScore(
  creditRegistryWeight: number,
  creditRegistryScaleRange: number,
  creditRegistryRating: string,
  creditRegistryScore: number
) {
  switch (creditRegistryRating) {
    case "excellent":
      // console.log(
      //   "Performance score on past loan,line 237:",
      //   typeof creditRegistryScaleRange
      // );
      // console.log(
      //   "Performance score on past loan,line 241:",
      //   typeof creditRegistryWeight
      // );
      creditRegistryScore = Number(creditRegistryScaleRange * creditRegistryWeight);
      console.log(
        "Credit Registry Score, line 246 @ getRecommendation: " +
        creditRegistryScore
      );
      break;
    case "very good":
      creditRegistryScore =
        Number((creditRegistryScaleRange - 1) * creditRegistryWeight);
      console.log(
        "Credit Registry Score, line 254 @ getRecommendation: " +
        creditRegistryScore
      );
      break;
    case "good":
      creditRegistryScore =
        Number((creditRegistryScaleRange - 2) * creditRegistryWeight);
      console.log(
        "Credit Registry Score, line 262 @ getRecommendation: " +
        creditRegistryScore
      );
      break;
    case "fair":
      creditRegistryScore =
        Number((creditRegistryScaleRange - 3) * creditRegistryWeight);
      console.log(
        "Credit Registry Score, line 270 @ getRecommendation: " +
        creditRegistryScore
      );
      break;
    case "poor":
      creditRegistryScore =
        Number((creditRegistryScaleRange - 4) * creditRegistryWeight);
      console.log(
        "Credit Registry Score, line 278 @ getRecommendation: " +
        creditRegistryScore
      );
      break;

    default:
      creditRegistryScore =
        Number((creditRegistryScaleRange - 5) * creditRegistryWeight);
      console.log(
        " default credit Registry Score, line 287 @ getRecommendation: " +
        creditRegistryScore
      );
      break;
  }
  return creditRegistryScore;
}

function convertCreditRegistryRatingToString(creditRegistryRating: string) {
  if (
    parseInt(creditRegistryRating) >= 80 &&
    parseInt(creditRegistryRating) <= 100
  ) {
    creditRegistryRating = "excellent";
  } else if (
    parseInt(creditRegistryRating) >= 60 &&
    parseInt(creditRegistryRating) < 80
  ) {
    creditRegistryRating = "very good";
  } else if (
    parseInt(creditRegistryRating) >= 40 &&
    parseInt(creditRegistryRating) < 60
  ) {
    creditRegistryRating = "good";
  } else if (
    parseInt(creditRegistryRating) >= 20 &&
    parseInt(creditRegistryRating) < 40
  ) {
    creditRegistryRating = "fair";
  } else if (
    parseInt(creditRegistryRating) >= 1 &&
    parseInt(creditRegistryRating) < 40
  ) {
    creditRegistryRating = "poor";
  }
  return creditRegistryRating;
}
