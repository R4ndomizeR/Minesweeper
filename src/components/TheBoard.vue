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
        <span>rows</span>
        <input v-model="inputState.rows" min="10" max="30" type="number" />
      </div>

      <div class="group">
        <span>columns</span>
        <input v-model="inputState.columns" min="10" max="60" type="number" />
      </div>

      <div class="group">
        <span>mines</span>
        <input v-model="inputState.bombs" min="10" max="1000" type="number" />
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
import { utils } from '../helpers/utils.js'
import BoardCell from './BoardCell.vue'

const inputState = reactive({
  columns: 10,
  rows: 10,
  bombs: 10,
})

const state = reactive({
  started: false,
  lastOpened: 0,

  columns: 0,
  rows: 0,
  bombs: 0,

  cellSize: 30,

  cells: [],
  bombsArray: []
})

const meth = {
  init: () => {
    state.cells.length = 0
    state.bombsArray.length = 0

    state.columns = inputState.columns
    state.rows = inputState.rows
    state.bombs = inputState.bombs

    const cellsCount = state.columns * state.rows

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

    // console.log(state.cells)

    meth.placeBombs()
  },

  getGridStyle: () => {
    return `
      grid-template-columns: repeat(${state.columns}, ${state.cellSize}px);
      grid-template-rows: repeat(${state.rows}, ${state.cellSize}px);
    `
  },

  updateCounterAroundCell: (cellIndex) => {
    // let temp = `BIDX: ${cellIndex}\n`

    utils.forEachArround(cellIndex, state.rows, state.columns, (x, y) => {
      const pos = utils.getPosFromXY(x, y, state.columns)
      if (state.cells[pos].value < 0) return

      state.cells[pos].value = state.cells[pos].value + 1
    })
  },

  placeBombs: () => {
    state.bombsArray = utils.getRandomArray(0, state.columns * state.rows, state.bombs)

    // console.log(state.bombsArray)

    state.bombsArray.forEach((item) => {
      // console.log(`BPOS:${item}`)
      state.cells[item].value = -1
      meth.updateCounterAroundCell(item)
    })

    // for (let i = 0; i < state.bombsArray.length; i++) {
    //   // console.log(`BPOS:${state.bombsArray[i]}`)
    //   state.cells[state.bombsArray[i]].value = -1
    //   meth.updateCounterAroundCell(state.bombsArray[i])
    // }

    state.started = true
  },

  isAllOpened: () => {
    // const result = state.cells.reduce((sum, item) => sum + item.value, 0)

    let openedCount = 0

    state.cells.forEach((item) => {
      if (item.opened) openedCount++
    })

    const notBombs = state.cells.length - state.bombs

    return (notBombs - openedCount) <= 0
  },

  openCell: (val) => {
    if (!state.started) return
    state.lastOpened = val

    // console.log('openCell: ' + val)

    if (val < 0 || val >= state.cells.length) return

    if (state.cells[val].marked) return

    state.cells[val].opened = !state.cells[val].opened

    if (state.cells[val].value < 0) {
      meth.gameOver()

      return
    }

    if (state.cells[val].value == 0) {
      let time = 0

      utils.forEachArround(val, state.rows, state.columns, (a, b) => {
        time += 20
        setTimeout(() => {
          const pos = state.columns * b + a
          if (!state.cells[pos].opened) {
            meth.openCell(pos)
          }
        }, time)
      })
    }

    if (meth.isAllOpened()) meth.gameWin()
  },

  toggleFlagCell: (val) => {
    if (!state.started) return

    if (!utils.inInterval(0, state.cells.length, val)) return

    state.cells[val].marked = !state.cells[val].marked
  },

  exploseBombs: () => {
    let time = 0

    state.bombsArray.filter((idx) => {
      if (!state.cells.includes(idx)) return false

      if (state.cells[idx].value < 0 && !state.cells[idx].opened) return true
    })

    state.bombsArray.sort((a, b) =>
      utils.getDistance(
        utils.getX(state.lastOpened, state.columns),
        utils.getY(state.lastOpened, state.columns),
        utils.getX(a, state.columns),
        utils.getY(a, state.columns)
      ) - utils.getDistance(
        utils.getX(state.lastOpened, state.columns),
        utils.getY(state.lastOpened, state.columns),
        utils.getX(b, state.columns),
        utils.getY(b, state.columns)
      )
    )

    state.bombsArray.forEach((idx) => {
      time += 80
      setTimeout(() => {
        state.cells[idx].opened = true
      }, time)
    })
  },

  gameEnd: () => {
    state.started = false
  },

  gameOver: () => {
    console.log('GAME_OVER')
    meth.gameEnd()
    meth.exploseBombs()
    alert('GAME_OVER')
  },

  gameWin: () => {
    console.log('YOU_WIN')
    meth.gameEnd()
    alert('YOU_WIN')
  },
}

onMounted(() => {
  meth.init()
})

</script>