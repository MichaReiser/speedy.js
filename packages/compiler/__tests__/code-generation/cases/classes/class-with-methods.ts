export class Point {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    distanceTo(to: Point) {
        return Math.sqrt(Math.pow(this.x - to.x, 2.0) + Math.pow(this.y - to.y, 2.0));
    }
}

export async function classWithMethods(x: number, y: number) {
    "use speedyjs";

    const center = new Point(0.0, 0.0);
    const other = new Point(x, y);

    center.distanceTo(other);
}
