import kaplay, { KAPLAYCtx } from "kaplay";
import { Vec2, GameObj } from "kaplay";
import { defaultProperties, generateRandomNumber } from "./utils";
import { Gems } from "./gems";
import * as Constants from "./constants";
import { Board } from "./board";

interface PlayerParams {
    gemsContainer: GameObj,
    k: KAPLAYCtx,
    board: Board
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
    // public controllerType: 'keyboard' | 'swipe';


    constructor(params: PlayerParams) {
        this.k = params.k
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
            // this.k.rect(gemSize, gemSize),
            // this.k.outline(4, this.k.WHITE),
            // this.k.fill(false),
            this.k.z(4)
        ])

        // Register handlers
        this.move()
        this.actions()
    }

    public move() {
        this.k.onKeyPress("left", () => {
            // console.log("cellY", this.cellX)
            this.direction = this.k.vec2(-1, 0)
            if (!this.isOutOfBounds()) {
                this.cursor.moveTo((this.cursor.pos.x - Constants.GEM_SIZE), this.cursor.pos.y)
                this.cellX = this.cursor.pos.x / Constants.GEM_SIZE;
            }

        })

        this.k.onKeyPress("right", () => {

            // console.log("cellY", this.cellX)
            this.direction = this.k.vec2(1, 0)
            if (!this.isOutOfBounds()) {
                this.cursor.moveTo((this.cursor.pos.x + Constants.GEM_SIZE), this.cursor.pos.y)
                this.cellX = this.cursor.pos.x / Constants.GEM_SIZE;
            }

        })

        this.k.onKeyPress("up", () => {
            this.direction = this.k.vec2(0, -1)
            if (!this.isOutOfBounds()) {
                this.cursor.moveTo(this.cursor.pos.x, this.cursor.pos.y - Constants.GEM_SIZE)
                this.cellY = this.cursor.pos.y / Constants.GEM_SIZE
            }

        })

        this.k.onKeyPress("down", () => {
            this.direction = this.k.vec2(0, 1)
            if (!this.isOutOfBounds()) {
                this.cursor.moveTo(this.cursor.pos.x, this.cursor.pos.y + Constants.GEM_SIZE)
                this.cellY = this.cursor.pos.y / Constants.GEM_SIZE
            }
        })

        this.k.onKeyPress("space", async () => {
            // console.log("TIMER IS", controller.timeLeft)
            let lineIndex = this.cellY
            let index = this.cellX

            // console.log("cellX", cellX)
            // console.log("cellY", cellX)


            let lineIndexAux = this.cellY + this.auxDirection.y
            let indexAux = this.cellX + this.auxDirection.x

            // if (gems[lineIndex][index].swapping || gems[lineIndexAux][indexAux].swapping) {
            //     return
            // }

            // let lineIndexAux = (cursor.pos.y + (gemSize * auxCursorDir.y)) / gemSize
            // let indexAux = (cursor.pos.x + (gemSize * auxCursorDir.x)) / gemSize

            // console.log("lineIndexAux", lineIndexAux)
            // console.log("indexAux", indexAux)


            await this.board.updateGemLocation(lineIndex, index, lineIndexAux, indexAux, { duration: Constants.ANIMATION_SWAPPING_DURATION, easing: this.k.easings.easeOutCirc });
            await this.applyEffectors()
        })
    }

    public actions() {
        // TODO: actions logic
        // Example: swap gems, rotate, push new lines


        // Counter clock-wise
        this.k.onKeyPress("a", () => {
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
        })


        // Clock-wise
        this.k.onKeyPress("d", () => {
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
        })
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

    public async applyEffectors(isSetup = false) {
        console.log("APPLY EFFECTORS")
        let result = this.checkForAMatch(isSetup)


        await Promise.all(this.board.animateMatching(result, isSetup))


        let danglingCells = this.gravity()

        console.log('danglingCells', danglingCells)

        let gravityAnimationPromises = danglingCells.map(cellAboveGround => {
            const [lineIndex, index] = cellAboveGround[0]
            const [lineIndexEmpty, indexEmpty] = cellAboveGround[1]

            return this.board.updateGemLocation(lineIndex, index, lineIndexEmpty, indexEmpty, { duration: Constants.ANIMATION_GRAVITY_DURATION, easing: this.k.easings.easeInCubic }, isSetup)
        })

        await Promise.all(gravityAnimationPromises)

        result = this.checkForAMatch(isSetup)


        await Promise.all(this.board.animateMatching(result, isSetup))


        if (result.length > 0 || danglingCells.length > 0) {
            await this.applyEffectors(isSetup)
        }
    }

    swap = (lineIndexA: number, indexA: number, lineIndexB: number, indexB: number) => {
        [this.gems[lineIndexA][indexA], this.gems[lineIndexB][indexB]] = [this.gems[lineIndexB][indexB], this.gems[lineIndexA][indexA]]
    }

    gravity = () => {
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

    checkForAMatch(isGamePlayMatch = true) {
        let result: number[][] = []
        for (let lineIndex = 0; lineIndex < this.gems.length; lineIndex++) {
            for (let index = 0; index < Constants.GEM_PER_LINE; index++) {
                // Match 4 horizontal!
                if (index <= (Constants.GEM_PER_LINE - 4) && this.gems[lineIndex][index].type !== undefined && this.gems[lineIndex][index].type === this.gems[lineIndex][index + 1].type &&
                    this.gems[lineIndex][index + 2].type === this.gems[lineIndex][index].type && this.gems[lineIndex][index + 3].type === this.gems[lineIndex][index].type) {
                    console.log("Match 4 horizontal!")

                    if (isGamePlayMatch) {
                        this.score += 4
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

                        if (isGamePlayMatch) {
                            this.score += this.gems[lineIndex][index].value
                        }

                        result.push(gemIndices)
                    })
                }

                // Match 3 horizontal!
                if (index <= (Constants.GEM_PER_LINE - 3) && this.gems[lineIndex][index].type !== undefined && this.gems[lineIndex][index].type === this.gems[lineIndex][index + 1].type &&
                    this.gems[lineIndex][index + 2].type === this.gems[lineIndex][index].type) {
                    console.log("Match 3 horizontal!")

                    if (isGamePlayMatch) {
                        this.score += 3
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

                        if (isGamePlayMatch) {
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
                    if (isGamePlayMatch) {
                        this.score += 4
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

                        if (isGamePlayMatch) {
                            this.score += this.gems[lineIndex][index].value
                        }

                        result.push(gemIndices)
                    })
                }

                // Match 3 vertical!
                if (lineIndex <= (this.gems.length - 3) && this.gems[lineIndex][index].type !== undefined && this.gems[lineIndex][index].type === this.gems[lineIndex + 1][index].type &&
                    this.gems[lineIndex + 2][index].type === this.gems[lineIndex][index].type) {
                    console.log("Match 3 vertical!")
                    if (isGamePlayMatch) {
                        this.score += 3
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

                        if (isGamePlayMatch) {
                            this.score += this.gems[lineIndex][index].value
                        }

                        result.push(gemIndices)
                    })
                }
            }
        }

        this.topLine = this.getTopLine()

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