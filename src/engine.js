import kaplay from "kaplay";

const k = kaplay();

k.loadRoot("./"); // A good idea for Itch.io publishing later

const gemSize = 32;
const gemPerLine = 6;
const initialGemsHeight = 4

const typeToColorMap = new Map()
typeToColorMap.set(0, "#a6ffa7")
typeToColorMap.set(1, "#ff3d3d")
typeToColorMap.set(2, "#5a83ff")
typeToColorMap.set(3, "#fff6b1")
typeToColorMap.set(4, "#f08eff")

let cursor;
let auxCursorDir = k.vec2(1, 0);
let gems = []
let direction = k.vec2(0, 0)
let cellX
let cellY

// console.log(typeToColorMap.size)

k.scene("engine", () => {
    gems = setupGems()

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

    cursor = k.add([
        k.pos(0, 0),
        k.rect(32, 32),
        k.outline(4, k.WHITE),
        k.fill(false),
    ])

    let auxCursor = cursor.add([
        k.pos(32, 0),
        k.rect(32, 32),
        k.outline(4, k.WHITE),
        k.fill(false),
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
        console.log('aux pos', auxCursor.pos)
        let lineIndexAux = (auxCursor.worldPos.y / gemSize)
        let indexAux = auxCursor.worldPos.x / gemSize
        swap(lineIndex, index, lineIndexAux, indexAux);
        updateGemLocation(lineIndex, index, lineIndexAux, indexAux);
        checkForAMatch(gems)
        gravity()
        checkForAMatch(gems)
    })

    k.onUpdate(() => {
        cellX = cursor.pos.x / gemSize;
        cellY = cursor.pos.y / gemSize
    })

    k.onKeyPress("space", () => {
        gravity();
    })
})

k.go("engine")
// let myArray = []
const drawGem = (lineIndex, index, color) => {
    // myArray[lineIndex][index] = k.vec2(gemSize * index, gemSize * lineIndex)
    return k.add([
        k.pos(gemSize * index, gemSize * lineIndex),
        k.rect(gemSize, gemSize),
        k.color(color),
        k.animate()
    ])
}

const isOutOfBounds = (direction) => {
    let x = cursor.pos.x / gemSize;
    let y = cursor.pos.y / gemSize

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

const checkForAMatch = (gems) => {
    for (let lineIndex = 0; lineIndex < gems.length; lineIndex++) {
        for (let index = 0; index < gemPerLine; index++) {
            // Match 3 horizontal!
            // if (index <= (gemPerLine - 4) && gems[lineIndex][index].type === gems[lineIndex][index + 1].type &&
            //     gems[lineIndex][index + 2].type === gems[lineIndex][index].type) {
            //     // console.log("Match 3 horizontal!")
            //     // gems[lineIndex][index] = { type: undefined, color: k.color(0, 0, 0, 0) }
            //     // gems[lineIndex][index + 1] = { type: undefined, color: k.color(0, 0, 0, 0) }
            //     // gems[lineIndex][index + 2] = { type: undefined, color: k.color(0, 0, 0, 0) }
            // }

            // Match 3 vertical!
            if (lineIndex <= (gems.length - 3) && gems[lineIndex][index].type !== undefined && gems[lineIndex][index].type === gems[lineIndex + 1][index].type &&
                gems[lineIndex + 2][index].type === gems[lineIndex][index].type) {
                console.log("Match 3 vertical!")
                gems[lineIndex][index].ref.destroy()
                gems[lineIndex][index] = { type: undefined }

                gems[lineIndex + 1][index].ref.destroy()
                gems[lineIndex + 1][index] = { type: undefined }

                gems[lineIndex + 2][index].ref.destroy()
                gems[lineIndex + 2][index] = { type: undefined }
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