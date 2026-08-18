import { Comp, EaseFunc, EaseFuncs, GameObj, KAPLAYCtx } from "kaplay"
import * as Constants from "./constants";

export const defaultProperties = (invisible = false) => {
    return {
        swapping: false,
        invisible,
        value: generateRandomNumber()
    }
}

export const generateRandomNumber = () => {
    return 1 + Math.floor(Math.random() * 3)
}

export const setupLocalStorage = () => {
    let highScore = getHighScore()
    if (!highScore) {
        localStorage.setItem("highScore", 0)
    }
}

export const saveHighScore = (currentScore) => {
    let highScore = localStorage.getItem("highScore")

    if (currentScore > highScore) {
        localStorage.setItem("highScore", currentScore)
    }
}

export const getHighScore = () => {
    return localStorage.getItem("highScore") || 0
}

export const sleep = (ms: number) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms)
    })
}

export const cascadeProperty = (property: string): Comp => {
    return {
        id: "cascadeProperty",
        require: [property],
        update(this: GameObj) {
            const sync = (obj: GameObj, parentValue: number) => {
                obj.children.forEach((child) => {
                    if (child[property] !== undefined) {
                        child[property] = parentValue
                    }
                    sync(child, parentValue)
                })
            }

            sync(this, this.opacity)
        }
    }
}

export const isGameObj = (obj: any): obj is GameObj => {
    return (typeof obj.destroy === "function")
}


export const makeFader = (k: KAPLAYCtx) => {
    let obj = k.add([
        k.rect(k.width(), k.height()),
        k.color(k.BLACK),
        k.opacity(1),
        k.animate(),
        k.z(100)
    ])

    const fadeIn = (duration: number, easingType: EaseFuncs, callback: () => void) => {
        obj.unanimateAll()
        obj.animation.seek(0)
        obj.animate("opacity", [1, 0], { duration, easing: k.easings[easingType], loops: 1 })

        obj.onAnimateFinished(() => {
            callback()
        })
    }

    const fadeOut = (duration: number, easingType: EaseFuncs, callback: () => void) => {
        obj.unanimateAll()
        obj.animation.seek(0)
        obj.animate("opacity", [0, 1], { duration, easing: k.easings[easingType], loops: 1 })

        obj.onAnimateFinished(() => {
            callback()
        })
    }

    return { fadeIn, fadeOut }
}

export const makeGridObj = (k: KAPLAYCtx, colorAlternation: number) => {
    return [
        k.color(k.BLACK),
        k.opacity(colorAlternation ? 0.1 : 0.05),
        k.rect(Constants.GEM_SIZE, Constants.GEM_SIZE, { radius: 1 }),
    ]
}