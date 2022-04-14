<style scoped>
.controls {
  display: flex;
  justify-content: center;
  gap: 5px;
}
.group {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.grid {
  display: grid;
  margin: 10px auto 0 auto;
  /* gap: 1px; */
}

.cell-wrap {
  height: 100%;
  text-align: center;
}
</style>

<template>
  <div class="main">
    <div class="controls">
      <div class="group">
        <span>columns</span>
        <input v-model="tempState.columns" min="10" max="60" type="number" />
      </div>
      <div class="group">
        <span>rows</span>
        <input v-model="tempState.rows" min="10" max="30" type="number" />
      </div>
      <div class="group">
        <span>mines</span>
        <input v-model="tempState.bombs" min="10" max="1000" type="number" />
      </div>

      <button @click="meth.init()">restart</button>
    </div>
    <div class="grid" :style="meth.getGridStyle()">
      <div v-for="(cell, index) in state.cells || []" :key="index" class="cell-wrap">
        <BoardCell
          :data="cell"
          @left-click="meth.openCell(index, $event)"
          @right-click="meth.toggleFlagCell(index, $event)"
        />
      </div>
    </div>
  </div>
</template>

<script  setup>
import { onMounted, reactive } from 'vue'
import BoardCell from './BoardCell.vue'

const tempState = reactive({
  columns: 10,
  rows: 10,
  bombs: 10,
})

const state = reactive({
  columns: 0,
  rows: 0,
  bombs: 0,

  cellSize: 30,

  cells: [],

  started: false,
  lastOpened: 0
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

  getX(index) {
    return index % state.columns
  },

  getY(index) {
    return parseInt(index / state.columns)
  },

  getPosFromXY(x, y) {
    return state.columns * y + x
  },

  forEachArround(index, callback) {
    const x = this.getX(index)
    const y = this.getY(index)

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

  updateCounterAroundCell: (cellIndex) => {
    // let temp = `BIDX: ${cellIndex}\n`

    meth.forEachArround(cellIndex, (x, y) => {
      const pos = meth.getPosFromXY(x, y)
      if (state.cells[pos].value < 0) return

      state.cells[pos].value = state.cells[pos].value + 1
    })
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
    state.columns = tempState.columns
    state.rows = tempState.rows
    state.bombs = tempState.bombs

    const cellsCount = state.columns * state.rows

    state.cells.length = 0

    if (cellsCount <= state.bombs) {
      console.log(`cellsCount <= state.bombs`)
      return
    }

    for (let i = 0; i < cellsCount; i++) {
      state.cells.push({
        opened: false,
        marked: false,
        value: 0
      })
    }
    meth.placeBombs()
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

  openCell: (val) => {
    if (!state.started) return
    state.lastOpened = val

    console.log('openCell: ' + val)

    if (val < 0 || val >= state.cells.length) return

    if (state.cells[val].marked) return

    state.cells[val].opened = !state.cells[val].opened

    if (state.cells[val].value < 0) {
      meth.gameOver()

      return
    }

    if (state.cells[val].value == 0) {
      let time = 0

      meth.forEachArround(val, (a, b) => {
        time += 10
        setTimeout(() => {
          const pos = state.columns * b + a
          if (!state.cells[pos].opened) {
            meth.openCell(pos)
          }
        }, time)
      })
    }

    if (meth.checkOpened()) {
      meth.gameWin()
    }
  },

  toggleFlagCell: (val) => {
    if (!state.started) return

    if (val < 0 || val >= state.cells.length) return

    state.cells[val].marked = !state.cells[val].marked
  },

  exploseBombs: (arr) => {
    let time = 0

    arr.forEach((item, index) => {
      time += 50
      setTimeout(() => {
        state.cells[item].opened = true
      }, time)
    })

    // meth.forEachArround(pos, (a, b) => {
    //   const newPos = state.columns * b + a

    //   if (state.cells[newPos].value < 0 && !state.cells[newPos].opened) {
    //     console.log(newPos)
    //     time += 10
    //     setTimeout(() => {
    //       state.cells[newPos].opened = true
    //     }, time)
    //   }

    //   meth.exploseBombs(newPos)
    // })
  },

  gameEnd: () => {
    state.started = false

    console.log('state.lastOpened', state.lastOpened)

    const arr = []

    state.cells.forEach((item, index) => {
      if (item.value < 0 && !item.opened) {
        console.log('push', index)
        arr.push(index)
      }
    })

    meth.exploseBombs(arr)
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
})

</script>