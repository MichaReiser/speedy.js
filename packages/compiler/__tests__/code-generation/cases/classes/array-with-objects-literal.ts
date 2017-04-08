class Point {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export async function arrayWithObjectLiterals() {
    "use speedyjs";

    const array = [
        new Point(1.0, 2.0),
        new Point(3.0, 4.0),
        new Point(5.0, 6.0)
    ];

    return array[0].x;
}
