var fs = require('fs')

document.addEventListener('DOMContentLoaded', (event) => {
    //the event occurred


    var text = fs.readFileSync('./data/words.txt')

    console.log(text[getRandomInt(text.length)])
})

function getRandomInt(max){
    return Math.floor(Math.random() * max)
}