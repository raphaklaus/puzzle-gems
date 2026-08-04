import kaplay, { GameObj } from "kaplay";

import { defaultProperties, generateRandomNumber, getHighScore, setupLocalStorage, saveHighScore } from "./utils";

// import * as Engine from "./engine";
import { Board } from "./board";
import { Player } from "./player";
import { GameType, Layout, PlayingMode } from "./types";
import * as Constants from './constants'

const k = kaplay({ letterbox: true, width: 1920, height: 1080 });

k.loadRoot("./"); // A good idea for Itch.io publishing later
k.loadFont("numbers", "numbers.ttf")

k.loadSprite("border", "border.png")


k.setBackground(k.Color.fromHex("#ffcf82"))


let highScore = getHighScore()


// k.scene("game over", () => {
//     saveHighScore(score)

//     k.onDraw(() => {
//         k.drawText({ font: "numbers", text: `Game over! Your score is: ${score.toString()}`, width: k.width(), size: 48, pos: k.vec2(0, 200), color: k.color("black"), align: "center" })

//         if (score > highScore) {
//             k.drawText({ font: "numbers", text: `Congratulations! You beat the high score!`, width: k.width(), size: 48, pos: k.vec2(0, 300), color: k.color("black"), align: "center" })
//         }
//     })


//     k.onKeyPress("space", () => {
//         k.go("engine")
//     })

// })

interface SceneParams {
    playingMode: PlayingMode,
    gameType: GameType
}


k.scene("1p", async (params: SceneParams) => {
    const level = k.add(["global"])
    // k.debug.inspect = true
    let boards: Board[] = []

    if (params.playingMode === PlayingMode.Versus2P) {
        boards = [
            new Board({ k: k, pos: k.vec2(0, 0), gameType: params.gameType }),
            new Board({ k: k, pos: k.vec2(k.width() - (Constants.GEM_SIZE * Constants.GEM_PER_LINE * Constants.SCALING), 0), gameType: params.gameType })
        ]
    }

    k.on("results", "global", (_obj: GameObj, args: any[]) => {
        boards.forEach(board => {
            const losingBoard = args[0] as Board
            console.log("eta losing", losingBoard)
            console.log("eta board", board)
            if (losingBoard.player.id === board.player.id) {
                k.trigger("lost", board.player.id)
                board.gemsContainer.add([
                    k.text(`${losingBoard.player.id} lost`, { size: 24 }),
                    k.pos(0, 0)
                ])
            } else {
                k.trigger("won", board.player.id)
                board.gemsContainer.add([
                    k.text(`${board.player.id} won`, { size: 24 }),
                    k.pos(k.vec2(0, 0))
                ])
            }
            board.showResults()
        })
    })

    k.onUpdate(() => {
        boards.forEach(board => {
            board.update()
            // if (board.player.gemsReachedTop()) {
            // board.showResults()
            // k.go("game over")
            // }
        })
    })

})

k.go("1p", { playingMode: PlayingMode.Versus2P, gameType: GameType.Survival })