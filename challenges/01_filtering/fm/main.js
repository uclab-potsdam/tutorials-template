// selection of DOM element for native double range slider
const fromSlider = document.querySelector('#from-slider');
const toSlider = document.querySelector('#to-slider');
const fromInput = document.querySelector('#from-input');
const toInput = document.querySelector('#to-input');

// path to the dataset
const data = "./data/Top2000CompaniesGlobally.csv"

// selection of the DOM container for the data list
const dataList = document.querySelector('#data-list');

// initialization of the svg
const svg = d3.select("#visualization").append("svg")
svg.attr("width", "100%")
svg.attr("height", "100%")

const width = svg._groups[0][0].clientWidth
const height = svg._groups[0][0].clientHeight

/// logic for dual slider ///
// Inspired and re-adapted from:
// https://medium.com/@predragdavidovic10/native-dual-range-slider-html-css-javascript-91e778134816

// highlights the range currently selected by the slider
function changeFillSlider(fromSlider, toSlider, sliderColor, rangeColor, controlSlider) {
    const rangeDistance = toSlider.max - toSlider.min;
    const fromPosition = fromSlider.value - fromSlider.min;
    const toPosition = toSlider.value - toSlider.min;

    // change the color of the slider
    controlSlider.style.background = `linear-gradient(
      to right,
      ${sliderColor} 0%,
      ${sliderColor} ${(fromPosition) / (rangeDistance) * 100}%,
      ${rangeColor} ${((fromPosition) / (rangeDistance)) * 100}%,
      ${rangeColor} ${(toPosition) / (rangeDistance) * 100}%, 
      ${sliderColor} ${(toPosition) / (rangeDistance) * 100}%, 
      ${sliderColor} 100%)`;
}

// This function parses the range values and returns them as an array
function parseIntValue(currentFromValue, currentToValue) {
    const parsedFromValue = parseInt(currentFromValue.value, 10);
    const parsedToValue = parseInt(currentToValue.value, 10);
    return [parsedFromValue, parsedToValue]
}

// change z-index of toSlider to always make it accessible to click events
function makeToSliderAccessible(target) {
    if (Number(target.value) <= 0) {
        target.style.zIndex = 2
    } else {
        target.style.zIndex = 0
    }
}

// these two functions control the sliders and will provide us the values to filter our list of companies
function controlFromSlider(fromSlider, toSlider, fromInput) {
    const [from, to] = parseIntValue(fromSlider, toSlider)
    changeFillSlider(fromSlider, toSlider, 'black', 'black', toSlider);
    if (from > to) {
        fromSlider.value = to;
        fromInput.value = to;
    } else {
        fromInput.value = from;
    }
    // console.log('controlFromSlider')
}

function controlToSlider(fromSlider, toSlider, toInput) {
    const [from, to] = parseIntValue(fromSlider, toSlider)
    changeFillSlider(fromSlider, toSlider, 'black', 'black', toSlider);
    makeToSliderAccessible(toSlider)

    if (from <= to) {
        toSlider.value = to;
        toInput.value = to;
    } else {
        toInput.value = from;
        toSlider.value = from;
    }
}

/// data list and other calculations ///

// this function makes sure we always show only data for the selected range of numbers
function filterCompanyArray(data, toSlider, fromSlider, variable) {
    const includedItems = data.filter((a) => {
        return a[variable] < +toSlider.value && a[variable] > +fromSlider.value
    })

    return includedItems
}

// This function is run at line x and initialises our dropdown menu with the dataset headers
function updateDropdownOptions(keys) {
    const dropDown = document.querySelector('#variables')
    keys.forEach(key => {
        if (key !== "Company" && key !== "GlobalRank" && key !== "Country") {
            dropDown.innerHTML += `<option value="${key}">${key}</option>`
        }
    })

    return dropDown
}

// we run this function at the beginning and everytime the user selects a value from the dropdown,
// it allows for the min and max range of numbers in the dataset to be calculated
function calcMinAndMax(data, variable) {
    const minDataValue = d3.min(data.map(d => d[variable.value]))
    const maxDataValue = d3.max(data.map(d => d[variable.value]))
    return {
        minDataValue,
        maxDataValue,
        minRoundedValue: Math.floor(minDataValue),
        maxRoundedValue: Math.ceil(maxDataValue)
    }
}

/// data and visualization's updates ///

// we run these functions at the beginning and everytime the user selects a value from the dropdown,
// they prepare the binned data to show colored bars where data are more dense
function generateBinnedData(minDataValue, maxDataValue, data, dropDown) {
    const binGenerator = d3.bin().domain([minDataValue, maxDataValue]).thresholds(150)
    const bins = binGenerator(data.map(d => d[dropDown.value]))

    return bins
}

function calculateBinLength(bins) {
    return bins.map((b, i) => {
        return b.length
    })
}

// this function creates and push a list element with the company name and value.
// It is run everytime we need to update the list of elements.
function addCustomListElement(companyName, companyValue, rank) {

    const nameOfCompany = companyName
    let valueOfCompany = companyValue
    const rankId = rank + companyName.substring(0, 3)
    valueOfCompany = companyValue + ' Bln $'

    return `
        <li id="#${rankId}">
            <div class="list-item-container">
                <div class="company-name">
                    <div>${nameOfCompany}</div>
                </div>
                <div class="profit">
                    <div>${valueOfCompany}</div>
                </div>
            </div>
        </li>
        `
}

// we run these functions at the beginning and everytime the user selects a value from the dropdown,
// it updates the colored bars to display the new distribution of "heat"
function updateVisualization(svg, colorScale, bins, width, height, heatOfBin) {

    let binWidth = 0

    var bars = svg.selectAll("rect")
        .data(heatOfBin)

    bars.exit()
        .transition()
        .attr("fill", "white")
        .remove();

    bars.enter()
        .append("rect")
        .attr("y", 0)
        .attr("height", height)
        .attr("width", width / bins.length)
        .attr('fill', d => colorScale(d))
        .merge(bars)
        .transition()
        .attr("width", width / bins.length)
        .attr('fill', d => colorScale(d))
        .attr('x', function (d, i) {
            if (i !== 0) {
                binWidth = binWidth + width / bins.length
            }

            return binWidth
        })
}

function init() {
    // Everything that needs to happen after the data are loaded needs to be executed inside this 
    // async function. The data are first loaded, THEN visualization and list is created
    d3.csv(data, function (d, i) {
        //dat are parsed and initialised
        return {
            "Company": d.Company,
            "Country": d.Country,
            "GlobalRank": +d["Global Rank"],
            "Market Value ($billion)": +d["Market Value ($billion)"],
            "Profits ($billion)": +d["Profits ($billion)"],
            "Sales ($billion)": +d["Sales ($billion)"]
        }
    }).then((data) => {
        // we pass the column headers (or object keys) to our dropdown, 
        // to be able to change the parameter for filtering
        const dropDownKeys = Object.keys(data[0])
        const dropDown = updateDropdownOptions(dropDownKeys)

        // we sort data, going from the bigger to the smaller value
        data.sort((a, b) => { return a[dropDown.value] < b[dropDown.value] })
        // we filter data to consider only 300 companies
        let selectionOf100Companies = data.filter((d, i) => { return i <= 299 })
        // we create our initial list, by running the function on line 116
        selectionOf100Companies.forEach(d => {
            dataList.innerHTML += addCustomListElement(d.Company, d[dropDown.value], d.GlobalRank)
        })

        // Not so elegant :P but what we do here is that we calculate the min and max data values and then
        // pass them to the sliders, so that they will reset their ranges.
        let minAndMaxValues = calcMinAndMax(selectionOf100Companies, dropDown)

        fromSlider.min = minAndMaxValues.minRoundedValue
        fromSlider.max = minAndMaxValues.maxRoundedValue
        fromSlider.value = minAndMaxValues.minRoundedValue
        fromInput.value = minAndMaxValues.minRoundedValue

        toSlider.min = minAndMaxValues.minRoundedValue
        toSlider.max = minAndMaxValues.maxRoundedValue
        toSlider.value = minAndMaxValues.maxRoundedValue
        toInput.value = minAndMaxValues.maxRoundedValue


        // initial changes to slider
        changeFillSlider(fromSlider, toSlider, 'white', 'black', toSlider)
        makeToSliderAccessible(toSlider)

        // this method triggers a function everytime we toggle the slider
        fromSlider.oninput = () => { controlFromSlider(fromSlider, toSlider, fromInput) }
        toSlider.oninput = () => { controlToSlider(fromSlider, toSlider, toInput) }

        // computing data for the visualization
        let binWidth = 0
        // to calculate a bins we need to know the min and max values in our data in order to create a bins generator
        // that takes into account our domain. We pass also the data and the dropdown values so that we can filter based on users' selection
        let bins = generateBinnedData(minAndMaxValues.minDataValue, minAndMaxValues.maxDataValue, selectionOf100Companies, dropDown)
        // the resulting dataset (bins) shows creates an array of arrays. Each array contains an N number of data points, which are distributed
        // using a specific binning algorithm. Now we need to count how many data points we have in each bin.
        let heatOfBin = calculateBinLength(bins)
        // we use the count to create a color scale that will use the strongest color for the bin with more data points.
        let colorScale = d3.scaleSequential().domain(d3.extent(heatOfBin)).interpolator(d3.interpolateReds)

        // we create the visualization.
        svg.selectAll()
            .data(heatOfBin)
            .enter()
            .append('rect')
            // the x position of each band is the total width divided by the bins length
            .attr('x', function (d, i) {
                if (i !== 0) { binWidth = binWidth + width / bins.length }
                return binWidth
            })
            .attr("y", 0)
            .attr("height", height)
            .attr("width", width / bins.length)
            .attr('fill', d => colorScale(d))

        // Listen to the change of the dropdown and update list + visualization
        dropDown.addEventListener("change", function () {

            // reset data list and sort again based on new data
            dataList.innerHTML = ''

            // Here we repeat what happen above on line 217
            selectionOf100Companies.sort((a, b) => { return a[dropDown.value] < b[dropDown.value] })

            // insert new lists element inside html
            selectionOf100Companies.forEach(d => {
                dataList.innerHTML += addCustomListElement(d.Company, d[dropDown.value], d.GlobalRank)
            })

            minAndMaxValues = calcMinAndMax(selectionOf100Companies, dropDown)

            fromSlider.min = minAndMaxValues.minRoundedValue
            fromSlider.max = minAndMaxValues.maxRoundedValue
            fromSlider.value = minAndMaxValues.minRoundedValue
            fromInput.value = minAndMaxValues.minRoundedValue

            toSlider.min = minAndMaxValues.minRoundedValue
            toSlider.max = minAndMaxValues.maxRoundedValue
            toSlider.value = minAndMaxValues.maxRoundedValue
            toInput.value = minAndMaxValues.maxRoundedValue

            // We also change our binned data, since we work with a new range of values, then we update the visualization.
            bins = generateBinnedData(minAndMaxValues.minDataValue, minAndMaxValues.maxDataValue, selectionOf100Companies, dropDown)
            heatOfBin = calculateBinLength(bins)
            updateVisualization(svg, colorScale, bins, width, height, heatOfBin)
        })

        // From this line on, we implement a workflow to update the list as soon as the user moves the sliders.
        // we create an array of sliders
        const sliders = [fromSlider, toSlider]

        // we iterate over each slider
        sliders.forEach(slider => {
            // we save the previous sliders' values. This will come in hand when we filter the companies
            // that should be included or excluded from the list.
            let previousFromSliderValue = +fromSlider.value
            let previousToSliderValue = +toSlider.value

            // we ad an event listener to the current slider to trigger changes in the list
            slider.addEventListener("change", function () {
                // everytime that the slider is toggled we want to check if a company makes the cut. We create two arrays, one for included companies
                // and one for excluded companies, which is created from the previous one
                const includedCompanies = filterCompanyArray(selectionOf100Companies, toSlider, fromSlider, dropDown.value)
                const excludedCompanies = selectionOf100Companies.filter(item => !includedCompanies.includes(item))

                // we start with one slider
                if (slider.id === 'from-slider') {
                    // if the current value is bigger than the previous one then we take out companies that should be excluded and viceversa
                    if (+previousFromSliderValue < +fromSlider.value) {
                        excludedCompanies.forEach((d) => {
                            const rankId = d.GlobalRank + d.Company.substring(0, 3)
                            const currentListElement = document.getElementById(`#${rankId}`)
                            currentListElement.classList.remove('visible');
                            currentListElement.classList.add('invisible');
                        })
                    } else {
                        includedCompanies.forEach((d) => {
                            const rankId = d.GlobalRank + d.Company.substring(0, 3)
                            const currentListElement = document.getElementById(`#${rankId}`)
                            if (currentListElement.classList.contains('invisible')) {
                                currentListElement.classList.remove('invisible');
                                currentListElement.classList.add('visible');
                            }
                        })
                    }
                    // we update the previous slider value
                    previousFromSliderValue = fromSlider.value

                } else if ((slider.id === 'to-slider')) {
                    // the same logic is applied to the second slider
                    if (+previousToSliderValue >= +toSlider.value) {
                        excludedCompanies.forEach((d) => {
                            const rankId = d.GlobalRank + d.Company.substring(0, 3)
                            const currentListElement = document.getElementById(`#${rankId}`)
                            currentListElement.classList.remove('visible');
                            currentListElement.classList.add('invisible');
                        })
                    } else {
                        includedCompanies.forEach((d) => {
                            // console.log(d[dropDown.value] <= +fromSlider.value)
                            const rankId = d.GlobalRank + d.Company.substring(0, 3)
                            const currentListElement = document.getElementById(`#${rankId}`)
                            if (currentListElement.classList.contains('invisible')) {
                                currentListElement.classList.remove('invisible');
                                currentListElement.classList.add('visible');
                            }
                        })
                    }
                    // again, we update the second slider previous value
                    previousToSliderValue = toSlider.value
                }
            }, false)
        })
    })


}

// run everything!
init()

