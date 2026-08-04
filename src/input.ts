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
    private mapping: InputMap
    private k: KAPLAYCtx
    private gamePad?: KGamepad

    static gamePadMappings: InputMap = {
        up: "north",
        down: "south",
        left: "west",
        right: "east",
        swap: "dpad-right",
        pushLineUp: "dpad-up",
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
        this.k = params.k

        if (Input.keyboardMappings.length === 0) {
            throw new Error("Mapping is empty, add more")
        }

        this.mapping = Input.keyboardMappings.shift()!

        this.k.onGamepadConnect((gp) => {
            this.gamePad = gp
            Input.keyboardMappings.push({ ...this.mapping })
            this.mapping = Input.gamePadMappings
        })

        this.k.onGamepadDisconnect((gp) => {
            this.gamePad = undefined
            if (Input.keyboardMappings.length === 0) {
                throw new Error("Mapping is empty, add more")
            }

            this.mapping = Input.keyboardMappings.shift()!
        })
    }


    isPressed(action: keyof InputMap) {
        const mappedInput = this.mapping[action] as string & KGamepadButton
        // console.log(this.mapping)
        // console.log(this.gamePad)
        // console.log(mappedInput)

        return this.gamePad ? this.gamePad.isPressed(mappedInput) : this.k.isKeyPressed(mappedInput)

    }
}