class ObjectToCast {}
class CastTarget {}

async function unsupportedCastError(x: ObjectToCast) {
    "use speedyjs";

    return x as CastTarget;
}
