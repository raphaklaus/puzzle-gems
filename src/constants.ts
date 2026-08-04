import { KAPLAYCtx } from "kaplay"

// Proportions
export const GEM_SIZE = 32
export const GEM_PER_LINE = 6
export const INITIAL_GEMS_HEIGHT = 4
export const MAX_GEMS_HEIGHT = 8
export const SCALING = 4

// Animations
export const ANIMATION_GRAVITY_DURATION = 0.2
export const ANIMATION_SWAPPING_DURATION = 0.25
export const DISAPPEAR_ANIM_DURATION = 0.5;
export const BASE_NEW_LINE_TIME = 3

export const SCREEN_MID = (k: KAPLAYCtx) => k.vec2((k.width() / 2) - (GEM_PER_LINE / 2) * GEM_SIZE * SCALING, 0)