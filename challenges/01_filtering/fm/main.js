// https://github.com/d3/d3-brush for the brush effect
// https://medium.com/@predragdavidovic10/native-dual-range-slider-html-css-javascript-91e778134816 
// for the native double range slider
const fromSlider = document.querySelector('#from-slider');
const toSlider = document.querySelector('#to-slider');
const fromInput = document.querySelector('#from-input');
const toInput = document.querySelector('#to-input');

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
    changeFillSlider(fromSlider, toSlider, '#C6C6C6', '#25daa5', toSlider);
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
    changeFillSlider(fromSlider, toSlider, '#C6C6C6', '#25daa5', toSlider);
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
    changeFillSlider(fromInput, toInput, '#C6C6C6', '#25daa5', controlSlider);
    if (from > to) {
        fromSlider.value = to;
        fromInput.value = to;
    } else {
        fromSlider.value = from;
    }
}

function controlToInput(toSlider, fromInput, toInput, controlSlider) {
    const [from, to] = parseIntValue(fromInput, toInput);
    changeFillSlider(fromInput, toInput, '#C6C6C6', '#25daa5', controlSlider);
    makeToSliderAccessible(toInput);
    if (from <= to) {
        toSlider.value = to;
        toInput.value = to;
    } else {
        toInput.value = from;
    }
}

function init() {
    // initial changes to slider
    changeFillSlider(fromSlider, toSlider, '#C6C6C6', '#25daa5', toSlider)
    makeToSliderAccessible(toSlider)

    // this method triggers a function everytime we toggle the slider
    fromSlider.oninput = () => { controlFromSlider(fromSlider, toSlider, fromInput) }
    toSlider.oninput = () => { controlToSlider(fromSlider, toSlider, toInput) }
    // this method triggers a function everytime we change the numeric value in the field
    fromInput.oninput = () => { controlFromInput(fromSlider, fromInput, toInput, toSlider) }
    toInput.oninput = () => { controlToInput(toSlider, fromInput, toInput, toSlider) }
}


init()

