import kaplay from "kaplay";

import { defaultProperties } from "./utils";
// import Stack from './stack'
import Queue from './queue'

const k = kaplay();

k.loadRoot("./"); // A good idea for Itch.io publishing later

k.loadSprite("border", "border.png")
k.loadSprite("gem", "gem.png", {
    sliceX: 240,
    sliceY: 1,
    anims: {
        idle: { from: 0, to: 239, loop: true, speed: 120 }
    }
})

const gemSize = 32;
const gemPerLine = 6;
const initialGemsHeight = 4
const maxGemsHeight = 8

const ANIMATION_GRAVITY_DURATION = 0.2
const ANIMATION_SWAPPING_DURATION = 0.25

const typeToColorMap = new Map()
typeToColorMap.set(0, k.Color.fromHex("#a6ffa7"))
typeToColorMap.set(1, k.Color.fromHex("#ff3d3d"))
typeToColorMap.set(2, k.Color.fromHex("#5a83ff"))
typeToColorMap.set(3, k.Color.fromHex("#fff6b1"))
typeToColorMap.set(4, k.Color.fromHex("#f08eff"))

const BASE_NEW_LINE_TIME = 5
const SCALING = 4
const SCREEN_MID = k.vec2((k.width() / 2) - (gemPerLine / 2) * gemSize * SCALING, 0)


let gemsContainer;
let nextLineContainer;

let cursor;
let auxCursorDir = k.vec2(1, 0);
let gems = Array.from({ length: maxGemsHeight }, () => Array.from({ length: gemPerLine }, () => ({ type: undefined, ref: undefined, ...defaultProperties() })))
console.log("Initialized")
console.table(gems)
let direction = k.vec2(0, 0)
let cellX = 0
let cellY = 0
let score = 0
let newLineTimer
let nextLine = []
let topLine = initialGemsHeight
let controller = { timeLeft: 0 }

k.setBackground(k.WHITE)

// console.log(typeToColorMap.size)

k.scene("game over", () => {
    k.onDraw(() => {
        k.drawText({ text: `Game over!`, width: 400, font: "sans-serif", size: 48, pos: k.vec2(k.width() / 2, 200), color: k.color("black") })
    })

})

k.scene("engine", async () => {
    gemsContainer = k.add([
        k.pos(0, 0),
        k.animate(),
        k.scale(SCALING),
    ])

    gemsContainer.moveTo(SCREEN_MID)

    setupGems()

    console.log('setup')
    console.table(gems)

    k.add([
        k.sprite("gem", { anim: "idle" }),
        k.pos(0, 0),
        // k.color(k.Color.fromHex("#0c720c"))
    ])



    // nextLineContainer = k.add([
    //     k.pos(SCREEN_MID.x, k.height() - (2 * gemSize * SCALING)),
    //     k.rect(gemPerLine * gemSize, gemSize),
    //     k.color("black"),
    //     k.scale(SCALING),
    //     k.z(-1)
    // ])

    // console.log("test", myArray)


    // for (let lineIndex = 0; lineIndex < gems.length; lineIndex++) {
    //     for (let index = 0; index < gemPerLine; index++) {
    //         drawGem(lineIndex, index, gems[lineIndex][index])
    //     }
    // }

    await applyEffectors(gems)
    // console.table("after check for a match", JSON.parse(JSON.stringify(gems)));

    newLineTimer = k.add([
        timer()
    ])

    cursor = gemsContainer.add([
        k.pos(0, 0),
        k.sprite("border"),
        // k.rect(gemSize, gemSize),
        // k.outline(4, k.WHITE),
        // k.fill(false),
        k.z(2),
    ])

    let auxCursor = cursor.add([
        k.pos(gemSize, 0),
        k.sprite("border"),
        // k.rect(gemSize, gemSize),
        // k.outline(4, k.WHITE),
        // k.fill(false),
        k.z(2)
    ])

    cursor.onKeyPress("left", () => {

        // console.log("cellY", cellX)
        direction = k.vec2(-1, 0)
        if (!isOutOfBounds(direction)) {
            cursor.moveTo((cursor.pos.x - gemSize), cursor.pos.y)
            cellX = cursor.pos.x / gemSize;
        }

        console.log("cellX", cellX)
    })

    cursor.onKeyPress("right", () => {

        // console.log("cellY", cellX)
        direction = k.vec2(1, 0)
        if (!isOutOfBounds(direction)) {
            cursor.moveTo((cursor.pos.x + gemSize), cursor.pos.y)
            cellX = cursor.pos.x / gemSize;
        }

        console.log("cellX", cellX)
    })

    cursor.onKeyPress("up", () => {
        direction = k.vec2(0, -1)
        if (!isOutOfBounds(direction)) {
            cursor.moveTo(cursor.pos.x, cursor.pos.y - gemSize)
            cellY = cursor.pos.y / gemSize
        }
        console.log("cellY", cellY)
    })

    cursor.onKeyPress("down", () => {
        direction = k.vec2(0, 1)
        if (!isOutOfBounds(direction)) {
            cursor.moveTo(cursor.pos.x, cursor.pos.y + gemSize)
            cellY = cursor.pos.y / gemSize
        }

        console.log("cellY", cellY)
    })

    // Counter clock-wise
    cursor.onKeyPress("a", () => {
        if (cellY === gems.length - 1 && auxCursorDir.x < 0) {
            return
        }

        if (cellY === 0 && auxCursorDir.x > 0) {
            return
        }

        if (cellX === gemPerLine - 1 && auxCursorDir.y > 0) {
            return
        }

        if (cellX === 0 && auxCursorDir.y < 0) {
            return
        }

        auxCursorDir = auxCursorDir.rotate(-90)
        auxCursorDir.x = Math.round(auxCursorDir.x)
        auxCursorDir.y = Math.round(auxCursorDir.y)
        auxCursor.moveTo(k.vec2(auxCursorDir.x * gemSize, auxCursorDir.y * gemSize))
    })


    // Clock-wise
    cursor.onKeyPress("d", () => {
        if (cellY === gems.length - 1 && auxCursorDir.x > 0) {
            return
        }

        if (cellY === 0 && auxCursorDir.x < 0) {
            return
        }

        if (cellX === 0 && auxCursorDir.y > 0) {
            return
        }

        if (cellX === gemPerLine - 1 && auxCursorDir.y < 0) {
            return
        }

        auxCursorDir = auxCursorDir.rotate(90)
        auxCursorDir.x = Math.round(auxCursorDir.x)
        auxCursorDir.y = Math.round(auxCursorDir.y)
        auxCursor.moveTo(k.vec2(auxCursorDir.x * gemSize, auxCursorDir.y * gemSize))
    })

    k.onKeyPress("escape", () => { throw new Error("Stop") })

    cursor.onKeyPress("enter", async () => {
        console.log("TIMER IS", controller.timeLeft)
        let lineIndex = cellY
        let index = cellX

        console.log("cellX", cellX)
        console.log("cellY", cellX)


        let lineIndexAux = cellY + auxCursorDir.y
        let indexAux = cellX + auxCursorDir.x

        // if (gems[lineIndex][index].swapping || gems[lineIndexAux][indexAux].swapping) {
        //     return
        // }

        // let lineIndexAux = (cursor.pos.y + (gemSize * auxCursorDir.y)) / gemSize
        // let indexAux = (cursor.pos.x + (gemSize * auxCursorDir.x)) / gemSize

        console.log("lineIndexAux", lineIndexAux)
        console.log("indexAux", indexAux)
        await updateGemLocation(lineIndex, index, lineIndexAux, indexAux, { duration: ANIMATION_SWAPPING_DURATION, easing: k.easings.easeOutCirc });
        await applyEffectors(gems)

        console.log('topLine', topLine)
    })

    k.onKeyPress("q", () => {
        console.log("Showing state")
        console.table(gems)
    })

    k.onUpdate(() => {
        if (topLine === 0) {
            k.go('game over')
        }



    })


    gemsContainer.onDraw(() => {
        for (let lineIndex = 0; lineIndex < gems.length; lineIndex++) {
            for (let index = 0; index < gemPerLine; index++) {
                if (gems[lineIndex][index].invisible === true) {
                    continue
                }

                let type = gems[lineIndex][index].type

                let color = typeToColorMap.get(type) ?? k.color(0, 0, 0, 0)

                k.drawRect({
                    width: gemSize,
                    height: gemSize,
                    pos: vec2((gemSize * index), (gemSize * lineIndex)),
                    color,
                    outline: { color: k.WHITE, width: 2 },
                    opacity: type === undefined ? 0 : 1
                });
            }
        }


        // k.drawText({ text: `Score: ${controller.timeLeft.toString()}`, width: 400, font: "sans-serif", size: 18, pos: k.vec2(0, 0), color: k.color("black") })
    })

    controller = newLineTimer.loop(BASE_NEW_LINE_TIME, async () => {

        // gemsContainer.moveTo(k.vec2(oldPosX, (oldPosY - (gemSize * SCALING))))
        // gemsContainer.animation.seek(0)
        // gemsContainer.animate("pos", [k.vec2(oldPosX, oldPosY), k.vec2(oldPosX, (oldPosY - (gemSize * SCALING)))], { duration: 2, loops: 1 })
        // nextLine.forEach(gem => {
        //     console.log("foreach")
        //     gem.ref.animation.seek(0);
        //     gem.ref.animate("pos", [k.vec2(gem.ref.pos.x, gem.ref.pos.y + (gemSize)), k.vec2(gem.ref.pos.x, gem.ref.pos.y)], { duration: 2, loops: 1 })
        //     gem.ref.onAnimateChannelFinished((name) => {
        //         console.log("finished???????????")
        //         if (name === "pos") {
        //             finishedCount += 1
        //             console.log("finished!!", finishedCount)
        //         }
        //     })
        // })
        // gemsContainer.onAnimateChannelFinished((name) => {

        // console.log("FINISHED")
        // if (name === "pos") {
        // gems[topLine] = nextLine
        // Make sure all animations have completed. Hacky solution. Review it!

        console.log("TIMER HITTTTTTTTTTTTT")

        // checks all gems are swapped/visible
        // await timeoutAnimationTime
        // checks all gems are swapped/visible
        // logs issue
        // don't rise

        const riser = async () => {
            nextLine = generateGemsLine(gems.length)
            gems.push(nextLine)
            gems.shift()
            await applyEffectors(gems)
            cursor.moveTo(cursor.pos.x, cursor.pos.y - gemSize)
            cellY = cursor.pos.y / gemSize
        }

        if (isAllMovementDone()) {
            console.log("rise on first")
            await riser()
        } else {
            await sleep(1000)
            if (isAllMovementDone()) {
                console.log("rise on second")
                await riser()
            } else {
                console.log("rise not call at all")
            }
        }






        // setTimeout(() => {
        //     let oldPosX = gemsContainer.pos.x
        //     let oldPosY = gemsContainer.pos.y
        //     console.log("nextLine")
        //     console.table(nextLine)
        //     checkForAMatch(gems, true)
        //     console.table(gems)

        //     gems.forEach(lines => {
        //         lines.forEach(gem => {
        //             if (gem.ref !== undefined) {

        //                 let oldPos = gem.ref.pos
        //                 gem.ref.animation.seek(0)
        //                 gem.ref.animate("pos", [oldPos, k.vec2(gem.ref.pos.x, gem.ref.pos.y - gemSize)], { duration: 1, loops: 1 })
        //             }
        //         })
        //     })

        //     // setTimeout(() => {


        //     // }, 1000)


        // }, 10000)

    }, undefined, true)

    // k.onKeyPress("space", () => {
    //     gravity();
    // })
})

const isAllMovementDone = () => {
    return gems.flat().every(gem => gem.swapping === false)
}

const sleep = (ms) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms)
    })
}

k.go("engine")
// let myArray = []
const drawGem = (lineIndex, index, color) => {
    // myArray[lineIndex][index] = k.vec2(gemSize * index, gemSize * lineIndex)
    return gemsContainer.add([
        k.pos(gemSize * index, gemSize * lineIndex),
        k.rect(gemSize, gemSize),
        k.color(color),
        k.animate()
    ])
}

const getTopLine = () => {
    let result
    for (let lineIndex = 0; lineIndex < gems.length; lineIndex++) {
        if (gems[lineIndex].some(gems => gems.type !== undefined)) {
            result = lineIndex
            break;
        }
    }

    return result
}



const isOutOfBounds = (direction) => {
    let maxX = auxCursorDir.x > 0 ? gemPerLine - 2 : gemPerLine - 1

    if (direction.eq(k.vec2(1, 0)) && cellX >= maxX) {
        return true
    }

    let minX = auxCursorDir.x >= 0 ? 0 : 1

    if (direction.eq(k.vec2(-1, 0)) && cellX <= minX) {
        return true
    }

    let maxY = auxCursorDir.y > 0 ? gems.length - 2 : gems.length - 1

    if (direction.eq(k.vec2(0, 1)) && cellY >= maxY) {
        return true
    }

    let minY = auxCursorDir.y < 0 ? 1 : 0

    if (direction.eq(k.vec2(0, -1)) && cellY <= minY) {
        return true
    }

    return false
}

const setupGems = () => {
    for (let lineIndex = maxGemsHeight - 1; lineIndex >= maxGemsHeight - initialGemsHeight; lineIndex--) {
        gems[lineIndex] = generateGemsLine(lineIndex)
    }

}

const generateGemsLine = (lineIndex) => {
    let line = []
    let possibleChoices = []
    typeToColorMap.forEach((value, key) => {
        possibleChoices.push(key)
    })

    possibleChoices = k.shuffle(possibleChoices)

    for (let index = 0; index < gemPerLine; index++) {
        line.push(generateGem(possibleChoices, lineIndex, index))
    }

    return line
}

const generateGem = (possibleChoices, lineIndex, index) => {
    let type

    if (possibleChoices.length === 0) {
        type = Math.floor(Math.random() * typeToColorMap.size)
    } else {
        type = possibleChoices.pop()
    }

    return {
        type,
        ...defaultProperties()
    }
}

const applyEffectors = async (gems) => {
    console.log("APPLY EFFECTORS")
    let result = checkForAMatch(gems)

    await Promise.all(animateMatching(result))

    let danglingCells = gravity(gems)

    console.log('danglingCells', danglingCells)

    let gravityAnimationPromises = danglingCells.map(cellAboveGround => {
        const [lineIndex, index] = cellAboveGround[0]
        const [lineIndexEmpty, indexEmpty] = cellAboveGround[1]

        return updateGemLocation(lineIndex, index, lineIndexEmpty, indexEmpty, { duration: ANIMATION_GRAVITY_DURATION, easing: k.easings.easeInCubic })
    })

    await Promise.all(gravityAnimationPromises)

    result = checkForAMatch(gems)
    await Promise.all(animateMatching(result))

    if (result.length > 0 || danglingCells.length > 0) {
        await applyEffectors(gems)
    }
}

const animateMatching = (matchedGemsIndices) => {
    return matchedGemsIndices
        .filter(matchedGemIndices => {
            const [lineIndex, index] = matchedGemIndices
            console.log(matchedGemIndices)
            // TODO: check that the condition below is going to affect only the previously matched gems
            return gems[lineIndex][index].type === undefined && gems[lineIndex][index].oldData.type !== undefined
        })
        .map(matchedGemIndices => {
            const { promise, resolve, reject } = Promise.withResolvers()
            const [lineIndex, index] = matchedGemIndices
            let x = gemSize * index
            let y = gemSize * lineIndex

            let color = typeToColorMap.get(gems[lineIndex][index].oldData.type)

            let obj = gems[lineIndex][index].swapReplicaRef || gemsContainer.add([
                k.pos(x, y),
                k.rect(gemSize, gemSize),
                k.color(color),
                k.outline(2, k.WHITE),
                k.animate()
            ])

            gems[lineIndex][index].invisible = true
            // obj.animation.seek(0)

            obj.animate("opacity", [1, 0], { duration: 0.35, loops: 1, easing: k.easings.easeOutExpo })

            obj.onAnimateFinished(() => {
                resolve(obj)
            })

            return promise
        })
}

const animate = (lineIndexA, indexA, lineIndexB, indexB, animation) => {
    const { duration, easing } = animation
    const { promise, resolve, reject } = Promise.withResolvers()

    console.log("Porra", gems[lineIndexA])

    if (gems[lineIndexA][indexA].type === undefined) {
        reject()
        return promise
    }

    console.log("reset, before lineIndex", lineIndexB)
    console.log("reset, before index", indexB)

    const reset = () => {
        if (gems[lineIndexB][indexB].invisible === false || gems[lineIndexB][indexB].swapping === false) {
            console.trace()
            console.log("DEU RUIM,  lineIndex", lineIndexB)
            console.log("DEU RUIM,  index", indexB)
            console.log("DEU RUIM, swapping", gems[lineIndexB][indexB].swapping)
            console.log("DEU RUIM, invisible", gems[lineIndexB][indexB].invisible)
            console.table(gems)
        }
        // It only works because by the time the animation is finished, the swap has already inverted the order.
        // This is to allow the swap on the array to happen first and have fast cells swapping.
        console.log("reset, after lineIndex", lineIndexB)
        console.log("reset, after index", indexB)
        gems[lineIndexB][indexB].invisible = false
        gems[lineIndexB][indexB].swapping = false
        gems[lineIndexB][indexB].swapReplicaRef = undefined
    }

    // It only works because by the time the animation is finished, the swap has already inverted the order.
    // This is to allow the swap on the array to happen first and have fast cells swapping.
    if (gems[lineIndexB][indexB].swapping) {
        reset()
    }

    gems[lineIndexA][indexA].invisible = true
    gems[lineIndexA][indexA].swapping = true

    let x = gemSize * indexA
    let y = gemSize * lineIndexA

    let destX = gemSize * indexB
    let destY = gemSize * lineIndexB

    let color = typeToColorMap.get(gems[lineIndexA][indexA].type)


    // If color is undefined, it is an empty cell, so no need to animate anything
    // if (color === undefined) {
    //     reject()
    //     return promise
    // }

    let obj = gems[lineIndexA][indexA].swapReplicaRef || gemsContainer.add([
        k.pos(x, y),
        k.rect(gemSize, gemSize),
        k.color(color),
        k.outline(2, k.WHITE),
        k.animate()
    ])

    gems[lineIndexA][indexA].swapReplicaRef = obj

    // obj.unanimateAll()
    obj.animation.seek(0)

    obj.animate("pos", [k.vec2(x, y), k.vec2(destX, destY)], { duration, loops: 1, easing })


    obj.onAnimateFinished(() => {
        reset()
        resolve(obj)
    })

    // For some reason, sometimes the reset() seems to not be called. This is essentialy a timeout machanism
    // setTimeout(() => {
    //     reset()
    //     resolve(obj)
    // }, (animation.duration + 0.1) * 1000)

    return promise
}

const DISAPPEAR_ANIM_DURATION = 0.5;
const checkForAMatch = (gems, isGamePlayMatch = false) => {
    let result = []
    for (let lineIndex = 0; lineIndex < gems.length; lineIndex++) {
        for (let index = 0; index < gemPerLine; index++) {
            // Match 4 horizontal!
            if (index <= (gemPerLine - 4) && gems[lineIndex][index].type !== undefined && gems[lineIndex][index].type === gems[lineIndex][index + 1].type &&
                gems[lineIndex][index + 2].type === gems[lineIndex][index].type && gems[lineIndex][index + 3].type === gems[lineIndex][index].type) {
                console.log("Match 4 horizontal!")

                if (isGamePlayMatch) {
                    score += 800
                }

                let toBeRemoved = [
                    [lineIndex, index],
                    [lineIndex, index + 1],
                    [lineIndex, index + 2],
                    [lineIndex, index + 3]

                ]

                toBeRemoved.forEach(gemIndices => {
                    const [lineIndex, index] = gemIndices
                    gems[lineIndex][index].oldData = { type: gems[lineIndex][index].type }
                    gems[lineIndex][index].type = undefined

                    result.push(gemIndices)
                })
            }

            // Match 3 horizontal!
            if (index <= (gemPerLine - 3) && gems[lineIndex][index].type !== undefined && gems[lineIndex][index].type === gems[lineIndex][index + 1].type &&
                gems[lineIndex][index + 2].type === gems[lineIndex][index].type) {
                console.log("Match 3 horizontal!")

                if (isGamePlayMatch) {
                    score += 300
                }

                let toBeRemoved = [
                    [lineIndex, index],
                    [lineIndex, index + 1],
                    [lineIndex, index + 2]

                ]

                toBeRemoved.forEach(gemIndices => {
                    const [lineIndex, index] = gemIndices
                    gems[lineIndex][index].oldData = { type: gems[lineIndex][index].type }
                    gems[lineIndex][index].type = undefined

                    result.push(gemIndices)
                })
                // console.table(gems)
            }

            // Match 4 vertical!
            if (lineIndex <= (gems.length - 4) && gems[lineIndex][index].type !== undefined && gems[lineIndex][index].type === gems[lineIndex + 1][index].type &&
                gems[lineIndex + 2][index].type === gems[lineIndex][index].type && gems[lineIndex + 3][index].type === gems[lineIndex][index].type) {
                console.log("Match 4 vertical!")
                if (isGamePlayMatch) {
                    score += 400
                }
                let toBeRemoved = [
                    [lineIndex, index],
                    [lineIndex + 1, index],
                    [lineIndex + 2, index],
                    [lineIndex + 3, index]

                ]

                toBeRemoved.forEach(gemIndices => {
                    const [lineIndex, index] = gemIndices
                    gems[lineIndex][index].oldData = { type: gems[lineIndex][index].type }
                    gems[lineIndex][index].type = undefined

                    result.push(gemIndices)
                })
            }

            // Match 3 vertical!
            if (lineIndex <= (gems.length - 3) && gems[lineIndex][index].type !== undefined && gems[lineIndex][index].type === gems[lineIndex + 1][index].type &&
                gems[lineIndex + 2][index].type === gems[lineIndex][index].type) {
                console.log("Match 3 vertical!")
                if (isGamePlayMatch) {
                    score += 300
                }
                let toBeRemoved = [
                    [lineIndex, index],
                    [lineIndex + 1, index],
                    [lineIndex + 2, index]

                ]

                toBeRemoved.forEach(gemIndices => {
                    const [lineIndex, index] = gemIndices
                    gems[lineIndex][index].oldData = { type: gems[lineIndex][index].type }
                    gems[lineIndex][index].type = undefined

                    result.push(gemIndices)
                })
            }
        }
    }

    topLine = getTopLine()

    return result
}

const gravity = (gems) => {
    console.log("gravity called")
    let result = []
    // console.table(gems)

    for (let index = 0; index < gemPerLine; index++) {
        let floor = maxGemsHeight - 1
        let isFloorSearching = true
        let getAllAbove = false
        // This count is to keep track how much the next gem should go up when the previous one is the "new floor"
        let count = 0
        for (let lineIndex = gems.length - 1; lineIndex >= 0; lineIndex--) {
            if (lineIndex >= 1) {
                if (isFloorSearching && gems[lineIndex][index].type !== undefined) {
                    floor = lineIndex - 1
                }

                if (!getAllAbove && gems[lineIndex][index].type === undefined && gems[lineIndex - 1][index].type !== undefined) {
                    getAllAbove = true
                    isFloorSearching = false

                    result.push(
                        [
                            [lineIndex - 1, index],
                            [floor - count, index]
                        ]
                    )

                    count++

                    continue
                }

                if (getAllAbove && gems[lineIndex - 1][index].type !== undefined) {
                    result.push(
                        [
                            [lineIndex - 1, index],
                            [floor - count, index]
                        ]
                    )

                    count++
                }


            }
        }
    }
    // for (let lineIndex = gems.length - 1; lineIndex >= 0; lineIndex--) {
    //     for (let index = 0; index < gemPerLine; index++) {
    //         if (lineIndex <= gems.length - 1 && gems[lineIndex][index].type !== undefined) {
    //             // console.table(gems)
    //             let collisionDepth = findCollision(lineIndex, index, 1)
    //             if (collisionDepth > 1) {
    //                 console.log("gravity effect!", collisionDepth)
    //                 result = [
    //                     [lineIndex, index],
    //                     [lineIndex + collisionDepth - 1, index],
    //                 ]
    //                 break
    //                 // swap(lineIndex, index, lineIndex + collisionDepth - 1, index)
    //                 // updateGemLocation(lineIndex + collisionDepth - 1, index, lineIndex, index);
    //             }
    //         }
    //     }
    // }
    return result
}

const findCollision = (lineIndex, index, depth) => {
    let searchLineIndex = lineIndex + depth

    if (searchLineIndex >= gems.length) {
        return depth
    }

    if (gems[searchLineIndex][index].type !== undefined) {
        return depth
    }

    return findCollision(lineIndex, index, depth + 1)
}

const swap = (lineIndexA, indexA, lineIndexB, indexB) => {
    // console.log("SWAPPORRA");
    // console.log(`antes A: ${gems[lineIndexA][indexA].type}, antes B ${gems[lineIndexB][indexB].type}`);
    [gems[lineIndexA][indexA], gems[lineIndexB][indexB]] = [gems[lineIndexB][indexB], gems[lineIndexA][indexA]]
    // console.log(`depois A: ${gems[lineIndexA][indexA].type}, depois B ${gems[lineIndexB][indexB].type}`)
    // console.table(gems)
}


const updateGemLocation = async (lineIndexA, indexA, lineIndexB, indexB, animation) => {
    let promises = [
        animate(lineIndexA, indexA, lineIndexB, indexB, animation),
        animate(lineIndexB, indexB, lineIndexA, indexA, animation)
    ]

    swap(lineIndexA, indexA, lineIndexB, indexB)
    let results = await Promise.allSettled(promises)
    results.forEach((result) => {
        if (result.status === "fulfilled") {
            result.value.destroy()
        }
    })

}

// let eventQueue = new Queue([gravity, checkForAMatch.bind(this, gems, true)])