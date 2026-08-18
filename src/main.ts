import kaplay, { GameObj } from "kaplay";
import * as Constants from "./constants";
import { GameType, PlayingMode } from "./types";
import { Input } from "./input";
import { create2PScene } from "./2p.ts";
import { makeFader, makeGridObj } from "./utils.ts";

const k = kaplay({ letterbox: true, width: 1920, height: 1080 });

k.loadRoot("./"); // A good idea for Itch.io publishing later
k.loadFont("numbers", "numbers.ttf")
k.loadFont("score", "score.ttf")

k.loadSprite("arrow-o", "./arrow-o.png");

k.setBackground(k.Color.fromHex("#ffcf82"))


k.scene("main", () => {
    let chosen = false
    create2PScene(k)
    let { fadeIn, fadeOut } = makeFader(k)
    fadeIn(0.3, "easeOutCirc", () => { })

    let player1Option = k.add([
        k.text("1 Player", {
            font: "numbers",
            width: k.width(),
            align: "center"
        }),
        k.pos(k.vec2(0, k.height() / 2))
    ])

    k.add([
        k.text("2 Players", {
            font: "numbers",
            width: k.width(),
            align: "center"
        }),
        k.pos(k.vec2(0, (k.height() / 2) + 100))
    ])

    let arrow = k.add([
        k.sprite("arrow-o"),
        k.color(k.WHITE),
        k.pos(k.width() / 2 - 170, k.height() / 2 - 10)
    ])

    let player1 = new Input({ k })
    let player2 = new Input({ k })

    arrow.onUpdate(() => {
        // console.log("hm")
        // console.log("Posição Y:", arrow.pos.y);
        if (!chosen && player1.isPressed("down")) {
            arrow.moveTo(k.vec2(k.width() / 2 - 170, k.height() / 2 + 90))
        }

        if (!chosen && player1.isPressed("up")) {
            arrow.moveTo(k.vec2(k.width() / 2 - 170, k.height() / 2 - 10))
        }
    })

    let grid = []
    const HALF_POINT = 3
    for (let j = 0; j < HALF_POINT * 2; j++) {
        for (let i = -1; i < k.width() / Constants.GEM_SIZE / Constants.SCALING + 1; i++) {
            let objFactory = makeGridObj(k, Math.abs(i) % 2)
            let dir = j % 2 === 0 ? -1 : 1
            let y = j < HALF_POINT ? 0 : k.height() - (Constants.GEM_SIZE * Constants.SCALING * HALF_POINT)
            let obj;
            if (y === 0) {
                obj = k.add([...objFactory, k.pos(i * Constants.GEM_SIZE * Constants.SCALING, j * Constants.GEM_SIZE * Constants.SCALING), k.scale(Constants.SCALING)])

            } else {
                obj = k.add([...objFactory, k.pos(i * Constants.GEM_SIZE * Constants.SCALING, y + ((j - HALF_POINT) * Constants.GEM_SIZE * Constants.SCALING)), k.scale(Constants.SCALING)])

            }
            grid.push({ obj, dir })
        }
    }

    console.log(grid)

    console.log(k.width())

    // k.setCamPos(k.vec2(0, 1000))

    // k.onDraw(() => {

    // })

    k.onUpdate(() => {
        grid.forEach((params: { obj: GameObj, dir: number }) => {
            if (params.obj.pos.x >= k.width() && params.dir > 0) {
                let copiedPos = params.obj.pos.clone()
                let offset = copiedPos.x - k.width()
                params.obj.moveTo(-Constants.GEM_SIZE * Constants.SCALING * 2 + offset, copiedPos.y)
            } else if (params.obj.pos.x <= -Constants.GEM_SIZE * Constants.SCALING && params.dir < 0) {
                let copiedPos = params.obj.pos.clone()
                let offset = (-Constants.GEM_SIZE * Constants.SCALING) + -copiedPos.x
                params.obj.moveTo(k.width() + (Constants.GEM_SIZE * Constants.SCALING) - offset, copiedPos.y)
            }

            params.obj.moveBy(50 * k.dt() * params.dir, 0)
        })

        if (!chosen && player1.isPressed("accept") && arrow.pos.y === k.height() / 2 + 90) {
            chosen = true
            fadeOut(0.3, "easeOutCirc", () => {
                k.go("2p", { playingMode: PlayingMode.Versus2P, gameType: GameType.Survival, playerInputs: [player1, player2] })
            })
        }

        if (!chosen && player1.isPressed("accept") && arrow.pos.y === k.height() / 2 - 10) {
            chosen = true
            // k.go("2p", { playingMode: PlayingMode.Versus2P, gameType: GameType.Survival, playerInputs: [player1, player2] })
        }

    })
})


k.go("main")