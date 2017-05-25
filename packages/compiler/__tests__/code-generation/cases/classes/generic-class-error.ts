class Node<T> {
    constructor(private value: T, private next?: Node<T>) {

    }

    length(): int {
        return 1 + (this.next ? this.next.length() : 0);
    }
}

async function listLength() {
    "use speedyjs";

    const list = new Node<number>(12, new Node(23, new Node(34)));

    return list.length();
}
