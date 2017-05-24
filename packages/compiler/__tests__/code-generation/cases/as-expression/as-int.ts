class AsIntObject {}

export async function asInt() {
    "use speedyjs";

    const intAsInt = 2 as int;
    const intValue = 3.212 as int;
    const objectAsInt = new AsIntObject() as int;
}
