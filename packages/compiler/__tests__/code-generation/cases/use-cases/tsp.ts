class Point {
    constructor(private x: int, private y: int) {
    }

    distanceTo(other: Point) {
        return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
    }
}

export async function tsp() {
    "use speedyjs";

    const points = [
        new Point(9860, 14152),
        new Point(9396, 14616),
        new Point(11252, 14848),
        new Point(11020, 13456),
        new Point(9512, 15776),
        new Point(10788, 13804),
        new Point(10208, 14384),
        new Point(11600, 13456),
        new Point(11252, 14036),
        new Point(10672, 15080),
        new Point(11136, 14152),
        new Point(9860, 13108),
        new Point(10092, 14964),
        new Point(9512, 13340),
        new Point(10556, 13688),
        new Point(9628, 14036),
        new Point(10904, 13108),
        new Point(11368, 12644),
        new Point(11252, 13340),
        new Point(10672, 13340),
        new Point(11020, 13108),
        new Point(11020, 13340),
        new Point(11136, 13572),
        new Point(11020, 13688),
        new Point(8468, 11136),
        new Point(8932, 12064),
        new Point(9512, 12412),
        new Point(7772, 11020),
        new Point(8352, 10672),
        new Point(9164, 12876),
        new Point(9744, 12528),
        new Point(8352, 10324),
        new Point(8236, 11020),
        new Point(8468, 12876),
        new Point(8700, 14036),
        new Point(8932, 13688),
        new Point(9048, 13804),
        new Point(8468, 12296),
        new Point(8352, 12644),
        new Point(8236, 13572),
        new Point(9164, 13340),
        new Point(8004, 12760),
        new Point(8584, 13108),
        new Point(7772, 14732),
        new Point(7540, 15080),
        new Point(7424, 17516),
        new Point(8352, 17052),
        new Point(7540, 16820),
        new Point(7888, 17168),
        new Point(9744, 15196),
        new Point(9164, 14964),
        new Point(9744, 16240),
        new Point(7888, 16936),
        new Point(8236, 15428),
        new Point(9512, 17400),
        new Point(9164, 16008),
        new Point(8700, 15312),
        new Point(11716, 16008),
        new Point(12992, 14964),
        new Point(12412, 14964),
        new Point(12296, 15312),
        new Point(12528, 15196),
        new Point(15312, 6612),
        new Point(11716, 16124),
        new Point(11600, 19720),
        new Point(10324, 17516),
        new Point(12412, 13340),
        new Point(12876, 12180),
        new Point(13688, 10904),
        new Point(13688, 11716),
        new Point(13688, 12528),
        new Point(11484, 13224),
        new Point(12296, 12760),
        new Point(12064, 12528),
        new Point(12644, 10556),
        new Point(11832, 11252),
        new Point(11368, 12296),
        new Point(11136, 11020),
        new Point(10556, 11948),
        new Point(10324, 11716),
        new Point(11484, 9512),
        new Point(11484, 7540),
        new Point(11020, 7424),
        new Point(11484, 9744),
        new Point(16936, 12180),
        new Point(17052, 12064),
        new Point(16936, 11832),
        new Point(17052, 11600),
        new Point(13804, 18792),
        new Point(12064, 14964),
        new Point(12180, 15544),
        new Point(14152, 18908),
        new Point(5104, 14616),
        new Point(6496, 17168),
        new Point(5684, 13224),
        new Point(15660, 10788),
        new Point(5336, 10324),
        new Point(812, 6264),
        new Point(14384, 20184),
        new Point(11252, 15776),
        new Point(9744, 3132),
        new Point(10904, 3480),
        new Point(7308, 14848),
        new Point(16472, 16472),
        new Point(10440, 14036),
        new Point(10672, 13804),
        new Point(1160, 18560),
        new Point(10788, 13572),
        new Point(15660, 11368),
        new Point(15544, 12760),
        new Point(5336, 18908),
        new Point(6264, 19140),
        new Point(11832, 17516),
        new Point(10672, 14152),
        new Point(10208, 15196),
        new Point(12180, 14848),
        new Point(11020, 10208),
        new Point(7656, 17052),
        new Point(16240, 8352),
        new Point(10440, 14732),
        new Point(9164, 15544),
        new Point(8004, 11020),
        new Point(5684, 11948),
        new Point(9512, 16472),
        new Point(13688, 17516),
        new Point(11484, 8468),
        new Point(3248, 14152)
    ];

    return tspSync(points);
}

function tspSync(points: Point[]) {
    "use speedyjs";

    let current = points.shift()!;
    const solution: Point[] = [current];

    while (points.length) {
        let shortestDistance: number = 2.0 ** 31.0 - 1.0;
        let nearestIndex = 0;

        for (let i = 0; i < points.length; ++i) {
            const distance = current.distanceTo(points[i]);

            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestIndex = i;
            }
        }

        current = points[nearestIndex];
        points.splice(nearestIndex, 1);
        solution.push(current);
    }

    return computeCost(solution);
}

function computeCost(tour: Point[]) {
    "use speedyjs";
    let total = 0.0;

    for (let i = 1; i < tour.length ; ++i) {
        total += tour[i - 1].distanceTo(tour[i]);
    }

    total += tour[tour.length - 1].distanceTo(tour[0]);

    return total;
}
