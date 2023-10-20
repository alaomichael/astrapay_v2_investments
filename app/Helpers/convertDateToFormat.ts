
export async function convertDateToFormat(DateTime, formatToReturn) {
    formatToReturn = await formatToReturn.toLowerCase();
    const date = new Date(DateTime);
    const day = (date.getDate()).toString().padStart(2, "0");//(date.getDate() + 1).toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");// padStart(4, "*"); ***6
    const year = date.getFullYear().toString();
    let result;

    switch (formatToReturn) {
        case "dd/mm/yyyy":
            result = `${day}/${month}/${year}`;
            break;
        case "mm/dd/yyyy":
            result = `${month}/${day}/${year}`;
            break;
        case "yyyy/mm/dd":
            result = `${year}/${month}/${day}`;
            break;
        case "yyyy/dd/mm":
            result = `${year}/${day}/${month}`;
            break;
        case "dd-mm-yyyy":
            result = `${day}-${month}-${year}`;
            break;
        case "mm-dd-yyyy":
            result = `${month}-${day}-${year}`;
            break;
        case "yyyy-mm-dd":
            result = `${year}-${month}-${day}`;
            break;
        case "yyyy-dd-mm":
            result = `${year}-${day}-${month}`;
            break;
        default:
            result = `${day}/${month}/${year}`;
            break;
    }

    // console.log(result);
    // debugger;
    return result;
}
