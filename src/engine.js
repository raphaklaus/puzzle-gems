import kaplay from "kaplay";

const k = kaplay();

k.loadRoot("./"); // A good idea for Itch.io publishing later

const gemSize = 32;
const gemPerLine = 6;
const initialGemsHeight = 4
const maxGemsHeight = 10

const typeToColorMap = new Map()
typeToColorMap.set(0, "#a6ffa7")
typeToColorMap.set(1, "#ff3d3d")
typeToColorMap.set(2, "#5a83ff")
typeToColorMap.set(3, "#fff6b1")
typeToColorMap.set(4, "#f08eff")

let gemsContainer;
let nextLineContainer;

let cursor;
let auxCursorDir = k.vec2(1, 0);
let gems = []
let direction = k.vec2(0, 0)
let cellX
let cellY
let score = 0
let newLineTimer
const BASE_NEW_LINE_TIME = 5
const SCREEN_MID = k.vec2((k.width() / 2) - gemPerLine * gemSize / 2, k.height() / 2)

// console.log(typeToColorMap.size)

k.scene("engine", () => {
    gemsContainer = k.add([
        k.pos(0, 0)
    ])

    gemsContainer.moveTo(SCREEN_MID)

    gems = setupGems()

    nextLineContainer = k.add([
        k.pos(SCREEN_MID.x, SCREEN_MID.y + ((gems.length) * gemSize)),
        k.rect(gemPerLine * gemSize, gemSize),
        k.color("black"),
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
        k.rect(32, 32),
        k.outline(4, k.WHITE),
        k.fill(false),
        k.z(2),
    ])

    let auxCursor = cursor.add([
        k.pos(32, 0),
        k.rect(32, 32),
        k.outline(4, k.WHITE),
        k.fill(false),
        k.z(2)
    ])

    cursor.onKeyPress("left", () => {
        direction = k.vec2(-1, 0)
        if (!isOutOfBounds(direction)) {
            cursor.moveTo((cursor.pos.x - 32), cursor.pos.y)
        }
    })

    cursor.onKeyPress("right", () => {
        direction = k.vec2(1, 0)
        if (!isOutOfBounds(direction)) {
            cursor.moveTo((cursor.pos.x + 32), cursor.pos.y)
        }
    })

    cursor.onKeyPress("up", () => {
        direction = k.vec2(0, -1)
        if (!isOutOfBounds(direction)) {
            cursor.moveTo(cursor.pos.x, cursor.pos.y - 32)
        }
    })

    cursor.onKeyPress("down", () => {
        direction = k.vec2(0, 1)
        if (!isOutOfBounds(direction)) {
            cursor.moveTo(cursor.pos.x, cursor.pos.y + 32)
        }
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

    cursor.onKeyPress("enter", () => {
        let lineIndex = cellY
        let index = cellX
        // console.log('aux pos', auxCursor.pos)
        // console.log("blah", auxCursor.toOther(auxCursor, cursor.pos))
        console.log("cursor", cursor.pos.x)
        let lineIndexAux = (cursor.pos.y + (gemSize * auxCursorDir.y)) / gemSize
        let indexAux = (cursor.pos.x + (gemSize * auxCursorDir.x)) / gemSize
        console.log("lineIndexAux", lineIndexAux)
        console.log("indexAux", indexAux)
        swap(lineIndex, index, lineIndexAux, indexAux);
        updateGemLocation(lineIndex, index, lineIndexAux, indexAux);
        gravity()
        checkForAMatch(gems, true)
    })

    k.onUpdate(() => {
        cellX = cursor.pos.x / gemSize;
        cellY = cursor.pos.y / gemSize
        console.log(cellY)
    })

    k.onDraw(() => {
        k.drawText({ text: `Score: ${score.toString()}`, width: 400, font: "sans-serif", size: 48, pos: k.vec2(k.width() / 2, 200), color: k.color("black") })
    })

    newLineTimer.loop(BASE_NEW_LINE_TIME, () => {
        // gems.push(generateGemsLine(gems.length))
        // gemsContainer.moveTo(gemsContainer.pos.x, gemsContainer.pos.y - gemSize)
        // checkForAMatch(gems, true)
        console.table(gems)
    })

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
    let result = [];

    for (let lineIndex = 0; lineIndex < initialGemsHeight; lineIndex++) {
        result[lineIndex] = generateGemsLine(lineIndex)
    }

    return result
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
                            gemRef.animate("opacity", [1, 0], { duration: 0.5, loops: 1 });
                            gemRef.onAnimateChannelFinished((name) => {
                                if (name === "opacity") {
                                    gemRef.destroy()
                                    console.log("destroy!!")
                                    gravity()
                                }
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
                            gemRef.animate("opacity", [1, 0], { duration: 0.5, loops: 1 });
                            gemRef.onAnimateChannelFinished((name) => {
                                if (name === "opacity") {
                                    gemRef.destroy()
                                    console.log("destroy!!")
                                    gravity()
                                }
                            })
                        } else {
                            gemRef.destroy()
                            gravity()
                        }

                    }
                })
                console.table(gems)
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
                            gemRef.animate("opacity", [1, 0], { duration: 0.5, loops: 1 });
                            gemRef.onAnimateChannelFinished((name) => {
                                if (name === "opacity") {
                                    gemRef.destroy()
                                    console.log("destroy!!")
                                    gravity()
                                }
                            })
                        } else {
                            gemRef.destroy()
                            gravity()
                        }
                    }
                })
                console.table(gems)
            }

            // Match 3 vertical!
            if (lineIndex <= (gems.length - 3) && gems[lineIndex][index].type !== undefined && gems[lineIndex][index].type !== undefined && gems[lineIndex][index].type === gems[lineIndex + 1][index].type &&
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
                            gemRef.animate("opacity", [1, 0], { duration: 0.5, loops: 1 });
                            gemRef.onAnimateChannelFinished((name) => {
                                if (name === "opacity") {
                                    gemRef.destroy()
                                    console.log("destroy!!")
                                    gravity()
                                }
                            })
                        } else {
                            gemRef.destroy()
                            gravity()
                        }
                    }
                })
                console.table(gems)
            }
        }
    }
}

const gravity = () => {
    console.log("gravity called")
    console.table(gems)
    let hasEmptyCellWithGemAbove = false
    for (let lineIndex = gems.length - 1; lineIndex >= 0; lineIndex--) {
        for (let index = 0; index < gemPerLine; index++) {
            if (lineIndex <= gems.length - 1 && lineIndex > 0 &&
                gems[lineIndex][index].type === undefined && gems[lineIndex - 1][index].type !== undefined) {
                hasEmptyCellWithGemAbove = true
                // console.table(gems)
                swap(lineIndex - 1, index, lineIndex, index);
                // console.table(gems)
                updateGemLocation(lineIndex - 1, index, lineIndex, index);
            }
        }
    }


    if (hasEmptyCellWithGemAbove) {
        gravity();
    }
}

const swap = (lineIndexA, indexA, lineIndexB, indexB) => {
    console.log(`antes A: ${gems[lineIndexA][indexA].type}, antes B ${gems[lineIndexB][indexB].type}`);
    [gems[lineIndexA][indexA], gems[lineIndexB][indexB]] = [gems[lineIndexB][indexB], gems[lineIndexA][indexA]]
    console.log(`depois A: ${gems[lineIndexA][indexA].type}, depois B ${gems[lineIndexB][indexB].type}`)
    console.table(gems)
}

const updateGemLocation = (lineIndexA, indexA, lineIndexB, indexB) => {
    const refA = gems[lineIndexA][indexA].ref

    if (refA !== undefined) {
        console.log(`line Index: ${lineIndexA}, index: ${indexA}`)
        refA.animation.seek(0);
        refA.animate("pos", [refA.pos, k.vec2(gemSize * indexA, gemSize * lineIndexA)], { duration: 0.5 });
    } else {
        console.log("refA undefined")
    }

    const refB = gems[lineIndexB][indexB].ref

    if (refB !== undefined) {
        console.log(`line Index: ${lineIndexB}, index: ${indexB}`)
        refB.animation.seek(0);
        refB.animate("pos", [refB.pos, k.vec2(gemSize * indexB, gemSize * lineIndexB)], { duration: 0.5 });
    } else {
        console.log("refB undefined")
    }

}