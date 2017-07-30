class Point {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

class Project {
    startYear: int;
    amount: number;
    constructor(startYear: int, amount: number) {
        this.startYear = startYear;
        this.amount = amount;
    }
}

export async function arrayWithMultipleObjects() {
    "use speedyjs";

    const points = [
        new Point(1.0, 2.0),
        new Point(3.0, 4.0),
        new Point(5.0, 6.0)
    ];

    const projects = [
        new Project(4, 29393),
        new Project(10, 900000)
    ];
}
