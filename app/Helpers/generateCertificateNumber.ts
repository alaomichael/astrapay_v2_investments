
export const generateString = async function generateString() {
    const prefix = "investment/CT/";
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    function generateRandomNumber() { // between 1 and 10000
        const min = 1;
        const max = 10000;
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        return randomNumber;
    }
    const result = prefix + year + month + generateRandomNumber();
    // console.log(result)
    return result;
}

// let newCertificateNumber = generateString();
// console.log(newCertificateNumber)