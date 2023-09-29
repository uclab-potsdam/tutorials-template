// https://github.com/d3/d3-brush for the brush effect
// https://medium.com/@predragdavidovic10/native-dual-range-slider-html-css-javascript-91e778134816 

const data = "./data/Top2000CompaniesGlobally.csv"

// for the native double range slider
const fromSlider = document.querySelector('#from-slider');
const toSlider = document.querySelector('#to-slider');
const fromInput = document.querySelector('#from-input');
const toInput = document.querySelector('#to-input');

const dataList = document.querySelector('#data-list');

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
    changeFillSlider(fromSlider, toSlider, 'white', 'black', toSlider);
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
    changeFillSlider(fromSlider, toSlider, 'white', 'black', toSlider);
    makeToSliderAccessible(toSlider)

    if (from <= to) {
        toSlider.value = to;
        toInput.value = to;
    } else {
        toInput.value = from;
        toSlider.value = from;
    }
}

////

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

function addCustomListElement(companyName, companyValue, valueVariable, rank) {

    const nameOfCompany = companyName
    let valueOfCompany = companyValue
    const rankId = rank + companyName.substring(0, 3)

    if (valueVariable === 'profit') {
        valueOfCompany = companyValue + ' Bln $'
    }

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

function filterCompanyArray(data, toSlider, fromSlider, variable) {
    const includedItems = data.filter((a) => {
        return a[variable] < +toSlider.value && a[variable] > +fromSlider.value
    })

    return includedItems
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
        const dropDown = document.querySelector('#variables')
        dropDownKeys.forEach(key => {
            if (key !== "Company" && key !== "GlobalRank" && key !== "Country") {
                dropDown.innerHTML += `<option value="${key}">${key}</option>`
            }
        })

        data.sort((a, b) => { return a[dropDown.value] < b[dropDown.value] })
        let selectionOf100Companies = data.filter((d, i) => { return i <= 99 })
        selectionOf100Companies.sort((a, b) => { return a[dropDown.value] > b[dropDown.value] })

        selectionOf100Companies.forEach(d => {
            dataList.innerHTML += addCustomListElement(d.Company, d[dropDown.value], 'profit', d.GlobalRank)
        })

        let minDataValue = d3.min(selectionOf100Companies.map(d => d[dropDown.value]))
        let maxDataValue = d3.max(selectionOf100Companies.map(d => d[dropDown.value]))

        let minRoundedValue = Math.floor(minDataValue)
        let maxRoundedValue = Math.ceil(maxDataValue)

        fromSlider.min = minRoundedValue
        fromSlider.max = maxRoundedValue
        fromSlider.value = minRoundedValue
        fromInput.value = minRoundedValue

        toSlider.min = minRoundedValue
        toSlider.max = maxRoundedValue
        toSlider.value = maxRoundedValue
        toInput.value = maxRoundedValue


        // initial changes to slider
        changeFillSlider(fromSlider, toSlider, 'white', 'black', toSlider)
        makeToSliderAccessible(toSlider)

        // this method triggers a function everytime we toggle the slider
        fromSlider.oninput = () => { controlFromSlider(fromSlider, toSlider, fromInput) }
        toSlider.oninput = () => { controlToSlider(fromSlider, toSlider, toInput) }
        // this method triggers a function everytime we change the numeric value in the field
        fromInput.oninput = () => { controlFromInput(fromSlider, fromInput, toInput, toSlider) }
        toInput.oninput = () => { controlToInput(toSlider, fromInput, toInput, toSlider) }


        const svg = d3.select("#visualization").append("svg")
        svg.attr("width", "100%")
        svg.attr("height", "100%")

        const width = svg._groups[0][0].clientWidth
        const height = svg._groups[0][0].clientHeight


        const binGenerator = d3.bin().domain([minDataValue, maxDataValue]).thresholds(200)
        const bin = binGenerator(selectionOf100Companies.map(d => d[dropDown.value]))
        let binWidth = 0

        const heatOfBin = bin.map((b, i) => {
            return b.length
        })

        const x = d3.scaleLinear().range([0, width]).domain(d3.extent(heatOfBin))
        const colorScale = d3.scaleSequential().domain(d3.extent(heatOfBin)).interpolator(d3.interpolateReds)
        console.log(heatOfBin)

        svg.selectAll()
            .data(heatOfBin)
            .enter()
            .append('rect')
            .attr('x', function (d, i) {
                binWidth = binWidth + width / bin.length
                return binWidth
            })
            .attr("y", height / 2)
            .attr("height", 40)
            .attr("width", width / bin.length)
            .attr('fill', d => colorScale(d))

        dropDown.addEventListener("change", function () {
            dataList.innerHTML = ''

            const sortedDataBySelector = data.sort((a, b) => { return a[dropDown.value] < b[dropDown.value] })
            selectionOf100Companies = sortedDataBySelector.filter((d, i) => { return i <= 99 })

            selectionOf100Companies.forEach(d => {
                dataList.innerHTML += addCustomListElement(d.Company, d[dropDown.value], 'profit', d.GlobalRank)
            })

            minDataValue = d3.min(selectionOf100Companies.map(d => d[dropDown.value]))
            maxDataValue = d3.max(selectionOf100Companies.map(d => d[dropDown.value]))

            minRoundedValue = Math.floor(minDataValue)
            maxRoundedValue = Math.ceil(maxDataValue)

            fromSlider.min = minRoundedValue
            fromSlider.max = maxRoundedValue
            fromSlider.value = minRoundedValue
            fromInput.value = minRoundedValue

            toSlider.min = minRoundedValue
            toSlider.max = maxRoundedValue
            toSlider.value = maxRoundedValue
            toInput.value = maxRoundedValue
        })

        let previousSliderValue = fromSlider.value
        // This code could be simplified, e.g. by iterating through DOM nodes
        fromSlider.addEventListener("change", function () {

            const includedCompanies = filterCompanyArray(selectionOf100Companies, toSlider, fromSlider, dropDown.value)
            const excludedCompanies = selectionOf100Companies.filter(item => !includedCompanies.includes(item))

            if (+previousSliderValue < +fromSlider.value) {
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

            previousSliderValue = fromSlider.value

        }, false);

        toSlider.addEventListener("change", function () {

            const includedCompanies = filterCompanyArray(selectionOf100Companies, toSlider, fromSlider, dropDown.value)
            const excludedCompanies = selectionOf100Companies.filter(item => !includedCompanies.includes(item))

            console.log(includedCompanies)

            if (+previousSliderValue >= +fromSlider.value) {
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

            previousSliderValue = toSlider.value

        }, false);
    })


}


init()

