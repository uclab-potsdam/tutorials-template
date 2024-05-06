<template>
  <div id="app">
    <squareChart :data="squareChartData" title="CO2 emissions per country" xKey="Country" aKey="C02 per capita (t CO2\/yr)" />
  </div>
</template>

<script>

import squareChart from './components/squareChart.vue'
import json from './assets/co2Data.json'
// import { json } from 'd3'

export default {
  name: 'App',
  components: {
    squareChart
  },
  // Define the data object that you want to share dynamically with child components
  data () {
    return {
      squareChartData: json
    }
  }
}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
