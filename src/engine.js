import kaplay from "kaplay";

const k = kaplay();

k.loadRoot("./"); // A good idea for Itch.io publishing later

const gemSize = 32;
const gemPerLine = 6;
const initialGemsHeight = 4
const maxGemsHeight = 8

const typeToColorMap = new Map()
typeToColorMap.set(0, "#a6ffa7")
typeToColorMap.set(1, "#ff3d3d")
typeToColorMap.set(2, "#5a83ff")
typeToColorMap.set(3, "#fff6b1")
typeToColorMap.set(4, "#f08eff")

const BASE_NEW_LINE_TIME = 50000
const SCALING = 4
const SCREEN_MID = k.vec2((k.width() / 2) - (gemPerLine / 2) * gemSize * SCALING, 0)


let gemsContainer;
let nextLineContainer;

let cursor;
let auxCursorDir = k.vec2(1, 0);
let gems = Array.from({ length: maxGemsHeight }, () => Array.from({ length: gemPerLine }, () => ({ type: undefined, ref: undefined, animationPromise: Promise.resolve() })))
console.log("otario")
console.table(gems)
let direction = k.vec2(0, 0)
let cellX = 0
let cellY = 0
let score = 0
let newLineTimer
let nextLine = []
let topLine = initialGemsHeight
let controller = { timeLeft: 0 }


// console.log(typeToColorMap.size)

k.scene("game over", () => {
    k.onDraw(() => {
        k.drawText({ text: `Game over!`, width: 400, font: "sans-serif", size: 48, pos: k.vec2(k.width() / 2, 200), color: k.color("black") })
    })

})

k.scene("engine", () => {
    gemsContainer = k.add([
        k.pos(0, 0),
        k.animate(),
        k.scale(SCALING),
    ])

    gemsContainer.moveTo(SCREEN_MID)

    setupGems()

    console.log('setup')
    console.table(gems)

    nextLineContainer = k.add([
        k.pos(SCREEN_MID.x, k.height() - (2 * gemSize * SCALING)),
        k.rect(gemPerLine * gemSize, gemSize),
        k.color("black"),
        k.scale(SCALING),
        k.z(-1)
    ])

    // console.log("test", myArray)
    console.table(gems);

    // for (let lineIndex = 0; lineIndex < gems.length; lineIndex++) {
    //     for (let index = 0; index < gemPerLine; index++) {
    //         drawGem(lineIndex, index, gems[lineIndex][index])
    //     }
    // }

    checkForAMatch(gems)
    gravity()
    // console.table("after check for a match", JSON.parse(JSON.stringify(gems)));

    newLineTimer = k.add([
        timer()
    ])

    cursor = gemsContainer.add([
        k.pos(0, 0),
        k.rect(gemSize, gemSize),
        k.outline(4, k.WHITE),
        k.fill(false),
        k.z(2),
    ])

    let auxCursor = cursor.add([
        k.pos(gemSize, 0),
        k.rect(gemSize, gemSize),
        k.outline(4, k.WHITE),
        k.fill(false),
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

    cursor.onKeyPress("enter", () => {
        let lineIndex = cellY
        let index = cellX

        console.log("cellX", cellX)
        console.log("cellY", cellX)

        // let lineIndexAux = (cursor.pos.y + (gemSize * auxCursorDir.y)) / gemSize
        // let indexAux = (cursor.pos.x + (gemSize * auxCursorDir.x)) / gemSize

        let lineIndexAux = cellY + auxCursorDir.y
        let indexAux = cellX + auxCursorDir.x
        console.log("lineIndexAux", lineIndexAux)
        console.log("indexAux", indexAux)
        swap(lineIndex, index, lineIndexAux, indexAux);
        updateGemLocation(lineIndex, index, lineIndexAux, indexAux);
        checkForAMatch(gems, true)
        gravity()

        console.table(gems)
        console.log('topLine', topLine)
    })

    k.onUpdate(() => {
        if (topLine === 0) {
            k.go('game over')
        }
    })

    k.onDraw(() => {
        k.drawText({ text: `Score: ${controller.timeLeft.toString()}`, width: 400, font: "sans-serif", size: 48, pos: k.vec2(k.width() / 2, 200), color: k.color("black") })
    })

    controller = newLineTimer.loop(BASE_NEW_LINE_TIME, () => {

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

        let promises = gems.flat().map(gem => gem.animationPromise)

        console.log(promises)

        Promise.all(promises).then((gem) => {
            console.log("All animation complete!")
            nextLine = generateGemsLine(gems.length)
            gems.push(nextLine)
            gems.shift()
            checkForAMatch(gems, true)
            console.table(gems)

            gems.forEach(lines => {
                lines.forEach(gem => {
                    if (gem.ref !== undefined) {

                        let oldPos = gem.ref.pos
                        gem.ref.animation.seek(0)
                        gem.ref.animate("pos", [oldPos, k.vec2(gem.ref.pos.x, gem.ref.pos.y - gemSize)], { duration: 1, loops: 1 })
                    }
                })
            })

        })

        // setTimeout(() => {
        //     let oldPosX = gemsContainer.pos.x
        //     let oldPosY = gemsContainer.pos.y
        //     nextLine = generateGemsLine(gems.length)
        //     console.log("nextLine")
        //     console.table(nextLine)
        //     gems.push(nextLine)
        //     gems.shift()
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
        ref: drawGem(lineIndex, index, typeToColorMap.get(type))
    }
}

const DISAPPEAR_ANIM_DURATION = 0.5;
const checkForAMatch = (gems, isGamePlayMatch = false) => {
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
                    gems[lineIndex][index],
                    gems[lineIndex][index + 1],
                    gems[lineIndex][index + 2],
                    gems[lineIndex][index + 3]

                ]

                toBeRemoved.forEach(gem => {
                    if (gem.ref !== undefined) {
                        gem.ref.animation.seek(0);
                        let gemRef = gem.ref
                        // Need to do it separately to avoid motation problems
                        gem.type = undefined
                        gem.ref = undefined

                        if (isGamePlayMatch) {
                            gemRef.animate("opacity", [1, 0], { duration: DISAPPEAR_ANIM_DURATION, loops: 1 });
                            gem.animationPromise = new Promise((resolve, reject) => {
                                gemRef.onAnimateChannelFinished((name) => {
                                    if (name === "opacity") {
                                        resolve(gem)
                                        gemRef.destroy()
                                        console.log("destroy!!")
                                        gravity()
                                    }
                                })
                            })
                        } else {
                            gemRef.destroy()
                            gravity()
                        }

                    }
                })
                console.table(gems)
            }

            // Match 3 horizontal!
            if (index <= (gemPerLine - 3) && gems[lineIndex][index].type !== undefined && gems[lineIndex][index].type === gems[lineIndex][index + 1].type &&
                gems[lineIndex][index + 2].type === gems[lineIndex][index].type) {
                console.log("Match 3 horizontal!")

                if (isGamePlayMatch) {
                    score += 300
                }

                let toBeRemoved = [
                    gems[lineIndex][index],
                    gems[lineIndex][index + 1],
                    gems[lineIndex][index + 2]

                ]

                toBeRemoved.forEach(gem => {
                    if (gem.ref !== undefined) {
                        gem.ref.animation.seek(0);
                        let gemRef = gem.ref
                        // Need to do it separately to avoid motation problems
                        gem.type = undefined
                        gem.ref = undefined

                        if (isGamePlayMatch) {
                            gemRef.animate("opacity", [1, 0], { duration: DISAPPEAR_ANIM_DURATION, loops: 1 });
                            gem.animationPromise = new Promise((resolve, reject) => {
                                gemRef.onAnimateChannelFinished((name) => {
                                    if (name === "opacity") {
                                        resolve(gem)
                                        gemRef.destroy()
                                        console.log("destroy!!")
                                        gravity()
                                    }
                                })
                            })
                        } else {
                            gemRef.destroy()
                            gravity()
                        }

                    }
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
                    gems[lineIndex][index],
                    gems[lineIndex + 1][index],
                    gems[lineIndex + 2][index],
                    gems[lineIndex + 3][index]

                ]


                toBeRemoved.forEach(gem => {
                    if (gem.ref !== undefined) {
                        gem.ref.animation.seek(0);
                        let gemRef = gem.ref
                        // Need to do it separately to avoid motation problems
                        gem.type = undefined
                        gem.ref = undefined
                        if (isGamePlayMatch) {
                            gemRef.animate("opacity", [1, 0], { duration: DISAPPEAR_ANIM_DURATION, loops: 1 });
                            gem.animationPromise = new Promise((resolve, reject) => {
                                gemRef.onAnimateChannelFinished((name) => {
                                    if (name === "opacity") {
                                        resolve(gem)
                                        gemRef.destroy()
                                        console.log("destroy!!")
                                        gravity()
                                    }
                                })
                            })
                        } else {
                            gemRef.destroy()
                            gravity()
                        }
                    }
                })
                // console.table(gems)
            }

            // Match 3 vertical!
            if (lineIndex <= (gems.length - 3) && gems[lineIndex][index].type !== undefined && gems[lineIndex][index].type === gems[lineIndex + 1][index].type &&
                gems[lineIndex + 2][index].type === gems[lineIndex][index].type) {
                console.log("Match 3 vertical!")
                if (isGamePlayMatch) {
                    score += 300
                }
                let toBeRemoved = [
                    gems[lineIndex][index],
                    gems[lineIndex + 1][index],
                    gems[lineIndex + 2][index]

                ]

                toBeRemoved.forEach(gem => {
                    if (gem.ref !== undefined) {
                        gem.ref.animation.seek(0);
                        let gemRef = gem.ref
                        // Need to do it separately to avoid motation problems
                        gem.type = undefined
                        gem.ref = undefined
                        if (isGamePlayMatch) {
                            gemRef.animate("opacity", [1, 0], { duration: DISAPPEAR_ANIM_DURATION, loops: 1 });
                            gem.animationPromise = new Promise((resolve, reject) => {
                                gemRef.onAnimateChannelFinished((name) => {
                                    if (name === "opacity") {
                                        resolve(gem)
                                        gemRef.destroy()
                                        console.log("destroy!!")
                                        gravity()
                                    }
                                })
                            })
                        } else {
                            gemRef.destroy()
                            gravity()
                        }
                    }
                })
                // console.table(gems)
            }
        }
    }


    topLine = getTopLine()
}

const gravity = () => {
    console.log("gravity called")
    // console.table(gems)
    for (let lineIndex = gems.length - 1; lineIndex >= 0; lineIndex--) {
        for (let index = 0; index < gemPerLine; index++) {
            if (lineIndex <= gems.length - 1) {
                console.log("GRAVITY!")
                // console.table(gems)
                let collisionDepth = findCollision(lineIndex, index, 1)
                console.log("UUUUUUUUUUUUUUUUUUUUUUUUUU", collisionDepth)
                if (collisionDepth > 1) {
                    console.log("AHUISAUISHUAHISAUHISAUIHSAHUISAUIHSAUIHSAUHISAUHISAUIHS")
                    swap(lineIndex + collisionDepth - 1, index, lineIndex, index);
                    // console.table(gems)
                    updateGemLocation(lineIndex + collisionDepth - 1, index, lineIndex, index);
                }
            }
        }
    }

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
    // console.log(`antes A: ${gems[lineIndexA][indexA].type}, antes B ${gems[lineIndexB][indexB].type}`);
    [gems[lineIndexA][indexA], gems[lineIndexB][indexB]] = [gems[lineIndexB][indexB], gems[lineIndexA][indexA]]
    // console.log(`depois A: ${gems[lineIndexA][indexA].type}, depois B ${gems[lineIndexB][indexB].type}`)
    // console.table(gems)
}


const updateGemLocation = (lineIndexA, indexA, lineIndexB, indexB) => {
    const SWAP_ANIM_DURATION = 0.5;
    const refA = gems[lineIndexA][indexA].ref

    if (refA !== undefined) {
        // console.log(`line Index: ${lineIndexA}, index: ${indexA}`)
        console.log("serialize")
        console.table(refA.serializeAnimations())
        refA.animation.seek(0)
        refA.animate("pos", [refA.pos.clone(), k.vec2(gemSize * indexA, gemSize * lineIndexA)], { duration: SWAP_ANIM_DURATION, loops: 1 });
        console.log("after serialize")
        console.table(refA.serializeAnimations())

        const { resolve, promise } = Promise.withResolvers()

        gems[lineIndexA][indexA].animationPromise = promise

        refA.onAnimateChannelFinished((name) => {
            if (name === "pos") {
                gems[lineIndexA][indexA].animationPromise = resolve(gems[lineIndexA][indexA])
            }
        })
    }
    // else {
    //     console.log("refA undefined")
    // }

    const refB = gems[lineIndexB][indexB].ref

    if (refB !== undefined) {
        // console.log(`line Index: ${lineIndexB}, index: ${indexB}`)
        console.log("before serialize")
        console.table(refB.serializeAnimations())

        refB.animation.seek(0)
        refB.animate("pos", [refB.pos.clone(), k.vec2(gemSize * indexB, gemSize * lineIndexB)], { duration: SWAP_ANIM_DURATION, loops: 1 });

        const { resolve, promise } = Promise.withResolvers()
        console.log("withResolver")
        console.log(promise)

        gems[lineIndexB][indexB].animationPromise = promise

        console.log("after serialize")
        console.table(refB.serializeAnimations())

        refB.onAnimateChannelFinished((name) => {
            if (name === "pos") {
                gems[lineIndexB][indexB].animationPromise = resolve(gems[lineIndexB][indexB])
            }
        })
    }
    // else {
    //     console.log("refB undefined")
    // }

}