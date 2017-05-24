async function overloaded(arg: number): Promise<number>;
async function overloaded(arg: int): Promise<int>;

async function overloaded(arg: number | int){
    "use speedyjs";

    return arg;
}
