class Point {
    constructor(private x: number, private y: number) {

    }

    distanceTo(other: Point) {
        return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
    }
}


async function distance(a: Point, b: Point) {
    "use speedyjs";
    return a.distanceTo(b);
}

async function main2() {
    const center = new Point(0.0, 0.0);
    const p = new Point(3.4, 3.123);

    return distance(center, p);
}



