class Stack {
    constructor() {
        this.items = []
    }

    pop() {
        if (this.items.length > 0) {
            return this.items.pop()
        }

        return undefined
    }

    push(item) {
        this.items.push(item)
    }

    peek() {
        return this.items.length > 0 ?? this.items[this.items.length - 1]
    }
}