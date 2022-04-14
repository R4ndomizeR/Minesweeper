<style scoped>
.grid {
  display: grid;
  margin: 0 auto;
  gap: 1px;
}

.cell-wrap {
  height: 100%;
  text-align: center;
}
</style>

<template>
  <div class="grid" :style="meth.getGridStyle()">
    <div v-for="(cell, index) in state.cells || []" :key="index" class="cell-wrap">
      <BoardCell
        :data="cell"
        @left-click="meth.openCell(index, $event)"
        @right-click="meth.toggleFlagCell(index, $event)"
      />
    </div>
  </div>
</template>

<script  setup>
import { onMounted, reactive } from 'vue'
import BoardCell from './BoardCell.vue'

const AE = Object.freeze({
  /*
    7 8 9
    4 x 6
    1 2 3
  */

  BOTTOM_LEFT: 1,
  BOTTOM: 2,
  BOTTOM_RIGHT: 3,

  RIGHT: 6,

  TOP_RIGHT: 9,
  TOP: 8,
  TOP_LEFT: 7,

  LEFT: 4,
})

const state = reactive({
  columns: 9,
  rows: 9,
  bombs: 10,

  cellSize: 30,

  cells: [],

  started: false
})

const meth = {
  getGridStyle: () => {
    return `
      grid-template-columns: repeat(${state.columns}, ${state.cellSize}px);
      grid-template-rows: repeat(${state.rows}, ${state.cellSize}px);
    `
  },

  getRandomPos: () => {
    return Math.floor(Math.random() * state.columns * state.rows)
  },

  getRandomBombsPos: () => {
    let counter = 0
    let bombsArray = []

    while (counter < state.bombs) {
      const pos = meth.getRandomPos()

      if (bombsArray.includes(pos)) continue

      bombsArray.push(pos)

      counter++
    }

    return bombsArray
  },

  forEachArround(x, y, callback) {
    if (x - 1 >= 0)
      callback(x - 1, y)
    if (x + 1 < state.columns) // Width
      callback(x + 1, y)
    if (y - 1 >= 0)
      callback(x, y - 1)
    if (y + 1 < state.rows) //Height
      callback(x, y + 1)

    if (x - 1 >= 0 && y - 1 >= 0)
      callback(x - 1, y - 1)
    if (x - 1 >= 0 && y + 1 < state.rows)
      callback(x - 1, y + 1)
    if (x + 1 < state.columns && y + 1 < state.rows)
      callback(x + 1, y + 1)
    if (x + 1 < state.columns && y - 1 >= 0)
      callback(x + 1, y - 1)
  },

  getPosAround: (cellIdx, aroundIdx, offset = 1) => {

    const len = state.cells.length

    let pos = null

    // const y = parseInt(cellIdx / state.columns)
    const x = cellIdx % state.columns

    //N = COLS*y + x

    // console.log(x, y)

    switch (aroundIdx) {
      case AE.TOP_LEFT:
        pos = cellIdx - state.columns - offset
        if (x == 0) pos = null
        break
      case AE.TOP:
        pos = cellIdx - state.columns
        break
      case AE.TOP_RIGHT:
        pos = cellIdx - state.columns + offset
        if (x + offset == state.columns) pos = null
        break

      case AE.LEFT:
        pos = cellIdx - offset
        if (x == 0) pos = null
        break
      case AE.RIGHT:
        pos = cellIdx + offset
        if (x + offset == state.columns) pos = null
        break

      case AE.BOTTOM_LEFT:
        pos = cellIdx + state.columns - offset
        if (x == 0) pos = null
        break
      case AE.BOTTOM:
        pos = cellIdx + state.columns
        break
      case AE.BOTTOM_RIGHT:
        pos = cellIdx + state.columns + offset
        if (x + 1 == state.columns) pos = null
        break
    }

    if (pos < 0 || pos >= len) return null

    return pos
  },

  // testAroundPos: (cellIndex) => {

  //   console.log(
  //     `[${meth.getPosAround(cellIndex, 7)}]`,
  //     `[${meth.getPosAround(cellIndex, 8)}]`,
  //     `[${meth.getPosAround(cellIndex, 9)}]`
  //   )

  //   console.log(
  //     `[${meth.getPosAround(cellIndex, 4)}]`,
  //     `[${cellIndex}]`,
  //     `[${meth.getPosAround(cellIndex, 6)}]`)

  //   console.log(
  //     `[${meth.getPosAround(cellIndex, 1)}]`,
  //     `[${meth.getPosAround(cellIndex, 2)}]`,
  //     `[${meth.getPosAround(cellIndex, 3)}]`)
  // },

  updateCounterAroundCell: (cellIndex) => {
    // let temp = `BIDX: ${cellIndex}\n`

    for (let key in AE) {
      const pos = meth.getPosAround(cellIndex, AE[key])
      if (pos === null) continue
      if (state.cells[pos].value < 0) continue

      // temp += `[${pos}]: ${state.cells[pos].value + 1}\n`

      // console.log(`[${key}]:`, `[${pos}]`)
      state.cells[pos].value = state.cells[pos].value + 1
    }

    // console.log(temp)
  },

  placeBombs: () => {
    const bombsArray = meth.getRandomBombsPos()

    console.log(bombsArray)

    for (let i = 0; i < bombsArray.length; i++) {
      console.log(`BPOS:${bombsArray[i]}`)
      state.cells[bombsArray[i]].value = -1
      meth.updateCounterAroundCell(bombsArray[i])
    }

    state.started = true
  },

  init: () => {
    const cellsCount = state.columns * state.rows

    state.cells.length = 0

    for (let i = 0; i < cellsCount; i++) {
      state.cells.push({
        opened: false,
        marked: false,
        value: 0
      })
    }
  },

  checkOpened: () => {
    const result = state.cells.reduce((sum, item) => sum + item.value, 0)

    let openedCount = 0

    state.cells.forEach((item, idx, arr) => {
      if (item.opened) openedCount++
    })

    const notBombs = state.cells.length - state.bombs

    return (notBombs - openedCount) <= 0
  },

  // openAroundCell: (cellIdx) => {
  //   for (let key in AE) {
  //     const pos = meth.getPosAround(cellIdx, AE[key],)
  //     if (pos === null) continue
  //     if (state.cells[pos].value < 0) continue

  //     state.cells[pos].value = state.cells[pos].value + 1
  //   }
  // },

  openCell: (val) => {
    if (!state.started) return
    console.log('openCell: ' + val)

    if (val < 0 || val >= state.cells.length) return

    if (state.cells[val].marked) return

    state.cells[val].opened = !state.cells[val].opened

    if (state.cells[val].value < 0) {
      meth.gameOver()

      return
    }

    if (state.cells[val].value == 0) {
      // meth.openAroundCell(val)

      const x = val % state.columns
      const y = parseInt(val / state.columns)

      meth.forEachArround(x, y, (a, b) => {
        const pos =  state.columns * b + a
        if (!state.cells[pos].opened) meth.openCell(pos)
      })
    }

    if (meth.checkOpened()) {
      meth.gameWin()
    }
  },

  toggleFlagCell: (val) => {
    if (!state.started) return
    console.log('toggleFlag: ' + val)

    if (val < 0 || val >= state.cells.length) return

    state.cells[val].marked = !state.cells[val].marked
  },

  gameEnd: () => {
    state.started = false
    setTimeout(() => {
      meth.init()
      meth.placeBombs()
    }, 5000)

    let time = 0

    state.cells.forEach((item, idx, arr) => {
      if (item.value < 0 && !item.opened) {
        time += 100
        setTimeout(() => {
          item.opened = true
        }, time)
      }
    })
  },

  gameOver: () => {
    console.log('GAME_OVER')
    meth.gameEnd()
  },

  gameWin: () => {
    console.log('YOU_WIN')
    meth.gameEnd()
  },
}

onMounted(() => {
  meth.init()
  meth.placeBombs()

  // meth.updateCounterAroundCell(10)
  // meth.testAroundPos(68)
})

</script>