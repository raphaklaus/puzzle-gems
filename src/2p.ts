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
k.loadFont("score", "score.ttf")

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


k.scene("2p", async (params: SceneParams) => {
    k.add(["endGame"])
    // k.debug.inspect = true
    let boards: Board[] = []
    let scores: GameObj[] = []
    let loserCount = 0

    const scoreTemplate = (board: Board) => board.player.id === "P1" ? `<< Score: ${board.player.score.toString()}` : `Score: ${board.player.score.toString()} >>`


    if (params.playingMode === PlayingMode.Versus2P) {
        boards = [
            new Board({ k: k, pos: k.vec2(Constants.GEM_SIZE * Constants.SCALING, 100), gameType: params.gameType }),
            new Board({ k: k, pos: k.vec2(k.width() - (Constants.GEM_SIZE * Constants.GEM_PER_LINE * Constants.SCALING) - (Constants.GEM_SIZE * Constants.SCALING), 100), gameType: params.gameType })
        ]

        k.trigger("configPlayers", "P1", "P2")
        k.trigger("configPlayers", "P2", "P1")

        scores = boards.map((board, index) => {
            let score = scoreTemplate(board)
            return k.add([
                k.text(score, { font: "score", size: 48, align: 'center', width: k.width() - (Constants.GEM_SIZE * Constants.GEM_PER_LINE * Constants.SCALING * 2) }),
                k.pos((Constants.GEM_SIZE * Constants.GEM_PER_LINE * Constants.SCALING), k.height() / 2 + (index * Constants.GEM_SIZE * 2))
            ])
        })

        k.on("reachedTop", "endGame", (_obj: GameObj, args: any[]) => {
            loserCount++
            console.log("reachedTop", loserCount)

            const losingBoard = args[0] as Board


            boards.forEach(board => {
                // if (board.player.status === '')
                if (loserCount === 1) {
                    if (losingBoard === board) {
                        k.trigger("lost", board.player.id)
                    } else {
                        k.trigger("won", board.player.id)
                    }

                    board.showResults()
                } else {
                    k.trigger("tie", board.player.id)
                }


            })
        })

    }


    k.onDraw(() => {
        if (loserCount > 0) {
            k.drawText({
                text: `${boards[0].player.status}`,
                size: 48 * Constants.SCALING,
                font: "score",
                pos: k.vec2(Constants.GEM_SIZE * Constants.SCALING, k.height() / 2),
                align: 'center',
                width: Constants.GEM_SIZE * Constants.GEM_PER_LINE * Constants.SCALING,
            })

            k.drawText({
                text: `${boards[1].player.status}`,
                size: 48 * Constants.SCALING,
                align: 'center',
                font: "score",
                pos: k.vec2(k.width() - (Constants.GEM_SIZE * Constants.GEM_PER_LINE * Constants.SCALING) - (Constants.GEM_SIZE * Constants.SCALING), k.height() / 2),
                width: Constants.GEM_SIZE * Constants.GEM_PER_LINE * Constants.SCALING
                // pos: k.vec2((k.width() - Constants.GEM_SIZE * Constants.GEM_PER_LINE) + Constants.GEM_SIZE * Constants.MAX_GEMS_HEIGHT / 2, k.height() / 2)
            })
        }

    })

    k.onUpdate(() => {
        scores[0].text = scoreTemplate(boards[0])
        scores[1].text = scoreTemplate(boards[1])

        boards.forEach(board => {
            board.update()
            // if (board.player.gemsReachedTop()) {
            // board.showResults()
            // k.go("game over")
            // }
        })
    })

})

k.go("2p", { playingMode: PlayingMode.Versus2P, gameType: GameType.Survival })