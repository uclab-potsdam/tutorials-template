<template>
  <div id='svg-container' >
    <p>{{ title }}</p>
    <svg class="vis" :width="svgWidth" :height="svgHeight" :viewBox="viewBox">
        <g>
            <rect v-for="(country, index) in rectangle"
              :class="[stepClass, { 'red': index === clickedRectIndex }]"
              :key="country.Country"
              :x="country.x"
              :y="country.y"
              :width="country.a"
              :height="country.a"
              @click="handleClick(country, index)">
            </rect>
          </g>
    </svg>
    <section class="text">
     <IntersectionObserver :step="0">
      <h2 @click="handleClick">cero</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
   </IntersectionObserver>
   <IntersectionObserver :step="1">
            <h2>one</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
  </IntersectionObserver>
     <IntersectionObserver :step="2">
            <h2>two</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
  </IntersectionObserver>
    </section>
  </div>
</template>

<script>
import { min, max } from 'd3-array'
import * as d3 from 'd3'
import _ from 'lodash'
import IntersectionObserver from './IntersectionObserver.vue'
import data from '../assets/co2Data.json'

export default {
  name: 'squareChart',
  components: {
    IntersectionObserver
  },
  props: {
    title: String,
    xKey: String,
    yKey: String,
    aKey: String
  },
  mounted () {
    window.addEventListener('resize', this.handleResize)
    this.handleResize()
    // function will be executed when the 'step' event is emitted in the intersection observer component
    // square chart component updates its own step property with the value received from the event
    this.$on('step', step => {
      this.step = step
    })
  },
  beforeUnmount () {
    window.removeEventListener('resize', this.handleResize)
  },
  data: () => ({
    svgWidth: 1600,
    step: 0,
    svgHeight: 900,
    nrColumns: 19,
    viewBox: '0 0 1000 1000', // Initial viewBox values
    clickedRectIndex: null,
    filteredCountries: (() => {
      // console.log(data)
      const sortedData = [...data]
      sortedData.sort((a, b) => b.year - a.year)
      return sortedData.filter((obj, index, self) =>
        index === self.findIndex((t) => (
          t.Country === obj.Country
        ))
      )
    })()
  }),
  computed: {
    dataMax () {
      return max(this.filteredCountries, country => {
        return country.C02value
      })
    },
    dataMin () {
      return min(this.filteredCountries, country => {
        return country.C02value
      })
    },
    // function that returns array with the y position of each square:
    yScale () {
      const itemSpacing = this.svgWidth / (this.nrColumns * 2)
      const myY = this.filteredCountries.map((d, index) => {
        const y = (itemSpacing + (Math.floor(index / this.nrColumns)) * 2 * itemSpacing)
        return y
      })
      // console.log('myY', myY)
      return {
        y: myY
      }
    },
    xScale () {
      const itemSpacing = this.svgWidth / (this.nrColumns * 2)
      const myX = this.filteredCountries.map((d, index) => {
        const x = (itemSpacing + (index % this.nrColumns) * 2 * itemSpacing)
        return x
      })
      return {
        x: myX
      }
    },
    // d3Scale Linear helps us to construct a scale with a linear relationship between input and output
    // domain -> observation here: amount, range -> visual variable in px
    aScale () {
      return {
        a: d3.scaleLinear()
          .range([2, this.svgWidth / 10])
          .domain([this.dataMin, this.dataMax])
      }
    },
    rectangle () {
      return _.map(this.filteredCountries, (country) => {
        // console.log('this.filteredCountries.indexOf(country): ' + this.filteredCountries.indexOf(country))
        // console.log('this.xScale.x(this.filteredCountries.indexOf(country)): ' + this.xScale.x[this.filteredCountries.indexOf(country)])
        // console.log('-------------------------------------------------------- ')
        return {
          y: this.yScale.y[this.filteredCountries.indexOf(country)] - this.aScale.a(country.C02value) / 2,
          x: this.xScale.x[this.filteredCountries.indexOf(country)] - this.aScale.a(country.C02value) / 2,
          a: this.aScale.a(country.C02value),
          name: country.Country
        }
      })
    },
    stepClass () {
      if (this.step === 1) return 'blue'
      if (this.step === 2) return 'green'
      return ''
    }
  },
  methods: {
  // returns all the values needed to build chart:
  // x and y position, width/length a of square
    handleResize () {
      // Update svgWidth based on the width of the SVG container
      this.svgWidth = document.getElementById('svg-container').offsetWidth * 0.99
    },
    handleClick (country, index) {
      this.clickedRectIndex = index
      console.log('index: ' + index)
      console.table(country)
      // const size = 1000
      // const zoomFactor = 2 // Adjust the zoom factor as needed
      // const newViewBoxWidth = size / zoomFactor
      // const newViewBoxHeight = size / zoomFactor
      // const newViewBoxX = 0 - (size / 2 - country.x) + newViewBoxWidth
      // const newViewBoxY = 0 - (size / 2 - country.y) + newViewBoxHeight
      this.viewBox = `${300} ${300} ${1000} ${1000}`
      console.table(country)
      console.table(this.viewBox)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.svg-container {
  display: inline-block;
  position: relative;
  width: 100%;
  padding-bottom: 1%;
  vertical-align: top;
  overflow: hidden;
}

rect {
  fill: #CDCDCD;
  stroke: #9A9A9A;
  stroke-width: 1px;
  &.blue {
    fill: blue;
  }
  &.green {
    transition-property: fill;
    fill: green;
    transition-duration: 1000ms;
  }
  &.red {
    fill: red;
  }
}
.vis {
  width: 100%;
  height: 100vh;
  z-index: 0;
  position: sticky;
  top: 20px;
  left: 0;
}
.text {
    margin-top: -100vh;
    z-index: 1;
    min-height: 100vh;
    pointer-events: none;
    width: 20%;
    }
</style>
