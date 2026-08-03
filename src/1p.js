import kaplay from "kaplay";

import { defaultProperties, generateRandomNumber, getHighScore, setupLocalStorage, saveHighScore } from "./utils";

// import * as Engine from "./engine";
import { Board } from "./board";
import { Player } from "./player";

const k = kaplay({ letterbox: true, width: 1920, height: 1080 });

k.loadRoot("./"); // A good idea for Itch.io publishing later
k.loadFont("numbers", "numbers.ttf")

k.loadSprite("border", "border.png")


k.setBackground(k.Color.fromHex("#ffcf82"))


let highScore = getHighScore()


k.scene("game over", () => {
    saveHighScore(score)

    k.onDraw(() => {
        k.drawText({ font: "numbers", text: `Game over! Your score is: ${score.toString()}`, width: k.width(), size: 48, pos: k.vec2(0, 200), color: k.color("black"), align: "center" })

        if (score > highScore) {
            k.drawText({ font: "numbers", text: `Congratulations! You beat the high score!`, width: k.width(), size: 48, pos: k.vec2(0, 300), color: k.color("black"), align: "center" })
        }
    })


    k.onKeyPress("space", () => {
        k.go("engine")
    })

})


k.scene("1p", async () => {
    // k.debug.inspect = true
    let board = new Board({ k: k })

    k.onUpdate(() => {
        if (board.player.gemsReachedTop()) {
            k.go("game over")
        }
    })


    // let newLineTimeModifier = 0
    // let gemsContainer;
    // let nextLineContainer;

    // let cursor;
    // let auxCursorDir = k.vec2(1, 0);
    // let gems
    // console.log("Initialized")
    // console.table(gems)
    // let direction = k.vec2(0, 0)
    // let cellX = 0
    // let cellY = 0
    // let score = 0
    // let newLineTimer
    // let nextLine = []
    // let controller = { timeLeft: 0 }
    // let isTimeControl = true


    // // To show FPS
    // // k.debug.inspect = true
    // score = 0
    // gems = Engine.initializeGems()
    // auxCursorDir = k.vec2(1, 0);
    // cellX = 0
    // cellY = 0
    // highScore = getHighScore()

    // setupLocalStorage()

    // gemsContainer = k.add([
    //     k.pos(0, 0),
    //     k.animate(),
    //     k.scale(Engine.SCALING),
    // ])

    // Engine.gridSetup(gemsContainer)

    // gemsContainer.moveTo(Engine.SCREEN_MID)

    // Engine.setupGems(gems)

    // console.log('setup')
    // console.table(gems)

    // // k.add([
    // //     k.sprite("gem", { anim: "idle" }),
    // //     k.pos(0, 0),
    // //     // k.color(k.Color.fromHex("#0c720c"))
    // // ])



    // // nextLineContainer = k.add([
    // //     k.pos(SCREEN_MID.x, k.height() - (2 * gemSize * SCALING)),
    // //     k.rect(gemPerLine * gemSize, gemSize),
    // //     k.color("black"),
    // //     k.scale(SCALING),
    // //     k.z(-1)
    // // ])

    // // console.log("test", myArray)


    // // for (let lineIndex = 0; lineIndex < gems.length; lineIndex++) {
    // //     for (let index = 0; index < gemPerLine; index++) {
    // //         drawGem(lineIndex, index, gems[lineIndex][index])
    // //     }
    // // }

    // await Engine.applyEffectors(gems, gemsContainer, false)
    // // console.table("after check for a match", JSON.parse(JSON.stringify(gems)));

    // newLineTimer = k.add([
    //     timer()
    // ])

    // let gameTimer = k.add([
    //     timer()
    // ])

    // cursor = gemsContainer.add([
    //     k.pos(0, 0),
    //     k.sprite("border"),
    //     // k.rect(gemSize, gemSize),
    //     // k.outline(4, k.WHITE),
    //     // k.fill(false),
    //     k.z(4),
    // ])

    // let auxCursor = cursor.add([
    //     k.pos(Engine.gemSize, 0),
    //     k.sprite("border"),
    //     // k.rect(gemSize, gemSize),
    //     // k.outline(4, k.WHITE),
    //     // k.fill(false),
    //     k.z(4)
    // ])

    // cursor.onKeyPress("left", () => {

    //     // console.log("cellY", cellX)
    //     direction = k.vec2(-1, 0)
    //     if (!Engine.isOutOfBounds(auxCursorDir, gems, direction)) {
    //         cursor.moveTo((cursor.pos.x - Engine.gemSize), cursor.pos.y)
    //         cellX = cursor.pos.x / Engine.gemSize;
    //     }

    //     console.log("cellX", cellX)
    // })

    // cursor.onKeyPress("right", () => {

    //     // console.log("cellY", cellX)
    //     direction = k.vec2(1, 0)
    //     if (!Engine.isOutOfBounds(auxCursorDir, gems, direction)) {
    //         cursor.moveTo((cursor.pos.x + Engine.gemSize), cursor.pos.y)
    //         cellX = cursor.pos.x / Engine.gemSize;
    //     }

    //     console.log("cellX", cellX)
    // })

    // cursor.onKeyPress("up", () => {
    //     direction = k.vec2(0, -1)
    //     if (!Engine.isOutOfBounds(auxCursorDir, gems, direction)) {
    //         cursor.moveTo(cursor.pos.x, cursor.pos.y - gemSize)
    //         cellY = cursor.pos.y / Engine.gemSize
    //     }
    //     console.log("cellY", cellY)
    // })

    // cursor.onKeyPress("down", () => {
    //     direction = k.vec2(0, 1)
    //     if (!Engine.isOutOfBounds(auxCursorDir, gems, direction)) {
    //         cursor.moveTo(cursor.pos.x, cursor.pos.y + gemSize)
    //         cellY = cursor.pos.y / Engine.gemSize
    //     }

    //     console.log("cellY", cellY)
    // })

    // // Counter clock-wise
    // cursor.onKeyPress("a", () => {
    //     if (cellY === gems.length - 1 && auxCursorDir.x < 0) {
    //         return
    //     }

    //     if (cellY === 0 && auxCursorDir.x > 0) {
    //         return
    //     }

    //     if (cellX === gemPerLine - 1 && auxCursorDir.y > 0) {
    //         return
    //     }

    //     if (cellX === 0 && auxCursorDir.y < 0) {
    //         return
    //     }

    //     auxCursorDir = auxCursorDir.rotate(-90)
    //     auxCursorDir.x = Math.round(auxCursorDir.x)
    //     auxCursorDir.y = Math.round(auxCursorDir.y)
    //     auxCursor.moveTo(k.vec2(auxCursorDir.x * Engine.gemSize, auxCursorDir.y * Engine.gemSize))
    // })


    // // Clock-wise
    // cursor.onKeyPress("d", () => {
    //     if (cellY === gems.length - 1 && auxCursorDir.x > 0) {
    //         return
    //     }

    //     if (cellY === 0 && auxCursorDir.x < 0) {
    //         return
    //     }

    //     if (cellX === 0 && auxCursorDir.y > 0) {
    //         return
    //     }

    //     if (cellX === gemPerLine - 1 && auxCursorDir.y < 0) {
    //         return
    //     }

    //     auxCursorDir = auxCursorDir.rotate(90)
    //     auxCursorDir.x = Math.round(auxCursorDir.x)
    //     auxCursorDir.y = Math.round(auxCursorDir.y)
    //     auxCursor.moveTo(k.vec2(auxCursorDir.x * Engine.gemSize, auxCursorDir.y * Engine.gemSize))
    // })

    // k.onKeyPress("escape", () => { throw new Error("Stop") })

    // cursor.onKeyPress("space", async () => {
    //     console.log("TIMER IS", controller.timeLeft)
    //     let lineIndex = cellY
    //     let index = cellX

    //     console.log("cellX", cellX)
    //     console.log("cellY", cellX)


    //     let lineIndexAux = cellY + auxCursorDir.y
    //     let indexAux = cellX + auxCursorDir.x

    //     // if (gems[lineIndex][index].swapping || gems[lineIndexAux][indexAux].swapping) {
    //     //     return
    //     // }

    //     // let lineIndexAux = (cursor.pos.y + (gemSize * auxCursorDir.y)) / gemSize
    //     // let indexAux = (cursor.pos.x + (gemSize * auxCursorDir.x)) / gemSize

    //     console.log("lineIndexAux", lineIndexAux)
    //     console.log("indexAux", indexAux)
    //     await updateGemLocation(gems, lineIndex, index, lineIndexAux, indexAux, { duration: ANIMATION_SWAPPING_DURATION, easing: k.easings.easeOutCirc });
    //     await applyEffectors(gems, gemsContainer)
    // })

    // k.onKeyPress("q", () => {
    //     console.log("Showing state")
    //     console.table(gems)
    // })

    // k.onUpdate(() => {
    //     if (Engine.gemsReachedTop) {
    //         k.go("game over")
    //     }
    //     // if (topLine === 0) {
    //     //     topLine = initialGemsHeight
    //     //     k.go('game over')
    //     // }
    // })

    // gemsContainer.onDraw(() => {
    //     for (let lineIndex = 0; lineIndex < gems.length; lineIndex++) {
    //         for (let index = 0; index < Engine.gemPerLine; index++) {
    //             if (gems[lineIndex][index].invisible === true) {
    //                 continue
    //             }

    //             let type = gems[lineIndex][index].type

    //             let color = Engine.typeToColorMap.get(type) ?? k.color(0, 0, 0, 0)

    //             k.drawRect({
    //                 width: Engine.gemSize,
    //                 height: Engine.gemSize,
    //                 pos: vec2((Engine.gemSize * index), (Engine.gemSize * lineIndex)),
    //                 color,
    //                 outline: { color: k.WHITE, width: 2 },
    //                 opacity: type === undefined ? 0 : 1,
    //                 z: 2
    //             });

    //             if (gems[lineIndex][index].type !== undefined) {
    //                 k.drawText({
    //                     text: gems[lineIndex][index].value.toString(),
    //                     size: 12,
    //                     font: "numbers",
    //                     width: 32,
    //                     pos: vec2((Engine.gemSize * index) + 2, (Engine.gemSize * lineIndex) + 2),
    //                     color: k.WHITE
    //                 })
    //             }
    //         }
    //     }
    // })

    // const newLineRiser = async () => {
    //     const makeNextLineGemsVisible = (nextLine) => {
    //         nextLine.forEach(gem => {
    //             gem.invisible = false
    //         })
    //     }

    //     const animateNextLine = (nextLine, callback) => {
    //         return Promise.all(nextLine.map((gem, index) => {
    //             let obj = gemsContainer.add([
    //                 k.pos(index * Engine.gemSize, (maxGemsHeight) * Engine.gemSize),
    //                 k.rect(Engine.gemSize, Engine.gemSize),
    //                 k.color(Engine.typeToColorMap.get(gem.type)),
    //                 k.outline(2, k.WHITE),
    //                 k.animate(),
    //                 k.z(2)
    //             ])

    //             obj.add([
    //                 k.pos(2, 2),
    //                 k.text(gem.value.toString(), {
    //                     size: 12,
    //                     width: 32,
    //                     font: "numbers",
    //                     color: k.WHITE
    //                 }),
    //                 k.z(2)
    //             ])

    //             let prevPos = obj.pos.clone()

    //             obj.animate("pos", [prevPos, k.vec2(prevPos.x, (Engine.maxGemsHeight - 1) * Engine.gemSize)], { duration: 0.5, easing: k.easings.easeInOutCirc, loops: 1 })

    //             const { promise, resolve } = Promise.withResolvers()

    //             obj.onAnimateFinished(() => {
    //                 resolve()
    //                 callback(nextLine)
    //                 obj.destroy()
    //             })

    //             return promise
    //         }))
    //     }

    //     const riser = async () => {
    //         newLineTimeModifier -= 0.5
    //         nextLine = generateGemsLine(gems.length, true)
    //         gems.push(nextLine)
    //         gems.shift()
    //         moveCursorUp()
    //         await animateNextLine(nextLine, makeNextLineGemsVisible)
    //         await applyEffectors(gems, gemsContainer)

    //         if (!isTimeControl) {
    //             controller.cancel()
    //             controller = newLineTimer.loop(Math.max(BASE_NEW_LINE_TIME + newLineTimeModifier, 2), newLineRiser, undefined, true)
    //         }
    //     }

    //     if (Engine.isAllMovementDone()) {
    //         console.log("rise on first")
    //         await riser()
    //     } else {
    //         await sleep(1000)
    //         if (isAllMovementDone()) {
    //             console.log("rise on second")
    //             await riser()
    //         } else {
    //             console.log("rise not call at all")
    //         }
    //     }


    //     // setTimeout(() => {
    //     //     let oldPosX = gemsContainer.pos.x
    //     //     let oldPosY = gemsContainer.pos.y
    //     //     console.log("nextLine")
    //     //     console.table(nextLine)
    //     //     checkForAMatch(gems, true)
    //     //     console.table(gems)

    //     //     gems.forEach(lines => {
    //     //         lines.forEach(gem => {
    //     //             if (gem.ref !== undefined) {

    //     //                 let oldPos = gem.ref.pos
    //     //                 gem.ref.animation.seek(0)
    //     //                 gem.ref.animate("pos", [oldPos, k.vec2(gem.ref.pos.x, gem.ref.pos.y - gemSize)], { duration: 1, loops: 1 })
    //     //             }
    //     //         })
    //     //     })

    //     //     // setTimeout(() => {


    //     //     // }, 1000)


    //     // }, 10000)
    // }

    // if (!isTimeControl) {
    //     controller = newLineTimer.loop(BASE_NEW_LINE_TIME, newLineRiser, undefined, true)
    // } else {
    //     cursor.onKeyPress("enter", async () => {
    //         await newLineRiser()
    //     })
    //     controller = gameTimer.wait(Engine.GAME_TYPE_1_DURATION, () => {
    //         k.go("game over")
    //     })
    // }

    // k.onDraw(() => {
    //     // console.log(score)
    //     k.drawText({ font: "numbers", text: `Score: ${score.toString()}`, width: 400, size: 48, pos: k.vec2(200, 200), color: k.color("black") })
    //     k.drawText({ font: "numbers", text: `High score: ${highScore.toString()}`, width: 400, size: 48, pos: k.vec2(200, 350), color: k.color("black") })
    //     k.drawText({ font: "numbers", text: `Time: ${Math.trunc(Engine.GAME_TYPE_1_DURATION - controller.timeLeft).toString()}`, width: 400, size: 48, pos: k.vec2(1500, 300), color: k.color("black") })

    // })

    // let eventQueue = new Queue([gravity, checkForAMatch.bind(this, gems, true)])
})

k.go("1p")