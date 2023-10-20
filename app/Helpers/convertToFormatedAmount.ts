export const convertToFormatedAmount = async function convertToFormatedAmount(amount, currencyCode?) {
    // export const convertToFormattedAmount = async function convertToFormattedAmount(amount, currencyCode?) {
    if (amount == null) {
        return "N/A"; // Handle null or undefined amount
    }

    const typeOfAmount = typeof amount;

    if (typeOfAmount !== "string" && typeOfAmount !== "number") {
        throw new Error("Invalid input type. Expected a string or number.");
    }

    const amountStr = typeOfAmount === "string" ? amount : amount.toString();

    // Split the amount into integer and fractional parts (if any)
    const parts = amountStr.split('.');

    // Format the integer part with commas for thousands separators
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Combine the integer and fractional parts (if any) with a period
    const formattedAmount = parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;

    // Add currencyCode prefix to the formatted amount
    const formattedCurrency = currencyCode ? `${currencyCode} ${formattedAmount}` : formattedAmount;

    return formattedCurrency;
}
