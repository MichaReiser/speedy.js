export async function tspArray() {
    "use speedyjs";

    const points = [
        8700	, 14036,
        8352	, 10324,
        10672	, 13340,
        12644	, 10556,
        12412	, 14964,
        11484	, 7540 ,
        10440	, 14732,
        9512	, 13340,
        7772	, 11020,
        15660	, 10788,
        8004	, 11020,
        7888	, 16936,
        1020	, 13456,
        15312	, 6612 ,
        11020	, 13688,
        10092	, 14964,
        11368	, 12296,
        16240	, 8352 ,
        11020	, 13340,
        9744	, 15196,
        11484	, 9744 ,
        7308	, 14848,
        9512	, 12412,
        12296	, 12760,
        10672	, 15080,
        812	    , 6264 ,
        15660	, 11368,
        9744	, 16240,
        5104	, 14616,
        10672	, 14152,
        8352	, 10672,
        11252	, 15776,
        11020	, 10208,
        10324	, 17516,
        8468	, 12876,
        8236	, 15428,
        11484	, 13224,
        8468	, 11136,
        10672	, 13804,
        5336	, 18908,
        10208	, 14384,
        9744	, 12528,
        8236	, 11020,
        8236	, 13572,
        11716	, 16008,
        17052	, 12064,
        9628	, 14036,
        13688	, 17516,
        8932	, 12064,
        16472	, 16472,
        9860	, 13108,
        11832	, 17516,
        7424	, 17516,
        5684	, 11948,
        7540	, 16820,
        11020	, 7424 ,
        8700	, 15312,
        16936	, 12180,
        512	    , 15776,
        12528	, 15196,
        7656	, 17052,
        9164	, 13340,
        8352	, 12644,
        9164	, 12876,
        12876	, 12180,
        1600	, 13456,
        10556	, 13688,
        6264	, 19140,
        9164	, 15544,
        10324	, 11716,
        1160	, 18560,
        11020	, 13108,
        8352	, 17052,
        10556	, 11948,
        9744	, 3132 ,
        9164	, 14964,
        12180	, 15544,
        3248	, 14152,
        14152	, 18908,
        11832	, 11252,
        11484	, 9512 ,
        12064	, 12528,
        10788	, 13572,
        13688	, 11716,
        7888	, 17168,
        7540	, 15080,
        12064	, 14964,
        8932	, 13688,
        7772	, 14732,
        10904	, 13108,
        8468	, 12296,
        10440	, 14036,
        8584	, 13108,
        11136	, 13572,
        12296	, 15312,
        5684	, 13224,
        11716	, 16124,
        11600	, 19720,
        11136	, 11020,
        12992	, 14964,
        11484	, 8468 ,
        15544	, 12760,
        11252	, 13340,
        396	    , 14616,
        9048	, 13804,
        5336	, 10324,
        11136	, 14152,
        9512	, 17400,
        12412	, 13340,
        12180	, 14848,
        10208	, 15196,
        860	    , 14152,
        9164	, 16008,
        10904	, 3480 ,
        9512	, 16472,
        1252	, 14036,
        17052	, 11600,
        8004	, 12760,
        16936	, 11832,
        6496	, 17168,
        13688	, 12528,
        1252	, 14848,
        10788	, 13804,
        13688	, 10904,
        11368	, 12644,
        13804	, 18792,
        14384	, 20184,
    ];

    return tspSync(0, points);
}

function tspSync(start: int, points: int[]) {
    "use speedyjs";

    let currentX = points[start];
    let currentY = points[start + 1];

    const solution: int[] = [currentX, currentY];

    while (points.length) {
        let shortestDistance: number = 2.0**31.0 - 1.0;
        let nearestIndex = 0;

        for (let i = 0; i < points.length - 2; i += 2) {
            const distance = euclideanDistance(currentX, currentY, points[i], points[i+1]);

            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestIndex = i;
            }
        }

        currentX = points[nearestIndex];
        currentY = points[nearestIndex + 1];

        solution.push(currentX, currentY);
        points.splice(nearestIndex, 2);
    }

    solution.push(solution[0], solution[1]); // close tour;
    return computeCost(solution);
}

function computeCost(tour: int[]) {
    "use speedyjs";
    let total = 0.0;

    for (let i = 0; i < tour.length - 4; i += 2) {
        total += euclideanDistance(tour[i], tour[i + 1], tour[i + 2], tour[i + 3]);
    }

    return total;
}

function euclideanDistance(x1: int, y1: int, x2: int, y2: int): number {
    "use speedyjs";

    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}
