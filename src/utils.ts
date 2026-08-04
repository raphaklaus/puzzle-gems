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