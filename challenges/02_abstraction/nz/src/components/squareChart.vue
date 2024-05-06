<template>
  <div id='svg-container'>
    <p class="title">{{ title }}</p>
    <svg class="vis" :width="svgWidth" :height="svgHeight">
        <defs>
    <radialGradient id="RadialGradient1">
      <stop offset="0%" stop-color="white" />
      <stop offset="100%" stop-color=#E6E6E6 />
    </radialGradient>
  </defs>
        <g :transform="transform">
            <rect v-for="(country, index) in rectangle"
              :class="[stepClass[index], { 'red': index === clickedRectIndex }]"
              :key="country.Country"
              :x="country.x"
              :y="country.y"
              :width="country.a"
              :height="country.a"
              @click="handleClick(country, index)"
              fill="url(#RadialGradient1)"
              >
            </rect>
            <g v-if="step === 3">
            <rect v-for="(country) in rectangle"
              class="GDPrectangle"
              :key="country.Country"
              :x="country.xGDP"
              :y="country.yGDP"
              :width="country.aGDP"
              :height="country.aGDP"
              fill="url(#RadialGradient1)"
              >
            </rect>
                <g v-for="(country, index) in rectangle" :key="'text-' + index"
                            :x="country.xGDP + 50"
                            :y="country.yGDP"
                            width="40"
                            height="40"
                            style="overflow: visible;">
              <text>{{ country.Country }}
                </text>
                </g>
            </g>
          </g>
    </svg>
    <section class="text">
     <IntersectionObserver :step="0">
      <h2 @click="handleClick">Missing data in <br>C02 emissions data</h2>
            <p>When it comes to climate equity a lot of controversies around how to fairly asses who are the biggest carbon emitters have provided real challenges for international climate policies. (Klinsky et al., 2015).</p>
<p>The dataset chosen for this task shows the C02 emission per capita in tons for 2021. By choosing this dataset and only showing this we would also choose a certain narrative and leave out others that might lead to a different understanding of what is fair.
Graphs only exemplify some of the narratives that can be constructed from data to attempt to answer the question of whose responsibilities are C02 emissions.
</p>
   </IntersectionObserver>
   <IntersectionObserver :step="1">
            <h2>1. The data: CO2 emissions per capita per country</h2>
            <p>Let´s start by taking a look at our current dataset first. Per capita emissions divide a country’s total production-based emissions by its population. It is an important indicator because not only the population size affects a country’s overall emissions, but the people’s lifestyle also matters. Many developing countries, deeming per capita emissions “a direct measure of human welfare” (Aldy, 2006), advocate for using it as the scheme to allocate emission rights.</p>
  </IntersectionObserver>
     <IntersectionObserver :step="2">
            <p>Palau has the highest CO2 emissions per capita in the world. CO2 emissions per capita reached over 60 tonnes in 2021, almost double the emissions per capita of world’s second highest ranked (Qatar). (IMF, 2024)</p>
  </IntersectionObserver>
       <IntersectionObserver :step="3">
            <h2>Palau (2021)</h2>
              <div class="countryCards"> <span class="textHighlighted">CO2 EMISSIONS PER CAPITA:</span> 60.168164 tons</div>
              <div> <span class="textHighlighted">C02 EMISSIONS PER GDP:</span>  5.704522 tons</div>
            <p> Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
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
    zoomFactor: 1, // initial factor
    zoomFactor2: 4,
    nrColumns: 20, // toDo: make this a computed entity
    translateX: 0, // initialize translateX
    translateY: 0, // initialize translateY
    clickedRectIndex: null,
    zoomedRectIndex: null,
    zoomedCountry: 'Palau',
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
        return country['C02 per capita (t CO2/yr)']
      })
    },
    dataMin () {
      return min(this.filteredCountries, country => {
        return country['C02 per capita (t CO2/yr)']
      })
    },
    // function that returns array with the y position of each square:
    yScale () {
      const itemSpacing = this.svgWidth / (this.nrColumns * 2) // toDo: decide itemSpacing both on witdh and height
      const myY = this.filteredCountries.map((d, index) => {
        const y = (itemSpacing + (Math.floor(index / this.nrColumns)) * 2 * itemSpacing)
        return y
      })
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
          .range([2, this.svgWidth / 11])
          .domain([this.dataMin, this.dataMax])
      }
    },
    rectangle () {
      return _.map(this.filteredCountries, (country) => {
        // console.log('this.filteredCountries.indexOf(country): ' + this.filteredCountries.indexOf(country))
        console.log('yGDP: ' + this.yScale.y[this.filteredCountries.indexOf(country)] - this.aScale.a(country['C02 per GDP (t CO2/yr)']) / 2
        )
        // console.log('-------------------------------------------------------- ')
        return {
          y: this.yScale.y[this.filteredCountries.indexOf(country)] - this.aScale.a(country['C02 per capita (t CO2/yr)']) / 2,
          x: this.xScale.x[this.filteredCountries.indexOf(country)] - this.aScale.a(country['C02 per capita (t CO2/yr)']) / 2,
          a: this.aScale.a(country['C02 per capita (t CO2/yr)']),
          yGDP: this.yScale.y[this.filteredCountries.indexOf(country)] - this.aScale.a(country['C02 per GDP (t CO2/yr)']) / 2,
          xGDP: this.xScale.x[this.filteredCountries.indexOf(country)] - this.aScale.a(country['C02 per GDP (t CO2/yr)']) / 2,
          aGDP: this.aScale.a(country['C02 per GDP (t CO2/yr)']),
          name: country.Country
        }
      })
    },
    stepClass () {
      if (this.step === 1) return 'blue'
      if (this.step === 2) {
        // Check if the rectangle's name is 'Palau', if yes, add 'green' class
        return this.rectangle.map(country => country.name === 'Palau' ? 'selected' : '')// Only return 'green' for 'Palau'
      }
      return ''
    },
    // returns the values for the zooming in of a country, used in the <g>
    transform () {
      if (this.step === 3) {
        return `translate(${this.zoomCountry.translateX},${this.zoomCountry.translateY}) scale(${this.zoomFactor2},${this.zoomFactor2})`
      } else {
        return `translate(${this.translateX},${this.translateY}) scale(${this.zoomFactor},${this.zoomFactor})`
      }
    },
    // calculates the new translateX and y values needed to zoom in, into a specific country, used in transform() and passed to <g>
    zoomCountry () {
      const zoomedCountryName = this.zoomedCountry
      console.log(zoomedCountryName)
      // Find the object in the rectangle array with the matching name of country of interest
      const zoomedCountry = this.rectangle.find(country => country.name === zoomedCountryName)
      // console.log('index: ' + index)
      // console.table(country)
      // Calculate the translate values based on the clicked rectangle's position
      const zoomFactor = 4
      const itemSpacing = this.svgWidth / (this.nrColumns * 2)
      const maxHeight = (Math.floor(this.filteredCountries.length / this.nrColumns)) * 2 * itemSpacing
      if (this.step === 3) {
        return {
          translateX: ((1 - zoomFactor) * (this.svgWidth / 2) + ((this.svgWidth / 2 - zoomedCountry.x) * zoomFactor)) - zoomedCountry.a / 2 * zoomFactor,
          translateY: ((1 - zoomFactor) * (maxHeight / 2) + ((maxHeight / 2) - zoomedCountry.y) * zoomFactor) - zoomedCountry.a / 2 * zoomFactor
        }
      }
      return null
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
      // Calculate the translate values based on the clicked rectangle's position
      this.zoomFactor = 4
      const itemSpacing = this.svgWidth / (this.nrColumns * 2)
      const maxHeight = (Math.floor(this.filteredCountries.length / this.nrColumns)) * 2 * itemSpacing
      this.translateX = (1 - this.zoomFactor) * (this.svgWidth / 2) + ((this.svgWidth / 2 - country.x) * this.zoomFactor)
      this.translateY = (1 - this.zoomFactor) * (maxHeight / 2) + ((maxHeight / 2) - country.y) * this.zoomFactor
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.title {
  position:absolute;
}
h2 {
  text-align: left;
  font-size: 1.2rem;
}
h3 {
  margin: 40px 0 0;
}
p {
  text-align: left;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  text-align: left;
  font-size: 1rem;
  font-weight: bold;
  padding: 0;
}
a {
  color: #42b983;
}
.countryCards {
  text-align: left;
  display: block;
  margin-bottom: 0.5rem
}
.svg-container {
  display: inline-block;
  position: relative;
  width: 100%;
  padding-bottom: 1%;
  vertical-align: top;
  overflow: hidden;
}
.countryOverlay{
  box-shadow: 0px 24px 40px -20px rgba(0,0,0,0.15);
  border-radius: 4px;
}
 .textHighlighted {
 background-color: #424242;
 padding: 2px;
 color: #ffffff;
 font-weight: bold;
 font-size: 0.8rem;
}
.GDPrectangle {
  stroke: hsl(0, 0%, 65%);
  fill:#8a848e;
  stroke-width: 0.1px;
}
rect {
  stroke: #a7a7a7;
  stroke-width: 0.3px;
  &.blue {
    fill: blue;
  }
  &.selected {
    transition-property: fill;
    fill: rgb(118, 118, 118);
    transition-duration: 1000ms;
  }
  &.red {
    fill: red;
    transition-duration: 1000ms;

  }
}
g {
  transition: 1s ease;

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
    width: 30%;
    }
</style>
