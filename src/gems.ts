import { GameObj } from "kaplay"

export interface Gems {
    invisible: boolean,
    swapping: boolean,
    type?: number,
    value: number,
    swapReplicaRef?: GameObj,
    oldData?: {
        type?: number
    }
}