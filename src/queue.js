export default class Queue {
    constructor(effectors) {
        this.items = []
        this.processing = false
        this.effectors = effectors
        let ref = setInterval(this.processNext.bind(this), 200)
        // setTimeout(() => {
        //     clearInterval(ref)
        // }, 5000)
    }

    size() {
        return this.items.length
    }

    enqueue(item) {
        console.log("QUEUE ITEM ADDED", item)
        this.items.push(item)
        console.log("SIZE OF QUEUE", this.items.length)
    }

    processNext() {
        //types:
        // 'non-blocking' - do not await animation/process to finish
        // 'blocking' - await animation/process to finish 
        console.log("this.processing", this.processing)
        if (this.processing || this.items.length === 0) {
            return // Already processing something. Once it's done, it will allow to move on.
        }

        this.processing = true

        console.log("QUEUE ITEMS", this.items)
        console.table(this.items)
        let item = this.dequeue()
        console.table(item)

        if (item === undefined) {
            return;
        }

        if (Array.isArray(item)) {
            // Has the reference being dereferenced due to previous animation? If yes, then bypass it.
            // item = item.filter(event => event.gem.ref !== undefined)
            // if (item.length === 0) {
            //     this.processing = false
            //     return;
            // }

            console.log("ARRAY PORRA", item)
            item.forEach(event => {
                this.work(event)
            })
        } else {
            this.work(item)
        }

        this.effectors.forEach(effect => {
            effect()
        })
        // else if (typeof item === 'object') {
        //     console.log("OBJEECTPORRA")
        //     if (item === undefined || item.gem.ref === undefined) {
        //         return;
        //     }

        //     item.func()

        //     if (item.type === "animation") {
        //         console.log("pre aaaaaaaaa", item)
        //         console.log("Aaaaaaaaaaaaaaaa", item.gem.ref.animation)
        //         // item.gem.ref.unanimateAll()
        //         item.gem.ref.animation.seek(0)
        //         item.gem.ref.onAnimateFinished(() => {
        //             if (item.callback !== undefined) {
        //                 item.callback()
        //             }

        //             console.log("QUEUE FINISHED PROCESSING", item)
        //             this.processing = false
        //         })
        //     }
        // }

    }

    work(event) {
        if (event.kind === 'animation') {
            event.gem.ref.unanimate("pos")
            event.gem.ref.animation.seek(0)
            event.func()
            console.log("func CALLED!")

            if (event.type === "blocking") {
                // Assume all animations have same duration
                event.gem.ref.onAnimateFinished(() => {

                    if (event.callback !== undefined) {
                        event.callback()
                    }

                    console.log("QUEUE FINISHED PROCESSING", item)
                    this.processing = false
                })
            } else if (event.type === "non-blocking") {
                event.gem.ref.onAnimateFinished(() => {
                    console.log("func FINISHED!")

                    if (event.callback !== undefined) {
                        event.callback()
                    }
                })

                // Allow for async play while animation is finishing
                this.processing = false;
            }
        } else if (event.kind === 'logic') {
            event.func()
            this.processing = false;
        }
    }

    dequeue() {
        return this.items.shift()
    }
}