// https://medium.com/@predragdavidovic10/native-dual-range-slider-html-css-javascript-91e778134816 

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
// unsure if this actually works for me, might need changes
function makeToSliderAccessible(target) {
    if (Number(target.value) <= 0) {
        target.style.zIndex = 2
    } else {
        target.style.zIndex = 0
    }
}

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

function controlFromInput(fromSlider, fromInput, toInput, controlSlider) {
    const [from, to] = parseIntValue(fromInput, toInput);
    changeFillSlider(fromInput, toInput, 'white', 'black', controlSlider);
    if (from > to) {
        fromSlider.value = to;
        fromInput.value = to;
    } else {
        fromSlider.value = from;
    }
}

function controlToInput(toSlider, fromInput, toInput, controlSlider) {
    const [from, to] = parseIntValue(fromInput, toInput);
    changeFillSlider(fromInput, toInput, 'white', 'black', controlSlider);
    makeToSliderAccessible(toInput);
    if (from <= to) {
        toSlider.value = to;
        toInput.value = to;
    } else {
        toInput.value = from;
    }
}

/// data list and other calculations ///

function filterCompanyArray(data, toSlider, fromSlider, variable) {
    const includedItems = data.filter((a) => {
        return a[variable] < +toSlider.value && a[variable] > +fromSlider.value
    })

    return includedItems
}

function updateDropdownOptions(keys) {
    const dropDown = document.querySelector('#variables')
    keys.forEach(key => {
        if (key !== "Company" && key !== "GlobalRank" && key !== "Country") {
            dropDown.innerHTML += `<option value="${key}">${key}</option>`
        }
    })

    return dropDown
}

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

function generateBinnedData(minDataValue, maxDataValue, data, dropDown) {
    const binGenerator = d3.bin().domain([minDataValue, maxDataValue]).thresholds(150)
    const bin = binGenerator(data.map(d => d[dropDown.value]))

    return bin
}

function calculateBinLength(bin) {
    return bin.map((b, i) => {
        return b.length
    })
}

function updateVisualization(svg, colorScale, bin, width, height, heatOfBin) {

    let binWidth = 0

    var bars = svg.selectAll("rect")
        .data(heatOfBin)

    bars.exit()
        .transition()
        // .duration(750)
        .attr("fill", "white")
        .remove();

    bars.enter()
        .append("rect")
        .attr("y", 0)
        .attr("height", height)
        .attr("width", width / bin.length)
        .attr('fill', d => colorScale(d))
        .merge(bars)
        .transition()
        .attr("width", width / bin.length)
        .attr('fill', d => colorScale(d))
        .attr('x', function (d, i) {
            if (i !== 0) {
                binWidth = binWidth + width / bin.length
            }

            return binWidth
        })
}

function init() {

    d3.csv(data, function (d, i) {
        return {
            "Company": d.Company,
            "Country": d.Country,
            "GlobalRank": +d["Global Rank"],
            "Market Value ($billion)": +d["Market Value ($billion)"],
            "Profits ($billion)": +d["Profits ($billion)"],
            "Sales ($billion)": +d["Sales ($billion)"]
        }
    }).then((data) => {

        const dropDownKeys = Object.keys(data[0])
        const dropDown = updateDropdownOptions(dropDownKeys)

        data.sort((a, b) => { return a[dropDown.value] < b[dropDown.value] })
        let selectionOf100Companies = data.filter((d, i) => { return i <= 299 })
        selectionOf100Companies.sort((a, b) => { return a[dropDown.value] < b[dropDown.value] })
        selectionOf100Companies.forEach(d => {
            dataList.innerHTML += addCustomListElement(d.Company, d[dropDown.value], d.GlobalRank)
        })

        let minAndMaxValues = calcMinAndMax(selectionOf100Companies, dropDown)
        console.log(minAndMaxValues)

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

        // this method triggers a function everytime we change the numeric value in the field
        fromInput.oninput = () => { controlFromInput(fromSlider, fromInput, toInput, toSlider) }
        toInput.oninput = () => { controlToInput(toSlider, fromInput, toInput, toSlider) }

        // initialization of data for the visualization
        let binWidth = 0
        let bin = generateBinnedData(minAndMaxValues.minDataValue, minAndMaxValues.maxDataValue, selectionOf100Companies, dropDown)
        let heatOfBin = calculateBinLength(bin)
        let colorScale = d3.scaleSequential().domain(d3.extent(heatOfBin)).interpolator(d3.interpolateReds)

        svg.selectAll()
            .data(heatOfBin)
            .enter()
            .append('rect')
            .attr('x', function (d, i) {
                if (i !== 0) { binWidth = binWidth + width / bin.length }
                return binWidth
            })
            .attr("y", 0)
            .attr("height", height)
            .attr("width", width / bin.length)
            .attr('fill', d => colorScale(d))

        // Listen to the change of the dropdown and update list + visualization
        dropDown.addEventListener("change", function () {

            // reset data list and sort again based on new data
            dataList.innerHTML = ''
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

            bin = generateBinnedData(minAndMaxValues.minDataValue, minAndMaxValues.maxDataValue, selectionOf100Companies, dropDown)
            heatOfBin = calculateBinLength(bin)
            updateVisualization(svg, colorScale, bin, width, height, heatOfBin)
        })

        const sliders = [fromSlider, toSlider]
        sliders.forEach(slider => {
            let previousFromSliderValue = +fromSlider.value
            let previousToSliderValue = +toSlider.value
            // console.log(slider.id)
            slider.addEventListener("change", function () {
                const includedCompanies = filterCompanyArray(selectionOf100Companies, toSlider, fromSlider, dropDown.value)
                const excludedCompanies = selectionOf100Companies.filter(item => !includedCompanies.includes(item))

                if (slider.id === 'from-slider') {
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

                    previousFromSliderValue = fromSlider.value

                } else if ((slider.id === 'to-slider')) {
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

                    previousToSliderValue = toSlider.value
                }
            }, false)
        })

        // This code could be simplified, e.g. by iterating through DOM nodes
        // fromSlider.addEventListener("change", function () {

        //     const includedCompanies = filterCompanyArray(selectionOf100Companies, toSlider, fromSlider, dropDown.value)
        //     const excludedCompanies = selectionOf100Companies.filter(item => !includedCompanies.includes(item))

        //     if (+previousSliderValue < +fromSlider.value) {
        //         excludedCompanies.forEach((d) => {
        //             const rankId = d.GlobalRank + d.Company.substring(0, 3)
        //             const currentListElement = document.getElementById(`#${rankId}`)
        //             currentListElement.classList.remove('visible');
        //             currentListElement.classList.add('invisible');
        //         })
        //     } else {
        //         includedCompanies.forEach((d) => {
        //             const rankId = d.GlobalRank + d.Company.substring(0, 3)
        //             const currentListElement = document.getElementById(`#${rankId}`)
        //             if (currentListElement.classList.contains('invisible')) {
        //                 currentListElement.classList.remove('invisible');
        //                 currentListElement.classList.add('visible');
        //             }
        //         })
        //     }

        //     previousSliderValue = fromSlider.value

        // }, false);

        // toSlider.addEventListener("change", function () {

        //     const includedCompanies = filterCompanyArray(selectionOf100Companies, toSlider, fromSlider, dropDown.value)
        //     const excludedCompanies = selectionOf100Companies.filter(item => !includedCompanies.includes(item))

        //     if (+previousSliderValue >= +fromSlider.value) {
        //         excludedCompanies.forEach((d) => {
        //             const rankId = d.GlobalRank + d.Company.substring(0, 3)
        //             const currentListElement = document.getElementById(`#${rankId}`)
        //             currentListElement.classList.remove('visible');
        //             currentListElement.classList.add('invisible');
        //         })
        //     } else {
        //         includedCompanies.forEach((d) => {
        //             const rankId = d.GlobalRank + d.Company.substring(0, 3)
        //             const currentListElement = document.getElementById(`#${rankId}`)
        //             if (currentListElement.classList.contains('invisible')) {
        //                 currentListElement.classList.remove('invisible');
        //                 currentListElement.classList.add('visible');
        //             }
        //         })
        //     }

        //     previousSliderValue = toSlider.value

        // }, false);
    })


}


init()

