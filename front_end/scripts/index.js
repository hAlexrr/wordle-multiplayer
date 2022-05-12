const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
const sock = io();


document.addEventListener('DOMContentLoaded', (event) => {

    //the event occurred 
    const board = document.querySelector(".board")
    const allTiles = document.querySelectorAll('.tile')
    const allButtons = document.querySelectorAll('button')
    var row = 0
    var pos = 0
    var gameFinished = false
    var prevCorrectLetters = 0
    var points = 0

    sock.emit('choose word')


    allButtons.forEach(elem => {
        elem.addEventListener('click', (e) => {
            document.dispatchEvent(new KeyboardEvent('keydown', {key: e.target.attributes[0].value}))
        })
    })

    allTiles.forEach(elem => {
        elem.addEventListener("animationend", function (e){
            e.target.attributes[2].value = 'Idle'
            })
    })

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

            sock.emit('isRealWord', guessedWord, function (realWord) {
                if (!realWord)
                    return


                var correctLetters = 0
                var keyboard = document.querySelectorAll('.keys')

                sock.emit('doesWordsMatch', guessedWord, function (match) {
                    if (match){
                        console.log('match')
                        gameFinished = true;
                    }

                    sock.emit('getMatchingLetters', guessedWord, function (letters) {
                        for( var i = 0; i < guessedWord.length; i++){
                            console.log(letters[i])
                            var gamePos = gameItems.item(i)
            
                            var tile = gamePos.getElementsByClassName('tile')
                            if(letters[i] == 'c'){
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
                            else if(letters[i] == 'p'){
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
                    })
                })
            })
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

function checkRoom(roomId) {
    let usernameTB = document.getElementById('username');
    console.log(`${usernameTB.value} has joined the room ${roomId}`)
}

function joinRoom(){
    let roomTB = document.getElementById('room')
    console.log(`Joining Room ... [${roomTB.value}]`)
    sock.emit('join room', roomTB.value, checkRoom)
}

function createRoom(){
    let usernameTB = document.getElementById('username');

    if ( usernameTB.value === '' ){
        console.log('Please Enter a username')
        return
    }

    let usernameLabel = document.getElementById('usernameLabel')
    let roomTB = document.getElementById('room')
    let roomLabel = document.getElementById('roomLabel')
    let createRoomButton = document.getElementById('createRoom')
    let joinRoombutton = document.getElementById('joinRoom')

    let roomId = generateRandomRoomID(Math.floor(Math.random() * (10 - 7) + 7))
    usernameTB.style.display = 'none';
    usernameLabel.innerHTML = `Username: ${usernameTB.value}`
    roomTB.value = roomId;
    roomLabel.innerHTML = `RoomID: ${roomId}`
    createRoomButton.disabled = true;
    joinRoombutton.click();
    console.log(roomId)
    
}

function generateRandomRoomID(len){
    let id = ''

    for(let x = 0; x < len; x++){
        id += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return id
}

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