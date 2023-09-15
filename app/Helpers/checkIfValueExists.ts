export const checkIfValueExists = async function checkIfValueExists(newCertificateNumber, subscriptionServices, generateString) {
    let result = await subscriptionServices.getSubscritptionByInternalCertificateNumber(newCertificateNumber);
    while (result) {
        newCertificateNumber = await generateString();
        result = await subscriptionServices.getSubscritptionByInternalCertificateNumber(newCertificateNumber);
    }
    return newCertificateNumber;
}