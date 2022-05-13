const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
const sock = io();

var textBoxFocus = false
var points = 0
var row = 0
var pos = 0



document.addEventListener('DOMContentLoaded', (event) => {

    //the event occurred 
    const board = document.querySelector("#player1-board")
    const p2Board = document.querySelector("#player2-board")
    const allTiles = document.querySelectorAll('.tile')
    const allButtons = document.querySelectorAll('button')
    
    var gameFinished = false
    var prevCorrectLetters = 0

    p2Board.style.display = 'none'
    createRoomOnJoin()
    updatePlayerData(row, pos, points)
    sock.emit('choose word')

    sock.on('updatePlayerList', updatePlayerList)


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

        if (textBoxFocus)
            return

        if(e.key.match(/[a-z]/i) && e.key.length === 1){

            if( gameFinished )
                return

            if( pos >= gameItems.length)
                return

            pos += 1
            var gamePos = gameItems.item(pos-1)

            var tile = gamePos.getElementsByClassName('tile')

            setTile(tile, 'tbd', e.key, gameRow);
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
                            setPoints()
                            prevCorrectLetters = correctLetters
                        }
                        row += 1
                        if(row >= 6){
                            gameFinished = true
                            console.log('Finished game')
                        }
                        pos = 0
                        updatePlayerData(row, pos, points)
                        sendBoardData(guessedWord)
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
        updatePlayerData(row, pos, points)
    })
    
      
})

function setPoints(){
    document.getElementById('Points').innerHTML = `Points: ${points}`
}

function setTile(tile, state, value, gameRow, reset=false) {
    tile[0].setAttribute('data-animation', 'PopIn');
    tile[0].setAttribute('data-state', state);
    tile[0].innerHTML = value;
    if( !reset ){
        gameRow.setAttribute('letters', gameRow.getAttribute('letters') + value);
        return
    }
    gameRow.setAttribute('letters', '');
}

function sendBoardData(guessedWord){
    sock.emit('saveBoardData', guessedWord)
}

function onTextboxFocus() {
    textBoxFocus = true
}

function onTextboxUnFocus() {
    textBoxFocus = false
}

function updatePlayerData(row, pos, points){
    sock.emit('updatePlayerData', row, pos, points, function() {
        updatePlayerList()
    })
}
function updatePlayerList(){
    console.log("Updating player List")
    let roomTB = document.getElementById('room')
    const p2Board = document.querySelector("#player2-board")

    let player1Username = document.getElementById('player1-username')
    let player1Points = document.getElementById('player1-points')

    let player2Div = document.getElementById('player2')
    let player2Username = document.getElementById('player2-username')
    let player2Points = document.getElementById('player2-points')

    sock.emit('getMyData', function(user) {
        player1Username.innerHTML = user.username === '' || user.username === undefined ? "Player1" : user.username
        player1Points.innerHTML = `Points: ${user.points}`
    })

    sock.emit('getPlayer2Data', roomTB.value, function(user) {
        console.log(user)
        if( user === null || user === undefined) {
            if(player2Div.style.display !== 'none' && p2Board.style.display !== 'none'){
                player2Div.style.display = 'none'
                p2Board.style.display = 'none'
            }
            return
        } else if ( user !== null || user !== undefined && player2Div.style.display === 'none' && p2Board.style.display === 'none') {
            player2Div.style.display = 'block'
            p2Board.style.display = 'grid'
        }
        player2Username.innerHTML =  user.username === ''  ? "" : user.username
        player2Points.innerHTML =  user.username === ''  ? '' : `Points: ${user.points}`
    })
}

function checkRoom(roomId, roomFull=false) {
    let roomTB = document.getElementById('room')

    if ( roomFull ){
        roomTB.value += ' [Room Full]';
        console.log('The room you are trying to join is currently full.')
        return
    }
    
    let roomLabel = document.getElementById('roomLabel')
    let usernameTB = document.getElementById('username');

    roomTB.value = roomId;
    roomLabel.innerHTML = `RoomID: ${roomId}`
    console.log(`${usernameTB.value} has joined the room ${roomId}`)
    resetKeyboard()
    resetPlayerBoard()
}

function updateUsername(){
    let usernameTB = document.getElementById('username')
    let usernameLabel = document.getElementById('usernameLabel')

    usernameLabel.innerHTML = "Username: " + usernameTB.value
    sock.emit('updateUsername', usernameTB.value)
}

function joinRoom(){
    let usernameTB = document.getElementById('username')
    let usernameLabel = document.getElementById('usernameLabel')
    let roomTB = document.getElementById('room')
    let roomLabel = document.getElementById('roomLabel')
    
    if( usernameTB.value === '' ||  roomTB.value === roomLabel.innerHTML.split(':')[1].replace(' ', ''))
        return

    if( usernameTB.value !== usernameLabel.innerHTML.split(':')[1].replace(' ', ''))
        updateUsername()

    row = 0
    pos = 0
    points = 0
    setPoints()
    updatePlayerData(row, pos, points)
    sock.emit('disconnectRoom', roomTB.value)
    console.log(`Joining Room ... [${roomTB.value}]`)
    sock.emit('join room', roomTB.value, checkRoom)
}

function createRoomOnJoin(){
    let roomId = generateRandomRoomID(Math.floor(Math.random() * (10 - 7) + 7))

    sock.emit('join room', roomId, checkRoom)    
    updateUsername()
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

function resetPlayerBoard(player=1){
    const board = player == 1 ? document.querySelector("#player1-board") : document.querySelector("#player2-board")

    for( var row = 0; row < 6; row++ ){
        var gameRow = board.children.item(row)
        var gameItems = gameRow.getElementsByClassName('row')[0].children
        for( var col = 0; col < 5; col++ ){
            var gamePos = gameItems.item(col)
            var tile = gamePos.getElementsByClassName('tile')

            setTile(tile, 'empty', '', gameRow, true)
        }
    }
}

function resetKeyboard(){
    var keyboard = document.querySelectorAll('.keys')

    keyboard.forEach(elem => {
        elem.removeAttribute('data-state')
    })
}