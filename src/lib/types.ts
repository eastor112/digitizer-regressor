export interface Point {
  x: number
  y: number
}

export interface DataPoint {
  id: number
  px: Point
  val: Point
}

export interface Regression {
  slope: number
  intercept: number
  r2: number
}

export interface Line {
  id: number
  name: string
  points: DataPoint[]
  regression: Regression | null
  color: string
}

export const ST = { UPLOAD: 0, SET_X1: 1, SET_X2: 2, SET_Y1: 3, SET_Y2: 4, COLLECT: 5 } as const
export type StateType = typeof ST[keyof typeof ST]
