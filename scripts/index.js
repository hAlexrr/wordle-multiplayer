

document.addEventListener('DOMContentLoaded', (event) => {
    //the event occurred 
    getWord().then((resolve) => {
        const board = document.querySelector(".board")
        const allTiles = document.querySelectorAll('.tile')
        var row = 0
        var pos = 0
        var gameFinished = false
        var allWords = resolve[0]
        var gameWord = resolve[1]
        var prevCorrectLetters = 0
        var points = 0

        allTiles.forEach(elem => {
            elem.addEventListener("animationend", function (e){
                e.target.attributes[2].value = 'Idle'
                })
        })

        console.log(`Game Word -> ${gameWord}`)

        document.addEventListener('keydown', (e) => {
            var gameRow = board.children.item(row)
            var gameItems = gameRow.getElementsByClassName('row')[0].children
            if(e.key.match(/[a-z]/i) && e.key.length === 1){

                if( gameFinished )
                    return

                if( pos >= gameItems.length)
                    return

                pos += 1
                var gamePos = gameItems.item(pos-1)

                var tile = gamePos.getElementsByClassName('tile')

                tile[0].setAttribute('data-animation', 'PopIn')
                tile[0].setAttribute('data-state', 'tbd')
                tile[0].innerHTML = e.key
                gameRow.setAttribute('letters', gameRow.getAttribute('letters') + e.key )
            }
            else if ( e.key === 'Enter' ) {
                if( gameFinished )
                    return

                if ( pos !== gameItems.length )
                    return
                
                if ( row >= 6 ) 
                    return                

                var guessedWord = gameRow.getAttribute('letters')
                
                if( !arrayContains(allWords, guessedWord))
                    return;

                if (gameWord === guessedWord){
                    console.log('You got the correct answer');
                    gameFinished = true
                }
                
                var correctLetters = 0
                var keyboard = document.querySelectorAll('.keys')
                for( var i = 0; i < guessedWord.length; i++){
                    console.log(guessedWord[i])
                    var gamePos = gameItems.item(i)

                    var tile = gamePos.getElementsByClassName('tile')
                    if(gameWord[i] === guessedWord[i]){
                        correctLetters += 1
                        tile[0].setAttribute('data-animation', 'flip-out')
                        tile[0].setAttribute('data-state', 'correct')
                        keyboard.forEach(elem => {
                            if ( elem.getAttribute('data-key') === guessedWord[i] ){
                                elem.setAttribute('data-state', 'correct')
                                return
                            }                        
                        })
                    }
                    else if(gameWord.includes(guessedWord[i])){
                        tile[0].setAttribute('data-animation', 'flip-out')
                        tile[0].setAttribute('data-state', 'present')
                        keyboard.forEach(elem => {
                            if ( elem.getAttribute('data-key') === guessedWord[i] ){
                                elem.setAttribute('data-state', 'present')
                                return
                            }                        
                        })
                    }
                    else {
                        tile[0].setAttribute('data-animation', 'flip-out')
                        tile[0].setAttribute('data-state', 'absent')
                        keyboard.forEach(elem => {
                            if ( elem.getAttribute('data-key') === guessedWord[i] ){
                                elem.setAttribute('data-state', 'absent')
                                return
                            }                        
                        })
                    }
                }
                if(correctLetters != prevCorrectLetters){
                    points += Math.pow(2, correctLetters-prevCorrectLetters)
                    document.getElementById('Points').innerHTML = `Points: ${points}`
                    prevCorrectLetters = correctLetters
                }
                row += 1
                if(row >= 6){
                    gameFinished = true
                    console.log('Finished game')
                }
                pos = 0
            }
            else if ( e.key === 'Backspace'){
                if( gameFinished )
                    return

                if ( pos <= 0 )
                    return

                pos -= 1
                var gamePos = gameItems.item(pos)

                tile = gamePos.getElementsByClassName('tile')

                tile[0].innerHTML = ''
                tile[0].setAttribute('data-animation', 'PopIn')
                tile[0].setAttribute('data-state', 'empty')
                gameRow.setAttribute('letters', gameRow.getAttribute('letters').substring(0, pos) )
            }
        })
    })
      
})

async function getWord() {    
    return fetch('words.txt')
        .then(response => response.text())
        .then(ab => {
            var array = ab.split('\n')
            // do stuff with `ArrayBuffer` representation of file
            return Promise.resolve([array, array[getRandomInt(array.length)]])
        })
        .catch(() => console.error)
}

function arrayContains (words, word){
    return (words.indexOf(word) > -1)
}

function getRandomInt(max){
    return Math.floor(Math.random() * max)
}