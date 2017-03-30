async function arrayConstructorCase() {
    "use speedyjs";

    const emptyArray = new Array<boolean>();
    const arrayOfSize = new Array<int>(1000);
    const arrayWithElement = new Array(true);
    const arrayWithElements = new Array<number>(1.0, 2.0, 3.0);
}
