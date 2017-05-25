async function returnWithImplicitReturnValueCoercion(arg: int): Promise<number> {
    "use speedyjs";

    return arg;
}

class ImplicitReturnTest {};

async function returnWithImplicitCastOfUndefined(): Promise<ImplicitReturnTest | undefined> {
    return undefined;
}
