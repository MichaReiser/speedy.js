class AsBooleanObject {}

export async function asBoolean() {
    "use speedyjs";

    const booleanAsBool = true as boolean;
    const objectAsBoolean = new AsBooleanObject() as boolean;
}
