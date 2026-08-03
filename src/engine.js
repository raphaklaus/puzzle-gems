import kaplay from "kaplay";

import { defaultProperties, generateRandomNumber, getHighScore, setupLocalStorage, saveHighScore } from "./utils";

const k = kaplay({
    global: false
})

export const gemSize = 32;
export const gemPerLine = 6;
export const initialGemsHeight = 4
export const maxGemsHeight = 8

const ANIMATION_GRAVITY_DURATION = 0.2
const ANIMATION_SWAPPING_DURATION = 0.25

export const typeToColorMap = new Map()
typeToColorMap.set(0, k.Color.fromHex("#a6ffa7"))
typeToColorMap.set(1, k.Color.fromHex("#ff3d3d"))
typeToColorMap.set(2, k.Color.fromHex("#5a83ff"))
typeToColorMap.set(3, k.Color.fromHex("#d9b93b"))
typeToColorMap.set(4, k.Color.fromHex("#f08eff"))

export const BASE_NEW_LINE_TIME = 3
export const SCALING = 4
export const SCREEN_MID = k.vec2((k.width() / 2) - (gemPerLine / 2) * gemSize * SCALING, 0)
export const GAME_TYPE_1_DURATION = 120

let topLine = initialGemsHeight

k.setBackground(k.Color.fromHex("#ffcf82"))

let highScore = getHighScore()
// console.log(typeToColorMap.size)

export const initializeGems = () => Array.from({ length: maxGemsHeight }, () => Array.from({ length: gemPerLine }, () => ({ type: undefined, ref: undefined, ...defaultProperties(), value: generateRandomNumber() })))

const gemsReachedTop = () => {
    if (topLine === 0) {
        topLine = initialGemsHeight
        k.go('game over')
    }

}


const moveCursorUp = () => {
    cursor.moveTo(cursor.pos.x, cursor.pos.y - gemSize)
    if (cursor.pos.y < 0) {
        cursor.pos.y = 0
    }
    cellY = cursor.pos.y / gemSize
}

const makeGrid = (colorAlternation) => {
    return [
        k.color(k.BLACK),
        k.opacity(colorAlternation ? 0.1 : 0.05),
        k.rect(gemSize, gemSize, { radius: 1 }),
    ]
}

export const gridSetup = (gemsContainer) => {
    for (let lineIndex = 0; lineIndex < maxGemsHeight + initialGemsHeight; lineIndex++) {
        for (let index = 0; index < gemPerLine; index++) {
            let obj = gemsContainer.add(makeGrid((lineIndex + index) % 2))

            obj.use(k.pos(index * gemSize, lineIndex * gemSize))
            obj.use(k.z(-1))
        }
    }
}


export const isAllMovementDone = () => {
    return gems.flat().every(gem => gem.swapping === false)
}

const sleep = (ms) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms)
    })
}


// let myArray = []
// const drawGem = (lineIndex, index, color) => {
//     // myArray[lineIndex][index] = k.vec2(gemSize * index, gemSize * lineIndex)
//     return gemsContainer.add([
//         k.pos(gemSize * index, gemSize * lineIndex),
//         k.rect(gemSize, gemSize),
//         k.color(color),
//         k.animate()
//     ])
// }

const getTopLine = (gems) => {
    let result
    for (let lineIndex = 0; lineIndex < gems.length; lineIndex++) {
        if (gems[lineIndex].some(gems => gems.type !== undefined)) {
            result = lineIndex
            break;
        }
    }

    return result
}



export const isOutOfBounds = (auxCursorDir, gems, direction) => {
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

export const setupGems = (gems) => {
    for (let lineIndex = maxGemsHeight - 1; lineIndex >= maxGemsHeight - initialGemsHeight; lineIndex--) {
        gems[lineIndex] = generateGemsLine(lineIndex)
    }

}

export const generateGemsLine = (lineIndex, invisible = false) => {
    let line = []
    let possibleChoices = []
    typeToColorMap.forEach((value, key) => {
        possibleChoices.push(key)
    })

    possibleChoices = k.shuffle(possibleChoices)

    for (let index = 0; index < gemPerLine; index++) {
        line.push(generateGem(possibleChoices, lineIndex, index, invisible))
    }

    return line
}

export const generateGem = (possibleChoices, lineIndex, index, invisible = false) => {
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

export const applyEffectors = async (gems, gemsContainer, isSetup) => {
    console.log("APPLY EFFECTORS")
    let result = checkForAMatch(gems, isSetup)

    await Promise.all(animateMatching(gems, gemsContainer, result))

    let danglingCells = gravity(gems)

    console.log('danglingCells', danglingCells)

    let gravityAnimationPromises = danglingCells.map(cellAboveGround => {
        const [lineIndex, index] = cellAboveGround[0]
        const [lineIndexEmpty, indexEmpty] = cellAboveGround[1]

        return updateGemLocation(gems, gemsContainer, lineIndex, index, lineIndexEmpty, indexEmpty, { duration: ANIMATION_GRAVITY_DURATION, easing: k.easings.easeInCubic })
    })

    await Promise.all(gravityAnimationPromises)

    result = checkForAMatch(gems, isSetup)
    await Promise.all(animateMatching(gems, gemsContainer, result))

    if (result.length > 0 || danglingCells.length > 0) {
        await applyEffectors(gems, gemsContainer, isSetup)
    }
}

export const animateMatching = (gems, gemsContainer, matchedGemsIndices) => {
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

export const animate = (gems, gemsContainer, lineIndexA, indexA, lineIndexB, indexB, animation) => {
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
        k.animate(),
        k.z(2)
    ])

    obj.add([
        k.pos(2, 2),
        k.text(gems[lineIndexA][indexA].value.toString(), {
            size: 12,
            font: "numbers",
            width: 32,
            color: k.WHITE
        }),
        k.z(2)
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
const checkForAMatch = (gems, isGamePlayMatch = true) => {
    let result = []
    for (let lineIndex = 0; lineIndex < gems.length; lineIndex++) {
        for (let index = 0; index < gemPerLine; index++) {
            // Match 4 horizontal!
            if (index <= (gemPerLine - 4) && gems[lineIndex][index].type !== undefined && gems[lineIndex][index].type === gems[lineIndex][index + 1].type &&
                gems[lineIndex][index + 2].type === gems[lineIndex][index].type && gems[lineIndex][index + 3].type === gems[lineIndex][index].type) {
                console.log("Match 4 horizontal!")

                if (isGamePlayMatch) {
                    score += 4
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

                    if (isGamePlayMatch) {
                        score += gems[lineIndex][index].value
                    }

                    result.push(gemIndices)
                })
            }

            // Match 3 horizontal!
            if (index <= (gemPerLine - 3) && gems[lineIndex][index].type !== undefined && gems[lineIndex][index].type === gems[lineIndex][index + 1].type &&
                gems[lineIndex][index + 2].type === gems[lineIndex][index].type) {
                console.log("Match 3 horizontal!")

                if (isGamePlayMatch) {
                    score += 3
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

                    if (isGamePlayMatch) {
                        score += gems[lineIndex][index].value
                    }

                    result.push(gemIndices)
                })
                // console.table(gems)
            }

            // Match 4 vertical!
            if (lineIndex <= (gems.length - 4) && gems[lineIndex][index].type !== undefined && gems[lineIndex][index].type === gems[lineIndex + 1][index].type &&
                gems[lineIndex + 2][index].type === gems[lineIndex][index].type && gems[lineIndex + 3][index].type === gems[lineIndex][index].type) {
                console.log("Match 4 vertical!")
                if (isGamePlayMatch) {
                    score += 4
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

                    if (isGamePlayMatch) {
                        score += gems[lineIndex][index].value
                    }

                    result.push(gemIndices)
                })
            }

            // Match 3 vertical!
            if (lineIndex <= (gems.length - 3) && gems[lineIndex][index].type !== undefined && gems[lineIndex][index].type === gems[lineIndex + 1][index].type &&
                gems[lineIndex + 2][index].type === gems[lineIndex][index].type) {
                console.log("Match 3 vertical!")
                if (isGamePlayMatch) {
                    score += 3
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

                    if (isGamePlayMatch) {
                        score += gems[lineIndex][index].value
                    }

                    result.push(gemIndices)
                })
            }
        }
    }

    topLine = getTopLine(gems)

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

const swap = (gems, lineIndexA, indexA, lineIndexB, indexB) => {
    // console.log("SWAPPORRA");
    // console.log(`antes A: ${gems[lineIndexA][indexA].type}, antes B ${gems[lineIndexB][indexB].type}`);
    [gems[lineIndexA][indexA], gems[lineIndexB][indexB]] = [gems[lineIndexB][indexB], gems[lineIndexA][indexA]]
    // console.log(`depois A: ${gems[lineIndexA][indexA].type}, depois B ${gems[lineIndexB][indexB].type}`)
    // console.table(gems)
}


const updateGemLocation = async (gems, gemsContainer, lineIndexA, indexA, lineIndexB, indexB, animation) => {
    let promises = [
        animate(gems, gemsContainer, lineIndexA, indexA, lineIndexB, indexB, animation),
        animate(gems, gemsContainer, lineIndexB, indexB, lineIndexA, indexA, animation)
    ]

    swap(gems, lineIndexA, indexA, lineIndexB, indexB)
    let results = await Promise.allSettled(promises)
    results.forEach((result) => {
        if (result.status === "fulfilled") {
            result.value.destroy()
        }
    })

}