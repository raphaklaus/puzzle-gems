import kaplay, { EaseFuncs, Game, GameObj, KAPLAYCtx, Vec2 } from "kaplay";
import { Gems } from "./gems";
import * as Constants from "./constants";
import { GameType, Layout } from "./types";
import { Player } from "./player";
import { cascadeProperty, defaultProperties, sleep } from "./utils";

const typeToColorMap = new Map()

interface BoardParams {
    k: KAPLAYCtx,
    // layout: Layout
    pos: Vec2,
    gameType: GameType
}

export class Board {
    public gemsContainer: GameObj
    private k: KAPLAYCtx
    public player: Player
    private gameType
    constructor(params: BoardParams) {
        this.k = params.k;
        this.gameType = params.gameType

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

        this.player = new Player({ gemsContainer: this.gemsContainer, k: this.k, board: this, gameType: this.gameType })

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

    public update() {
        this.player.update()
    }

    generateGrid() {
        for (let lineIndex = 0; lineIndex < Constants.MAX_GEMS_HEIGHT; lineIndex++) {
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

                    let color

                    if (type === 99) {
                        color = this.k.color(0, 0, 0)
                    } else {
                        color = typeToColorMap.get(type)
                    }

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

    public async giveBack99(index: number, cellX: number, delay: number) {
        this.player.gems[Constants.MAX_GEMS_HEIGHT - 1][index].invisible = true
        this.player.gems[Constants.MAX_GEMS_HEIGHT - 1][index].oldData = { type: this.player.gems[Constants.MAX_GEMS_HEIGHT - 1][index].type }
        this.player.gems[Constants.MAX_GEMS_HEIGHT - 1][index].type = undefined

        this.animateMatching([
            [Constants.MAX_GEMS_HEIGHT - 1, index]
        ], false)

        await sleep(delay)

        this.player.attack(cellX)
    }

    public async showResults() {
        let timer = this.k.add([this.k.timer()])
        this.player.gems.forEach((gemLine, lineIndex) => {
            gemLine.forEach((gems, index) => {
                if (gems.type === undefined) {
                    return
                }

                let x = Constants.GEM_SIZE * index
                let y = Constants.GEM_SIZE * lineIndex

                let color
                if (this.player.gems[lineIndex][index].type === 99) {
                    color = "#000000"
                } else {
                    color = typeToColorMap.get(this.player.gems[lineIndex][index].type)
                }


                let obj = this.gemsContainer.add([
                    this.k.pos(x, y),
                    this.k.rect(Constants.GEM_SIZE, Constants.GEM_SIZE),
                    this.k.color(color),
                    this.k.outline(2, this.k.WHITE),
                    this.k.animate(),
                    this.k.z(2)
                ])

                obj.add([
                    this.k.pos(2, 2),
                    this.k.text(this.player.gems[lineIndex][index].value.toString(), {
                        size: 12,
                        font: "numbers",
                        width: 32,
                        // color: this.k.WHITE
                    }),
                    this.k.z(2)
                ])

                // obj.unanimateAll()

                timer.wait((1 * (index / 4)) + (lineIndex / 3.5), () => {
                    obj.animation.seek(0)
                    obj.animate("pos", [this.k.vec2(x, y), this.k.vec2(x, this.k.height() + Constants.GEM_SIZE)], { duration: 0.75, loops: 1, easing: this.k.easings.easeInCubic })
                })


                // await sleep(50)
                // this.player.swap(lineIndex, index, Constants.MAX_GEMS_HEIGHT - 1, Constants.GEM_PER_LINE - 1)
                // await this.animate(lineIndex, index, Constants.MAX_GEMS_HEIGHT, Constants.GEM_PER_LINE, { duration: 4, easing: this.k.easings.easeInCirc })
            })
        })
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

                let color

                if (this.player.gems[lineIndex][index].oldData?.type === 99) {
                    color = "#000000"
                } else {
                    color = typeToColorMap.get(this.player.gems[lineIndex][index].oldData?.type)
                }

                console.log("matched", color)
                console.log("matched2", this.player.gems[lineIndex][index].oldData?.type)


                let obj = this.gemsContainer.add([
                    this.k.pos(x, y),
                    this.k.rect(Constants.GEM_SIZE, Constants.GEM_SIZE),
                    this.k.color(color),
                    this.k.outline(2, this.k.WHITE),
                    this.k.animate(),
                    this.k.opacity(),
                    cascadeProperty("opacity")
                ])

                obj.add([
                    this.k.pos(2, 2),
                    this.k.text(this.player.gems[lineIndex][index].value.toString(), {
                        size: 12,
                        font: "numbers",
                        width: Constants.GEM_SIZE,
                        // color: this.k.WHITE
                    }),
                    this.k.z(2),
                    this.k.animate(),
                    this.k.opacity()
                ])


                this.player.gems[lineIndex][index].invisible = true
                // obj.unanimateAll()
                obj.animation.seek(0)

                obj.animate("opacity", [1, 0], { duration: 0.35, loops: 1, easing: this.k.easings.easeOutExpo })

                obj.onAnimateChannelFinished((name) => {
                    if (name === "opacity") {
                        obj.destroy()
                        resolve(obj)
                    }
                })

                return promise
            })
    }

    private animateShake(lineIndexA: number, indexA: number, animation: { duration: number, easing: any, direction: number }) {
        const { duration, easing } = animation
        const { promise, resolve, reject } = Promise.withResolvers<GameObj>()


        const reset = () => {
            this.player.gems[lineIndexA][indexA].invisible = this.player.isPaused
            this.player.gems[lineIndexA][indexA].swapReplicaRef = undefined
            this.player.gems[lineIndexA][indexA].swapping = false
        }

        this.player.gems[lineIndexA][indexA].invisible = true
        this.player.gems[lineIndexA][indexA].swapping = true

        let x = Constants.GEM_SIZE * indexA
        let y = Constants.GEM_SIZE * lineIndexA

        let destX = x + (Constants.GEM_SIZE / 6 * animation.direction)
        let destY = y

        let color

        if (this.player.gems[lineIndexA][indexA].type === 99) {
            color = "#000000"
        } else {
            color = typeToColorMap.get(this.player.gems[lineIndexA][indexA].type)
        }

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

    public async updateGemLocation(lineIndexA: number, indexA: number, lineIndexB: number, indexB: number, animation: { duration: number, easing: any }, isSetup: boolean) {
        if (this.player.gems[lineIndexA][indexA].type === 99 && this.player.gems[lineIndexB][indexB].type !== undefined || this.player.gems[lineIndexA][indexA].type !== undefined && this.player.gems[lineIndexB][indexB].type === 99) {
            console.log("shake!")
            let promises = isSetup ? [] : [
                this.animateShake(lineIndexA, indexA, { duration: 0.3, easing: this.k.easings.easeInOutBounce, direction: 1 }),
                this.animateShake(lineIndexB, indexB, { duration: 0.3, easing: this.k.easings.easeInOutBounce, direction: -1 }),
            ]

            let results = await Promise.allSettled(promises)
            results.forEach((result) => {
                if (result.status === "fulfilled") {
                    result.value.destroy()
                }
            })
        } else {
            let promises = isSetup ? [] : [
                this.animate(lineIndexA, indexA, lineIndexB, indexB, animation),
                this.animate(lineIndexB, indexB, lineIndexA, indexA, animation)
            ]

            this.player.gems[lineIndexA][indexA].invisible = true
            this.player.gems[lineIndexB][indexB].invisible = true

            this.player.swap(lineIndexA, indexA, lineIndexB, indexB)

            let results = await Promise.allSettled(promises)

            this.player.gems[lineIndexA][indexA].invisible = false
            this.player.gems[lineIndexB][indexB].invisible = false
            results.forEach((result) => {
                if (result.status === "fulfilled") {
                    console.log("issueStrange finished anim!")
                    result.value.destroy()
                }
            })

        }
    }

    private animate(lineIndexA: number, indexA: number, lineIndexB: number, indexB: number, animation: { duration: number, easing: any }) {
        const { duration, easing } = animation
        const { promise, resolve, reject } = Promise.withResolvers<GameObj>()

        console.log("Porra", this.player.gems[lineIndexA])

        if (this.player.gems[lineIndexA][indexA].type === undefined) {
            reject("gem is undefined")
            return promise
        }

        console.log("reset, before lineIndex", lineIndexB)
        console.log("reset, before index", indexB)

        const reset = () => {
            // if (this.player.gems[lineIndexB][indexB].invisible === false || this.player.gems[lineIndexB][indexB].swapping === false) {
            // }
            // It only works because by the time the animation is finished, the swap has already inverted the order.
            // This is to allow the swap on the array to happen first and have fast cells swapping.

            console.log("reset, after lineIndex", lineIndexB)
            console.log("reset, after index", indexB)
            this.player.gems[lineIndexB][indexB].invisible = this.player.isPaused
            this.player.gems[lineIndexB][indexB].swapping = false
            // this.player.gems[lineIndexB][indexB].swapReplicaRef = undefined
        }

        // It only works because by the time the animation is finished, the swap has already inverted the order.
        // This is to allow the swap on the array to happen first and have fast cells swapping.
        // if (this.player.gems[lineIndexB][indexB].swapping) {
        //     reset()
        //     reject("canceling previous swap")
        // }

        this.player.gems[lineIndexA][indexA].invisible = true
        this.player.gems[lineIndexA][indexA].swapping = true

        let x = Constants.GEM_SIZE * indexA
        let y = Constants.GEM_SIZE * lineIndexA

        let destX = Constants.GEM_SIZE * indexB
        let destY = Constants.GEM_SIZE * lineIndexB

        let color

        if (this.player.gems[lineIndexA][indexA].type === 99) {
            color = "#000000"
        } else {
            color = typeToColorMap.get(this.player.gems[lineIndexA][indexA].type)
        }

        // If color is undefined, it is an empty cell, so no need to animate anything
        // if (color === undefined) {
        //     reject()
        //     return promise
        // }

        let obj = this.gemsContainer.add([
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
                width: Constants.GEM_SIZE,
                // color: this.k.WHITE
            }),
            this.k.z(2)
        ])

        // this.player.gems[lineIndexA][indexA].swapReplicaRef = obj

        obj.unanimateAll()
        obj.animation.seek(0)

        obj.animate("pos", [this.k.vec2(x, y), this.k.vec2(destX, destY)], { duration, loops: 1, easing })

        obj.onAnimateChannelFinished((name) => {
            if (name === "pos") {
                reset()
                resolve(obj)
            }
        })

        return promise
    }

    public animateNextLine(nextLine: Gems[], callback: (nextLine: Gems[]) => void) {
        return Promise.all(nextLine.map((gem, index) => {
            let obj = this.gemsContainer.add([
                this.k.pos(index * Constants.GEM_SIZE, (Constants.MAX_GEMS_HEIGHT) * Constants.GEM_SIZE),
                this.k.rect(Constants.GEM_SIZE, Constants.GEM_SIZE),
                this.k.color(typeToColorMap.get(gem.type)),
                this.k.outline(2, this.k.WHITE),
                this.k.animate(),
                this.k.z(2)
            ])

            obj.add([
                this.k.pos(2, 2),
                this.k.text(gem.value.toString(), {
                    size: 12,
                    width: 32,
                    font: "numbers",
                    // color: this.k.WHITE
                }),
                this.k.z(2)
            ])

            let prevPos = obj.pos.clone()

            obj.animate("pos", [prevPos, this.k.vec2(prevPos.x, (Constants.MAX_GEMS_HEIGHT - 1) * Constants.GEM_SIZE)], { duration: 0.5, easing: this.k.easings.easeInOutCirc, loops: 1 })

            const { promise, resolve } = Promise.withResolvers()

            obj.onAnimateFinished(() => {
                resolve(obj)
                callback(nextLine)
                obj.destroy()
            })

            return promise
        }))
    }
}