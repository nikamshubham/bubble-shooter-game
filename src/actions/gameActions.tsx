import { Bubbles, Bubble } from '../types/GameTypes'

const pickRandomColor = (): { color: string } => {
  const allColors: string[] = ['blue', 'red', 'purple', 'green']
  const randomColor =  allColors[Math.floor(Math.random() * allColors.length)]
  return { color: randomColor }
} 

export const initializeGame = (): Bubbles => {
  const state: Bubbles = {
    gameTable: [[],[],[],[],[],[],[],[],[]],
    shootingBubble: { color: null },
    hitCoordinates: []
  }

  for(let column=10; column>=0; column--){
    for(let row=8; row>=0; row--){
      if(row < 3){
        state.gameTable[row][column] = pickRandomColor()
      } else {
        state.gameTable[row][column] = { color: null }
      }
    }
  }
  state.shootingBubble = pickRandomColor()

  return state
}

export const shootBubble = (angle: number, state: Bubbles): Object => {
  const { gameTable } = state
  let prevRow: number = 0
  let prevColumn: number = 0

  const radians: number = angle * (Math.PI / 180)
  const columnStepSize: number = Math.sin(radians) / Math.cos(radians)
  let currentColumn: number = 5.5 + columnStepSize
  const startingRow: number = 8

  let hitCoordinates: number[] = []
  // Go through the rows and go a column to the left or right
  for(let row: number = startingRow; row>=0; row--){
    const hexagonalCorrection: number = row % 2 * -0.5
    currentColumn += columnStepSize
    const roundedColumn: number = Math.floor(currentColumn + hexagonalCorrection)

    if(roundedColumn < 0 || roundedColumn > 10){
      hitCoordinates = [prevRow, prevColumn]
      break
    }

    // Check if it hits a ball
    const hitBubbleColor: string | null = gameTable[row][roundedColumn].color
    
    if(hitBubbleColor !== null){
      hitCoordinates = [prevRow, prevColumn]
      break
    }
    if(row === 0 && hitBubbleColor === null){
      hitCoordinates = [row, roundedColumn]
    }

    prevRow = row
    prevColumn = roundedColumn
  }
  
  return {
    type: 'SHOOT_BUBBLE',
    payload: {
      ...state,
      hitCoordinates
    }
  }
}

const unpackGameTable = (gameTable: Bubble[][]) => {
  return gameTable.map(column => column.map(row => row))
}

const removeAdjacentBubbles = (state: Bubbles, matches: number[][]) => {
  const { gameTable, shootingBubble, hitCoordinates } = state
  const [row, column] = hitCoordinates
  const searchOffsets: number[][] = row % 2 
    ? [
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, 0],
        [1, 1]
    ]
    : [
        [-1, -1],
        [-1, 0],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0]
    ]

  searchOffsets.forEach(offset => {
    const [offsetRow, offsetColumn] = offset
    const neighborRow = row + offsetRow
    const neighborColumn = column + offsetColumn
    if(neighborRow < 0 || neighborRow > 8 || neighborColumn < 0 || neighborColumn > 10){
      return;
    }

    const neighborColor = gameTable[neighborRow][neighborColumn].color
    if(neighborColor === shootingBubble.color){
      const duplicate = matches.some(match => {
        return match[0] === neighborRow && match[1] === neighborColumn
      })
      if(!duplicate){
        matches.push([neighborRow, neighborColumn])
        removeAdjacentBubbles({...state, hitCoordinates: [neighborRow, neighborColumn]}, matches)
      }
    }
  })
  if(matches.length > 2){
    gameTable[row][column].color = null
    matches.forEach(match => {
      gameTable[match[0]][match[1]].color = null
    })
  }
}

export const removeBubbles = (state: Bubbles) => {
  const { gameTable, shootingBubble, hitCoordinates } = state
  const [row, column] = hitCoordinates
  const gameTableCopy = unpackGameTable(gameTable)

  gameTableCopy[row][column] = shootingBubble
  let matches: number[][] = []
  removeAdjacentBubbles({...state, gameTable: gameTableCopy}, matches)

  return {
    type: 'REMOVE_BUBBLES',
    payload: {
      ...state,
      gameTable: gameTableCopy,
      shootingBubble: pickRandomColor()
    }
  }
}