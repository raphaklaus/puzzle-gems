import kaplay, { EaseFuncs, Game, GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import { Gems } from "./gems";
import * as Constants from "./constants";
import { Layout } from "./types";
import { Player } from "./player";
import { defaultProperties } from "./utils";

const typeToColorMap = new Map()


interface BoardParams {
    k: KAPLAYCtx,
    // layout: Layout
    pos: Vec2
}

export class Board {
    private gemsContainer: GameObj
    private k: KAPLAYCtx
    public player: Player
    constructor(params: BoardParams) {
        this.k = params.k;

        typeToColorMap.set(0, this.k.Color.fromHex("#a6ffa7"))
        typeToColorMap.set(1, this.k.Color.fromHex("#ff3d3d"))
        typeToColorMap.set(2, this.k.Color.fromHex("#5a83ff"))
        typeToColorMap.set(3, this.k.Color.fromHex("#d9b93b"))
        typeToColorMap.set(4, this.k.Color.fromHex("#f08eff"))

        this.gemsContainer = this.k.add([
            this.k.pos(0, 0),
            this.k.scale(Constants.SCALING),
            this.k.animate(),
        ])

        this.player = new Player({ gemsContainer: this.gemsContainer, k: this.k, board: this })

        this.gemsContainer.moveTo(params.pos)


        // if (this.layout === Layout.Center) {
        // } else if (this.layout === Layout.SideBySide) {
        //     throw new Error("Layout not defined yet!")
        // }

        // Register handlers
        this.generateGrid()
        this.setupGems()
        this.player.applyEffectors(true).then(() => {
            this.draw()
        })
    }

    generateGrid() {
        for (let lineIndex = 0; lineIndex < Constants.MAX_GEMS_HEIGHT + Constants.INITIAL_GEMS_HEIGHT; lineIndex++) {
            for (let index = 0; index < Constants.GEM_PER_LINE; index++) {
                let obj = this.gemsContainer.add(this.makeGridObj((lineIndex + index) % 2))

                obj.use(this.k.pos(index * Constants.GEM_SIZE, lineIndex * Constants.GEM_SIZE))
                obj.use(this.k.z(-1))
            }
        }

    }

    makeGridObj(colorAlternation: number) {
        return [
            this.k.color(this.k.BLACK),
            this.k.opacity(colorAlternation ? 0.1 : 0.05),
            this.k.rect(Constants.GEM_SIZE, Constants.GEM_SIZE, { radius: 1 }),
        ]
    }


    draw() {
        this.gemsContainer.onDraw(() => {
            for (let lineIndex = 0; lineIndex < this.player.gems.length; lineIndex++) {
                for (let index = 0; index < Constants.GEM_PER_LINE; index++) {
                    if (this.player.gems[lineIndex][index].invisible === true) {
                        continue
                    }

                    let type = this.player.gems[lineIndex][index].type

                    let color = typeToColorMap.get(type) ?? this.k.color(0, 0, 0)

                    this.k.drawRect({
                        width: Constants.GEM_SIZE,
                        height: Constants.GEM_SIZE,
                        pos: this.k.vec2((Constants.GEM_SIZE * index), (Constants.GEM_SIZE * lineIndex)),
                        color,
                        outline: { color: this.k.WHITE, width: 2 },
                        opacity: type === undefined ? 0 : 1
                    });

                    if (this.player.gems[lineIndex][index].type !== undefined) {
                        this.k.drawText({
                            text: this.player.gems[lineIndex][index].value.toString(),
                            size: 12,
                            font: "numbers",
                            width: 32,
                            pos: this.k.vec2((Constants.GEM_SIZE * index) + 2, (Constants.GEM_SIZE * lineIndex) + 2),
                            color: this.k.WHITE
                        })
                    }
                }
            }
        })
    }


    setupGems() {
        for (let lineIndex = Constants.MAX_GEMS_HEIGHT - 1; lineIndex >= Constants.MAX_GEMS_HEIGHT - Constants.INITIAL_GEMS_HEIGHT; lineIndex--) {
            this.player.gems[lineIndex] = this.generateGemsLine()
        }
    }

    generateGemsLine(invisible = false) {
        let line = []
        let possibleChoices: number[] = []
        typeToColorMap.forEach((_value, key) => {
            possibleChoices.push(key)
        })

        possibleChoices = this.k.shuffle(possibleChoices)

        for (let index = 0; index < Constants.GEM_PER_LINE; index++) {
            line.push(this.generateGem(possibleChoices, invisible))
        }

        return line
    }

    generateGem(possibleChoices: number[], invisible = false) {
        let type

        if (possibleChoices.length === 0) {
            type = Math.floor(Math.random() * typeToColorMap.size)
        } else {
            type = possibleChoices.pop()
        }

        return {
            type,
            ...defaultProperties(invisible)
        }
    }


    animateMatching(matchedGemsIndices: number[][], isSetup: boolean) {
        return isSetup ? [] : matchedGemsIndices
            .filter(matchedGemIndices => {
                const [lineIndex, index] = matchedGemIndices
                console.log(matchedGemIndices)
                // TODO: check that the condition below is going to affect only the previously matched gems
                return this.player.gems[lineIndex][index].type === undefined && this.player.gems[lineIndex][index].oldData?.type !== undefined
            })
            .map(matchedGemIndices => {
                const { promise, resolve, reject } = Promise.withResolvers<GameObj>()
                const [lineIndex, index] = matchedGemIndices
                let x = Constants.GEM_SIZE * index
                let y = Constants.GEM_SIZE * lineIndex

                let color = typeToColorMap.get(this.player.gems[lineIndex][index].oldData?.type)

                let obj = this.player.gems[lineIndex][index].swapReplicaRef || this.gemsContainer.add([
                    this.k.pos(x, y),
                    this.k.rect(Constants.GEM_SIZE, Constants.GEM_SIZE),
                    this.k.color(color),
                    this.k.outline(2, this.k.WHITE),
                    this.k.animate()
                ])

                this.player.gems[lineIndex][index].invisible = true
                // obj.animation.seek(0)

                obj.animate("opacity", [1, 0], { duration: 0.35, loops: 1, easing: this.k.easings.easeOutExpo })

                obj.onAnimateFinished(() => {
                    resolve(obj)
                })

                return promise
            })
    }

    public async updateGemLocation(lineIndexA: number, indexA: number, lineIndexB: number, indexB: number, animation: { duration: number, easing: any }, isSetup: boolean) {
        let promises = isSetup ? [] : [
            this.animate(lineIndexA, indexA, lineIndexB, indexB, animation),
            this.animate(lineIndexB, indexB, lineIndexA, indexA, animation)
        ]

        this.player.swap(lineIndexA, indexA, lineIndexB, indexB)
        let results = await Promise.allSettled(promises)
        results.forEach((result) => {
            if (result.status === "fulfilled") {
                result.value.destroy()
            }
        })

    }

    private animate(lineIndexA: number, indexA: number, lineIndexB: number, indexB: number, animation: { duration: number, easing: any }) {
        const { duration, easing } = animation
        const { promise, resolve, reject } = Promise.withResolvers<GameObj>()

        console.log("Porra", this.player.gems[lineIndexA])

        if (this.player.gems[lineIndexA][indexA].type === undefined) {
            reject()
            return promise
        }

        console.log("reset, before lineIndex", lineIndexB)
        console.log("reset, before index", indexB)

        const reset = () => {
            if (this.player.gems[lineIndexB][indexB].invisible === false || this.player.gems[lineIndexB][indexB].swapping === false) {
                console.trace()
                console.log("DEU RUIM,  lineIndex", lineIndexB)
                console.log("DEU RUIM,  index", indexB)
                console.log("DEU RUIM, swapping", this.player.gems[lineIndexB][indexB].swapping)
                console.log("DEU RUIM, invisible", this.player.gems[lineIndexB][indexB].invisible)
                console.table(this.player.gems)
            }
            // It only works because by the time the animation is finished, the swap has already inverted the order.
            // This is to allow the swap on the array to happen first and have fast cells swapping.
            console.log("reset, after lineIndex", lineIndexB)
            console.log("reset, after index", indexB)
            this.player.gems[lineIndexB][indexB].invisible = false
            this.player.gems[lineIndexB][indexB].swapping = false
            this.player.gems[lineIndexB][indexB].swapReplicaRef = undefined
        }

        // It only works because by the time the animation is finished, the swap has already inverted the order.
        // This is to allow the swap on the array to happen first and have fast cells swapping.
        if (this.player.gems[lineIndexB][indexB].swapping) {
            reset()
        }

        this.player.gems[lineIndexA][indexA].invisible = true
        this.player.gems[lineIndexA][indexA].swapping = true

        let x = Constants.GEM_SIZE * indexA
        let y = Constants.GEM_SIZE * lineIndexA

        let destX = Constants.GEM_SIZE * indexB
        let destY = Constants.GEM_SIZE * lineIndexB

        let color = typeToColorMap.get(this.player.gems[lineIndexA][indexA].type)


        // If color is undefined, it is an empty cell, so no need to animate anything
        // if (color === undefined) {
        //     reject()
        //     return promise
        // }

        let obj = this.player.gems[lineIndexA][indexA].swapReplicaRef || this.gemsContainer.add([
            this.k.pos(x, y),
            this.k.rect(Constants.GEM_SIZE, Constants.GEM_SIZE),
            this.k.color(color),
            this.k.outline(2, this.k.WHITE),
            this.k.animate(),
            this.k.z(2)
        ])

        obj.add([
            this.k.pos(2, 2),
            this.k.text(this.player.gems[lineIndexA][indexA].value.toString(), {
                size: 12,
                font: "numbers",
                width: 32,
                // color: this.k.WHITE
            }),
            this.k.z(2)
        ])

        this.player.gems[lineIndexA][indexA].swapReplicaRef = obj

        // obj.unanimateAll()
        obj.animation.seek(0)

        obj.animate("pos", [this.k.vec2(x, y), this.k.vec2(destX, destY)], { duration, loops: 1, easing })


        obj.onAnimateFinished(() => {
            reset()
            resolve(obj)
        })

        return promise
    }

}