export async function arrayElementAccess() {
    "use speedyjs";

    return arrayElementAccessSync();
}

export function arrayElementAccessSync() {
    "use speedyjs";

    const array = [
        0.9128269605006514,
        0.24067088901581557,
        0.8602593509493526,
        0.2945654147655188,
        0.025618735753453636,
        0.2309383746136846,
        0.2937209695080578,
        0.8606697044729974,
        0.7490920026336974,
        0.3220486116620267
    ];

    return array[0] + array[1] + array[2] + array[3] + array[4] + array[5] + array[6] + array[7] + array[8] + array[9];

}
