import kaplay, { KAPLAYCtx, TimerController } from "kaplay";
import { Vec2, GameObj } from "kaplay";
import { defaultProperties, generateRandomNumber, sleep } from "./utils";
import { Gems } from "./gems";
import * as Constants from "./constants";
import { Board } from "./board";
import { Input } from "./input";
import { GameType } from "./types";

interface PlayerParams {
    gemsContainer: GameObj,
    k: KAPLAYCtx,
    board: Board,
    gameType: GameType,
    playerInput: Input
}

export class Player {
    public cellX: number;
    public cellY: number;
    public score: number;
    public direction: Vec2;
    public auxDirection: Vec2;
    public gems: Gems[][];
    private cursor: GameObj;
    private auxCursor: GameObj;
    private k: KAPLAYCtx;
    private gemsContainer: GameObj;
    private board: Board;
    private topLine?: number = Constants.INITIAL_GEMS_HEIGHT
    private input: Input
    private gameType: GameType
    private timeController?: TimerController
    private timerObj: GameObj
    private newLineTimeModifier: number = 0
    public isPaused = false
    private static availableIds = ["P1", "P2"]
    public status?: 'won' | 'tie' | 'lost' | 'playing'
    // public static 
    public id: string
    private obj: GameObj
    private opponentId: string
    // public controllerType: 'keyboard' | 'swipe';


    constructor(params: PlayerParams) {
        this.k = params.k
        this.gameType = params.gameType
        this.opponentId = undefined
        this.cellX = 0;
        this.cellY = 0;
        this.score = 0;
        this.board = params.board;
        this.direction = this.k.vec2(0, 0)
        this.auxDirection = this.k.vec2(1, 0)
        this.gemsContainer = params.gemsContainer
        this.gems = Array.from({ length: Constants.MAX_GEMS_HEIGHT }, () => Array.from({ length: Constants.GEM_PER_LINE }, () => ({ type: undefined, ...defaultProperties(), value: generateRandomNumber() })))

        this.cursor = this.gemsContainer.add([
            this.k.pos(0, 0),
            this.k.sprite("border"),
            this.k.z(4),
        ])

        this.auxCursor = this.cursor.add([
            this.k.pos(Constants.GEM_SIZE, 0),
            this.k.sprite("border"),
            // this.k.rect(Constants.GEM_SIZE, Constants.GEM_SIZE),
            // this.k.outline(4, this.k.WHITE),
            // this.k.fill(false),
            this.k.z(4)
        ])


        if (Player.availableIds.length === 0) {
            throw new Error("Player ids run out, add more")
        }

        this.id = Player.availableIds.shift()!

        this.obj = this.k.add([this.id])

        this.obj.on("configPlayers", (args: any[]) => {
            this.opponentId = args[0] as string
            console.log(`playerId: ${this.id} - opponentId: ${this.opponentId}`)
        })

        this.obj.on("won", () => {
            console.log("won", this.id)
            this.isPaused = true
            this.gemsInvisible()
            this.cursor.hidden = true
            this.timeController?.cancel()
            this.status = 'won'
        })

        this.obj.on("lost", () => {
            console.log("lost", this.id)
            this.isPaused = true
            this.gemsInvisible()
            this.cursor.hidden = true
            this.timeController?.cancel()
            this.status = 'lost'
        })

        this.obj.on("tie", () => {
            console.log("tie", this.id)
            this.isPaused = true
            this.gemsInvisible()
            this.cursor.hidden = true
            this.timeController?.cancel()
            this.status = 'tie'
        })

        console.log("this", this)

        this.obj.on("receive-attack", async (args: any[]) => {
            if (this.isPaused) {
                return
            }

            console.log("ATTACK!", this.id)
            let index = args[0] as number

            this.receiveAttack(index)
        })

        this.k.onKeyPress("q", () => {
            if (this.id === "P1") {
                console.table(this.gems)
            }
        })

        this.timerObj = this.k.add([this.k.timer()])

        if (this.gameType === GameType.Survival) {
            this.timeController = this.timerObj.loop(Constants.BASE_NEW_LINE_TIME, () => this.newLineRiser(), undefined, true)
        }

        this.input = params.playerInput
    }

    public setOpponentId(playerId: string) {
        this.opponentId = playerId
    }

    public async receiveAttack(index: number) {
        console.log("receivedAttack")
        // for (let i = 0; i < array.length; i++) {


        // }
        await sleep(1000)

        if (this.isPaused) {
            return
        }

        this.gems[0][index] = { type: 99, ...defaultProperties(), value: 0 }
        // this.gems[0][2] = { type: 99, ...defaultProperties(), value: generateRandomNumber() }
        // this.gems[0][4] = { type: 99, ...defaultProperties(), value: generateRandomNumber() }
        await this.applyEffectors(false)
        // this.gems[0][0] = { type: 99, ...defaultProperties(), value: generateRandomNumber() }
        // this.gems[0][3] = { type: 99, ...defaultProperties(), value: generateRandomNumber() }
        // this.gems[0][5] = { type: 99, ...defaultProperties(), value: generateRandomNumber() }
        // await this.applyEffectors(false)
    }

    public update() {
        if (this.isPaused) {

            // TODO: Allow to interact with menu or do not update anything when showing results
            return
        }

        this.move()
        this.actions()
    }

    private check99AtBottom(depth: number) {
        for (let i = 0; i < Constants.GEM_PER_LINE; i++) {
            if (this.gems[Constants.MAX_GEMS_HEIGHT - 1][i].type === 99) {
                this.board.giveBack99(i, this.cellX, depth * 1000)
            }
        }
    }

    public attack(cellXindex: number) {
        console.log("pre-attack", this.opponentId)
        this.k.trigger("receive-attack", this.opponentId, cellXindex)
    }

    public async move() {
        if (this.input.isPressed("left")) {
            // console.log("cellY", this.cellX)
            this.direction = this.k.vec2(-1, 0)
            if (!this.isOutOfBounds()) {
                this.cursor.moveTo((this.cursor.pos.x - Constants.GEM_SIZE), this.cursor.pos.y)
                this.cellX = this.cursor.pos.x / Constants.GEM_SIZE;
            }
        }

        if (this.input.isPressed("right")) {
            // console.log("cellY", this.cellX)
            this.direction = this.k.vec2(1, 0)
            if (!this.isOutOfBounds()) {
                this.cursor.moveTo((this.cursor.pos.x + Constants.GEM_SIZE), this.cursor.pos.y)
                this.cellX = this.cursor.pos.x / Constants.GEM_SIZE;
            }
        }

        if (this.input.isPressed("up")) {
            this.direction = this.k.vec2(0, -1)
            if (!this.isOutOfBounds()) {
                this.cursor.moveTo(this.cursor.pos.x, this.cursor.pos.y - Constants.GEM_SIZE)
                this.cellY = this.cursor.pos.y / Constants.GEM_SIZE
            }

        }

        if (this.input.isPressed("down")) {
            this.direction = this.k.vec2(0, 1)
            if (!this.isOutOfBounds()) {
                this.cursor.moveTo(this.cursor.pos.x, this.cursor.pos.y + Constants.GEM_SIZE)
                this.cellY = this.cursor.pos.y / Constants.GEM_SIZE
            }
        }

        if (this.input.isPressed("swap")) {
            // console.log("TIMER IS", controller.timeLeft)
            let lineIndex = this.cellY
            let index = this.cellX


            let lineIndexAux = this.cellY + this.auxDirection.y
            let indexAux = this.cellX + this.auxDirection.x

            console.log("issueStrange before updateGemLocation")
            await this.board.updateGemLocation(lineIndex, index, lineIndexAux, indexAux, { duration: Constants.ANIMATION_SWAPPING_DURATION, easing: this.k.easings.easeOutCirc }, false);
            if (this.isAllMovementDone()) {
                console.log("issueStrange before applyEffectors")
                await this.applyEffectors()
            }
        }
    }

    private moveCursorUp() {
        this.cursor.moveTo(this.cursor.pos.x, this.cursor.pos.y - Constants.GEM_SIZE)
        if (this.cursor.pos.y < 0) {
            this.cursor.pos.y = 0
        }
        this.cellY = this.cursor.pos.y / Constants.GEM_SIZE
    }

    public async actions() {
        // TODO: actions logic
        // Example: swap gems, rotate, push new lines

        // Counter clock-wise
        if (this.input.isPressed("rotateCW")) {
            if (this.cellY === this.gems.length - 1 && this.auxDirection.x < 0) {
                return
            }

            if (this.cellY === 0 && this.auxDirection.x > 0) {
                return
            }

            if (this.cellX === Constants.GEM_PER_LINE - 1 && this.auxDirection.y > 0) {
                return
            }

            if (this.cellX === 0 && this.auxDirection.y < 0) {
                return
            }

            this.auxDirection = this.auxDirection.rotate(-90)
            this.auxDirection.x = Math.round(this.auxDirection.x)
            this.auxDirection.y = Math.round(this.auxDirection.y)
            this.auxCursor.moveTo(this.k.vec2(this.auxDirection.x * Constants.GEM_SIZE, this.auxDirection.y * Constants.GEM_SIZE))
        }

        // Clock-wise
        if (this.input.isPressed("rotateCCW")) {
            if (this.cellY === this.gems.length - 1 && this.auxDirection.x > 0) {
                return
            }

            if (this.cellY === 0 && this.auxDirection.x < 0) {
                return
            }

            if (this.cellX === 0 && this.auxDirection.y > 0) {
                return
            }

            if (this.cellX === Constants.GEM_PER_LINE - 1 && this.auxDirection.y < 0) {
                return
            }

            this.auxDirection = this.auxDirection.rotate(90)
            this.auxDirection.x = Math.round(this.auxDirection.x)
            this.auxDirection.y = Math.round(this.auxDirection.y)
            this.auxCursor.moveTo(this.k.vec2(this.auxDirection.x * Constants.GEM_SIZE, this.auxDirection.y * Constants.GEM_SIZE))
        }

        if (this.input.isPressed("pushLineUp")) {
            await this.newLineRiser()
        }
    }

    private makeNextLineGemsVisible(nextLine: Gems[]) {
        nextLine.forEach(gem => {
            gem.invisible = false
        })
    }

    private gemsInvisible() {
        this.gems.flat().forEach(gem => {
            gem.invisible = true
        })
    }

    private async riser() {
        if (this.isPaused) {
            return
        }

        let nextLine = this.board.generateGemsLine(true)
        this.gems.push(nextLine)
        this.gems.shift()
        this.moveCursorUp()
        await this.board.animateNextLine(nextLine, this.makeNextLineGemsVisible)
        await this.applyEffectors(false)
        this.topLine = this.getTopLine()
        if (this.gemsReachedTop()) {
            this.k.trigger("reachedTop", "endGame", this.board)
        }
    }

    private async newLineRiser() {
        if (this.gameType === GameType.Survival) {
            console.trace()
            this.timeController?.cancel()
            this.newLineTimeModifier -= 0.5
            this.timeController = this.timerObj.loop(Math.max(Constants.BASE_NEW_LINE_TIME + this.newLineTimeModifier, Constants.MIN_TIME_NEW_LINE), () => this.newLineRiser(), undefined, true)

            if (this.isAllMovementDone()) {
                console.log("rise on first")
                await this.riser()
            } else {
                await sleep(1000)
                if (this.isAllMovementDone()) {
                    console.log("rise on second")
                    await this.riser()
                } else {
                    console.log("rise not call at all")
                }
            }
        }
    }

    private isAllMovementDone() {
        return this.gems.flat().every(gem => gem.swapping === false)
    }

    private isOutOfBounds() {
        let maxX = this.auxDirection.x > 0 ? Constants.GEM_PER_LINE - 2 : Constants.GEM_PER_LINE - 1

        if (this.direction.eq(this.k.vec2(1, 0)) && this.cellX >= maxX) {
            return true
        }

        let minX = this.auxDirection.x >= 0 ? 0 : 1

        if (this.direction.eq(this.k.vec2(-1, 0)) && this.cellX <= minX) {
            return true
        }

        let maxY = this.auxDirection.y > 0 ? this.gems.length - 2 : this.gems.length - 1

        if (this.direction.eq(this.k.vec2(0, 1)) && this.cellY >= maxY) {
            return true
        }

        let minY = this.auxDirection.y < 0 ? 1 : 0

        if (this.direction.eq(this.k.vec2(0, -1)) && this.cellY <= minY) {
            return true
        }

        return false
    }

    public async applyEffectors(isSetup = false, depth = 0) {
        if (this.isPaused) {
            return
        }

        console.log("APPLY EFFECTORS")
        let result = this.checkForAMatch(isSetup)


        await Promise.all(this.board.animateMatching(result, isSetup))


        let danglingCells = this.gravity()

        console.log('danglingCells', danglingCells)

        let gravityAnimationPromises = danglingCells.map(cellAboveGround => {
            const [lineIndex, index] = cellAboveGround[0]
            const [lineIndexEmpty, indexEmpty] = cellAboveGround[1]

            let gravityDuration = (lineIndexEmpty - lineIndex) * (Constants.ANIMATION_GRAVITY_DURATION / 4)

            return this.board.updateGemLocation(lineIndex, index, lineIndexEmpty, indexEmpty, { duration: Constants.ANIMATION_GRAVITY_DURATION + gravityDuration, easing: this.k.easings.easeInCubic }, isSetup)
        })

        await Promise.all(gravityAnimationPromises)

        this.check99AtBottom(depth)

        result = this.checkForAMatch(isSetup)


        await Promise.all(this.board.animateMatching(result, isSetup))


        if (result.length > 0 || danglingCells.length > 0) {
            await this.applyEffectors(isSetup, depth + 1)
        }
    }

    swap(lineIndexA: number, indexA: number, lineIndexB: number, indexB: number) {
        [this.gems[lineIndexA][indexA], this.gems[lineIndexB][indexB]] = [this.gems[lineIndexB][indexB], this.gems[lineIndexA][indexA]]
    }

    private expandGrid() {
        for (let i = Constants.MAX_GEMS_HEIGHT; i < Constants.MAX_GEMS_HEIGHT * 2; i++) {
            for (let j = 0; i < Constants.GEM_PER_LINE; i++) {
                this.gems[i][j] = { type: undefined, ...defaultProperties() }
            }
        }
    }

    gravity() {
        console.log("gravity called")
        let result = []
        // console.table(gems)

        for (let index = 0; index < Constants.GEM_PER_LINE; index++) {
            let floor = Constants.MAX_GEMS_HEIGHT - 1
            let isFloorSearching = true
            let getAllAbove = false
            // This count is to keep track how much the next gem should go up when the previous one is the "new floor"
            let count = 0
            for (let lineIndex = this.gems.length - 1; lineIndex >= 0; lineIndex--) {
                if (lineIndex >= 1) {
                    if (isFloorSearching && this.gems[lineIndex][index].type !== undefined) {
                        floor = lineIndex - 1
                    }

                    if (!getAllAbove && this.gems[lineIndex][index].type === undefined && this.gems[lineIndex - 1][index].type !== undefined) {
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

                    if (getAllAbove && this.gems[lineIndex - 1][index].type !== undefined) {
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

        return result
    }

    checkForAMatch(isSetup = false) {
        let result: number[][] = []
        for (let lineIndex = 0; lineIndex < this.gems.length; lineIndex++) {
            for (let index = 0; index < Constants.GEM_PER_LINE; index++) {
                if (this.gems[lineIndex][index].type === 99) {
                    continue
                }

                // // Match Cross!
                // if (lineIndex <= (this.gems.length - 3) && this.gems[lineIndex][index].type !== undefined && this.gems[lineIndex][index].type === this.gems[lineIndex + 1][index].type &&
                //     this.gems[lineIndex + 2][index].type === this.gems[lineIndex][index].type && this.gems[lineIndex + 1][index - 1].type === this.gems[lineIndex][index].type && this.gems[lineIndex + 1][index + 1].type === this.gems[lineIndex][index].type) {
                //     console.log("Match 5 vertical!")
                //     if (!isSetup) {
                //         this.score += 5
                //         this.attack(5)
                //     }
                //     let toBeRemoved = [
                //         [lineIndex, index],
                //         [lineIndex + 1, index],
                //         [lineIndex + 2, index],
                //         [lineIndex + 1, index - 1],
                //         [lineIndex + 1, index + 1]
                //     ]

                //     toBeRemoved.forEach(gemIndices => {
                //         const [lineIndex, index] = gemIndices
                //         this.gems[lineIndex][index].oldData = { type: this.gems[lineIndex][index].type }
                //         this.gems[lineIndex][index].type = undefined

                //         if (!isSetup) {
                //             this.score += this.gems[lineIndex][index].value
                //         }

                //         result.push(gemIndices)
                //     })
                // }

                // Match 5 L-shaped!
                if (lineIndex <= (Constants.MAX_GEMS_HEIGHT - 1) - 2 && index <= 3 && this.gems[lineIndex][index].type !== undefined && this.gems[lineIndex][index].type === this.gems[lineIndex + 1][index].type &&
                    this.gems[lineIndex + 2][index].type === this.gems[lineIndex][index].type && this.gems[lineIndex + 2][index + 1].type === this.gems[lineIndex][index].type && this.gems[lineIndex + 2][index + 2].type === this.gems[lineIndex][index].type) {
                    console.log("Match 5 L-shaped!")
                    if (!isSetup) {
                        this.score += 5
                        this.attack(index)
                    }
                    let toBeRemoved = [
                        [lineIndex, index],
                        [lineIndex + 1, index],
                        [lineIndex + 2, index],
                        [lineIndex + 2, index + 1],
                        [lineIndex + 2, index + 2]

                    ]

                    toBeRemoved.forEach(gemIndices => {
                        const [lineIndex, index] = gemIndices
                        this.gems[lineIndex][index].oldData = { type: this.gems[lineIndex][index].type }
                        this.gems[lineIndex][index].type = undefined

                        if (!isSetup) {
                            this.score += this.gems[lineIndex][index].value
                        }

                        result.push(gemIndices)
                    })
                }

                // Match 5 L-shaped (inverted)!
                if (lineIndex <= (Constants.MAX_GEMS_HEIGHT - 1) - 2 && index >= 2 && this.gems[lineIndex][index].type !== undefined && this.gems[lineIndex][index].type === this.gems[lineIndex + 1][index].type &&
                    this.gems[lineIndex + 2][index].type === this.gems[lineIndex][index].type && this.gems[lineIndex + 2][index - 1].type === this.gems[lineIndex][index].type && this.gems[lineIndex + 2][index - 2].type === this.gems[lineIndex][index].type) {
                    console.log("Match 5 L-shaped inverted!")
                    if (!isSetup) {
                        this.score += 5
                        this.attack(index)
                    }
                    let toBeRemoved = [
                        [lineIndex, index],
                        [lineIndex + 1, index],
                        [lineIndex + 2, index],
                        [lineIndex + 2, index - 1],
                        [lineIndex + 2, index - 2]

                    ]

                    toBeRemoved.forEach(gemIndices => {
                        const [lineIndex, index] = gemIndices
                        this.gems[lineIndex][index].oldData = { type: this.gems[lineIndex][index].type }
                        this.gems[lineIndex][index].type = undefined

                        if (!isSetup) {
                            this.score += this.gems[lineIndex][index].value
                        }

                        result.push(gemIndices)
                    })
                }

                // Match 4 horizontal!
                if (index <= (Constants.GEM_PER_LINE - 4) && this.gems[lineIndex][index].type !== undefined && this.gems[lineIndex][index].type === this.gems[lineIndex][index + 1].type &&
                    this.gems[lineIndex][index + 2].type === this.gems[lineIndex][index].type && this.gems[lineIndex][index + 3].type === this.gems[lineIndex][index].type) {
                    console.log("Match 4 horizontal!")

                    if (!isSetup) {
                        this.score += 4
                        this.attack(index)
                    }

                    let toBeRemoved = [
                        [lineIndex, index],
                        [lineIndex, index + 1],
                        [lineIndex, index + 2],
                        [lineIndex, index + 3]

                    ]

                    toBeRemoved.forEach(gemIndices => {
                        const [lineIndex, index] = gemIndices
                        this.gems[lineIndex][index].oldData = { type: this.gems[lineIndex][index].type }
                        this.gems[lineIndex][index].type = undefined

                        if (!isSetup) {
                            this.score += this.gems[lineIndex][index].value
                        }

                        result.push(gemIndices)
                    })
                }

                // Match 3 horizontal!
                if (index <= (Constants.GEM_PER_LINE - 3) && this.gems[lineIndex][index].type !== undefined && this.gems[lineIndex][index].type === this.gems[lineIndex][index + 1].type &&
                    this.gems[lineIndex][index + 2].type === this.gems[lineIndex][index].type) {
                    console.log("Match 3 horizontal!")

                    if (!isSetup) {
                        this.score += 3
                        // this.attack(3)
                    }

                    let toBeRemoved = [
                        [lineIndex, index],
                        [lineIndex, index + 1],
                        [lineIndex, index + 2]

                    ]

                    toBeRemoved.forEach(gemIndices => {
                        const [lineIndex, index] = gemIndices
                        this.gems[lineIndex][index].oldData = { type: this.gems[lineIndex][index].type }
                        this.gems[lineIndex][index].type = undefined

                        if (!isSetup) {
                            this.score += this.gems[lineIndex][index].value
                        }

                        result.push(gemIndices)
                    })
                    // console.table(this.gems)
                }

                // Match 4 vertical!
                if (lineIndex <= (this.gems.length - 4) && this.gems[lineIndex][index].type !== undefined && this.gems[lineIndex][index].type === this.gems[lineIndex + 1][index].type &&
                    this.gems[lineIndex + 2][index].type === this.gems[lineIndex][index].type && this.gems[lineIndex + 3][index].type === this.gems[lineIndex][index].type) {
                    console.log("Match 4 vertical!")
                    if (!isSetup) {
                        this.score += 4
                        this.attack(index)
                    }
                    let toBeRemoved = [
                        [lineIndex, index],
                        [lineIndex + 1, index],
                        [lineIndex + 2, index],
                        [lineIndex + 3, index]

                    ]

                    toBeRemoved.forEach(gemIndices => {
                        const [lineIndex, index] = gemIndices
                        this.gems[lineIndex][index].oldData = { type: this.gems[lineIndex][index].type }
                        this.gems[lineIndex][index].type = undefined

                        if (!isSetup) {
                            this.score += this.gems[lineIndex][index].value
                        }

                        result.push(gemIndices)
                    })
                }

                // Match 3 vertical!
                if (lineIndex <= (this.gems.length - 3) && this.gems[lineIndex][index].type !== undefined && this.gems[lineIndex][index].type === this.gems[lineIndex + 1][index].type &&
                    this.gems[lineIndex + 2][index].type === this.gems[lineIndex][index].type) {
                    console.log("Match 3 vertical!")
                    if (!isSetup) {
                        this.score += 3
                        // this.attack(3)
                    }
                    let toBeRemoved = [
                        [lineIndex, index],
                        [lineIndex + 1, index],
                        [lineIndex + 2, index]

                    ]

                    toBeRemoved.forEach(gemIndices => {
                        const [lineIndex, index] = gemIndices
                        this.gems[lineIndex][index].oldData = { type: this.gems[lineIndex][index].type }
                        this.gems[lineIndex][index].type = undefined

                        if (!isSetup) {
                            this.score += this.gems[lineIndex][index].value
                        }

                        result.push(gemIndices)
                    })
                }
            }
        }

        // this.topLine = this.getTopLine()

        return result
    }

    public gemsReachedTop() {
        return this.topLine === 0
    }

    private getTopLine() {
        let result
        for (let lineIndex = 0; lineIndex < this.gems.length; lineIndex++) {
            if (this.gems[lineIndex].some(gems => gems.type !== undefined)) {
                result = lineIndex
                break;
            }
        }

        return result
    }
}