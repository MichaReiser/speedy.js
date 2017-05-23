async function argumentsEvaluationOrder(points: number[], index: int) {
    "use speedyjs";

    return euclideanDistance(0.0, 0.0, points[index], points[index + 1]);
}

function euclideanDistance(x1: number, y1: number, x2: number, y2: number) {
    "use speedyjs";

    return Math.sqrt(Math.pow(x1 - x2, 2.0) + Math.pow(y1 - y2, 2.0));
}
