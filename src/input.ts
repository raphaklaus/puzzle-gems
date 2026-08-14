import { KAPLAYCtx, KGamepad, KGamepadButton } from "kaplay";

interface InputMap {
    // [key: string]: string | KGamepadButton,
    up: string | KGamepadButton,
    down: string | KGamepadButton,
    left: string | KGamepadButton,
    right: string | KGamepadButton,
    swap: string | KGamepadButton,
    pushLineUp: string | KGamepadButton,
    accept: string | KGamepadButton,
    rotateCW: string | KGamepadButton,
    rotateCCW: string | KGamepadButton,
}

interface InputParams {
    k: KAPLAYCtx
}

export class Input {
    static playersCount = 0
    private mapping: InputMap
    private k: KAPLAYCtx
    private gamePad?: KGamepad

    static registeredGamePadIndices: number[] = []

    static gamePadMappings: InputMap = {
        up: "dpad-up",
        down: "dpad-down",
        left: "dpad-left",
        right: "dpad-right",
        swap: "east",
        pushLineUp: "north",
        accept: "start",
        rotateCW: "ltrigger",
        rotateCCW: "rtrigger"
    }

    static keyboardMappings: Array<InputMap> = [{
        up: "up",
        down: "down",
        left: "left",
        right: "right",
        swap: "space",
        pushLineUp: "enter",
        accept: "enter",
        rotateCW: "d",
        rotateCCW: "a"
    },
    {
        up: "i",
        down: "k",
        left: "j",
        right: "l",
        swap: "shift",
        pushLineUp: "backspace",
        accept: "backspace",
        rotateCW: "u",
        rotateCCW: "o"
    }]

    constructor(params: InputParams) {
        Input.playersCount++
        this.k = params.k

        if (Input.keyboardMappings.length === 0) {
            throw new Error("Mapping is empty, add more")
        }

        this.mapping = Input.keyboardMappings.shift()!

        this.k.onGamepadConnect((gp) => {
            if (!this.gamePad && !Input.registeredGamePadIndices.includes(gp.index)) {
                Input.registeredGamePadIndices.push(gp.index)
                this.gamePad = gp
                Input.keyboardMappings.push({ ...this.mapping })
                this.mapping = Input.gamePadMappings
            }
        })

        this.k.onGamepadDisconnect((gp) => {
            if (this.gamePad?.index === gp.index) {
                this.gamePad = undefined
                if (Input.keyboardMappings.length === 0) {
                    throw new Error("Mapping is empty, add more")
                }

                let foundIndex = Input.registeredGamePadIndices.indexOf(gp.index)
                Input.registeredGamePadIndices.splice(foundIndex, 1)

                this.mapping = Input.keyboardMappings.shift()!
            }
        })
    }


    isPressed(action: keyof InputMap) {
        const mappedInput = this.mapping[action] as string & KGamepadButton
        // console.log(this.mapping)
        // console.log(this.gamePad)
        // console.log(mappedInput)

        return this.gamePad ? this.gamePad.isPressed(mappedInput) : this.k.isKeyPressed(mappedInput)
        // return this.gamePad ? this.gamePad.isDown(mappedInput) : this.k.isKeyDown(mappedInput)

    }
}