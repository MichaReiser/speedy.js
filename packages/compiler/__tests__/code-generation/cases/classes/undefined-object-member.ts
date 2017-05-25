class Node{
    value: number;
    next: Node | undefined;
}

export async function length(start: Node) {
    "use speedyjs";

    let current: Node | undefined = start;
    let length = 0;
    while (current !== undefined) {
        ++length;
        current = current.next;
    }

    return length;
}

export async function truncate(position: Node) {
    "use speedyjs";

    position.next = undefined;
}
