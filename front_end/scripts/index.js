const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
const sock = io();

var textBoxFocus = false
var enterClicked = false
var points = 0
var row = 0
var pos = 0
var prevCorrectLetters = 0
var gameFinished = false



document.addEventListener('DOMContentLoaded', (event) => {

    //the event occurred 
    const board = document.querySelector("#player1-board")
    const p2Board = document.querySelector("#player2-board")
    const allTiles = document.querySelectorAll('.tile')
    const allButtons = document.querySelectorAll('button')
    const newWord = document.querySelector('newWord')

    p2Board.style.display = 'none'
    createRoomOnJoin()
    updatePlayerData()
    // sock.emit('choose word')

    sock.on('updatePlayerList', updatePlayerList)
    sock.on('resetPlayerBoard', resetPlayerBoard)
    sock.on('resetPlayerKeyboard', resetKeyboard)
    sock.on('resetPlayerStats', resetPlayerStats)
    sock.on('showGameBoardsToAll', showOpponentBoard)
    sock.on('sendNotiToRoom', sendNoti)


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

        if( gameFinished ) {
            return
        }

        var gameRow = board.children.item(row)
        var gameItems = gameRow.getElementsByClassName('row')[0].children

        if (textBoxFocus)
            return
        

        if(e.key.match(/[a-z]/i) && e.key.length === 1){

            if( pos >= gameItems.length)
                return

            pos += 1
            var gamePos = gameItems.item(pos-1)

            var tile = gamePos.getElementsByClassName('tile')

            setTile(tile, 'tbd', e.key, gameRow);
        }
        else if ( e.key === 'Enter' ) {
            e.preventDefault();
            if ( pos !== gameItems.length )
                return
            
            if ( row >= 6 ) 
                return                
            
            var guessedWord = gameRow.getAttribute('letters')

            sock.emit('isRealWord', guessedWord, function (realWord) {
                if (!realWord)
                    return

                var keyboard = document.querySelectorAll('.keys')

                sock.emit('doesWordsMatch', guessedWord, function (match) {
                    if (match){
                        // console.log('match')
                        toggleGameFinishedStatus()
                        sock.emit('send noti to room', `${[getUsername()]} has completed their turn<br />Word: {word}`, 'info')
                    }

                    sock.emit('getMatchingLetters', guessedWord, function (letters) {
                        var correctLetters = drawGameBoard(guessedWord, gameItems, letters, keyboard);
                        if(correctLetters != prevCorrectLetters){
                            points += Math.pow(2, correctLetters-prevCorrectLetters)*(((6-row)/6)/100)
                            setPoints()
                            prevCorrectLetters = correctLetters
                        }
                        row += 1
                        if(row >= 6 && !gameFinished){
                            toggleGameFinishedStatus()
                            sock.emit('send noti to room', `${[getUsername()]} has completed their turn<br />Word: {word}`, 'info')
                            // console.log('Finished game')
                        }
                        pos = 0
                        updatePlayerData()
                        sendBoardData(guessedWord, letters)
                    })
                    sock.emit('checkGameStatus', function (bothFinished, board=null) {
                        console.log(board)
                        console.log(bothFinished)
                        if(!bothFinished || board === null)
                            return

                        sock.emit('showGameBoardsToAll')
                        showOpponentBoard(board)
                    })
                })
            })
        }
        else if ( e.key === 'Backspace'){
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
        updatePlayerData()
    })
    
})

function resetGames() {
    let player2Div = document.getElementById('player2')

    if ( player2Div.style.display === 'none' ){
        fullResetPlayer()
        updatePlayerData()
        sock.emit('choose word')
        sendNoti(`Game progress reset`, 'pass')
    } else {

    }
}

function newWord() {
    console.log(enterClicked)
    if (enterClicked){
        return
    }

    
    let player2Div = document.getElementById('player2')

    if ( player2Div.style.display === 'none' ){
        resetKeyboard()
        resetPlayerBoard()
        resetPlayerBoardData()
        row = 0
        pos = 0
        prevCorrectLetters = 0
        gameFinished = false
        updatePlayerData()
        sock.emit('choose word')
        return
    } else {

    }
}

function sendNoti(message, status, showTime=4000){
    var noti = document.getElementsByClassName('notification')

    console.log('Sending a noti')

    noti[0].innerHTML = message
    noti[0].className = 'notification noti--'+status

    setTimeout(() => {
        noti[0].className = 'notification'
    }, showTime)
}

function drawGameBoard(guessedWord, gameItems, letters, keyboard, changeKeyboard = true, opBoard=false) {
    var correctLetters = 0
    for (var i = 0; i < guessedWord.length; i++) {
        var gamePos = gameItems.item(i);

        var tile = gamePos.getElementsByClassName('tile');
        if(opBoard)
            setTile(tile, 'tbd', guessedWord[i], null)
        if (letters[i] == 'c') {
            correctLetters += 1;
            tile[0].setAttribute('data-animation', 'flip-out');
            tile[0].setAttribute('data-state', 'correct');
            if ( changeKeyboard )
                keyboard.forEach(elem => {
                    if (elem.getAttribute('data-key') === guessedWord[i]) {
                        elem.setAttribute('data-state', 'correct');
                        return;
                    }
            });
        }
        else if (letters[i] == 'p') {
            tile[0].setAttribute('data-animation', 'flip-out');
            tile[0].setAttribute('data-state', 'present');
            if ( changeKeyboard )
                keyboard.forEach(elem => {
                    if (elem.getAttribute('data-key') === guessedWord[i]) {
                        elem.setAttribute('data-state', 'present');
                        return;
                    }
            });
        }
        else {
            tile[0].setAttribute('data-animation', 'flip-out');
            tile[0].setAttribute('data-state', 'absent');
            if ( changeKeyboard )
                keyboard.forEach(elem => {
                    if (elem.getAttribute('data-key') === guessedWord[i]) {
                        elem.setAttribute('data-state', 'absent');
                        return;
                    }
            });
        }
    }
    return correctLetters;
}

function setPoints(){
    document.getElementById('Points').innerHTML = `Points: ${points}`
}

function setTile(tile, state, value, gameRow, reset=false) {
    tile[0].setAttribute('data-animation', 'PopIn');
    tile[0].setAttribute('data-state', state);
    tile[0].innerHTML = value;
    if(gameRow !== null) {
        if( !reset ){
            gameRow.setAttribute('letters', gameRow.getAttribute('letters') + value);
            return
        }
        gameRow.setAttribute('letters', '');
    }
}

function sendBoardData(guessedWord, letters){
    sock.emit('saveBoardData', guessedWord, letters)
}

function resetPlayerBoardData(){
    sock.emit('resetBoardData')
}

function onTextboxFocus() {
    textBoxFocus = true
}

function onTextboxUnFocus() {
    textBoxFocus = false
}

function updatePlayerData(){
    sock.emit('updatePlayerData', row, pos, points, gameFinished, function() {
        updatePlayerList()
    })
}

function updatePlayerList(){
    // console.log("Updating player List")
    let roomLabel = document.getElementById('roomLabel')
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


    sock.emit('getPlayer2Data', roomLabel.innerHTML.split(':')[1].replace(' ', ''), function(user) {
        // console.log(user)
        if( user === null || user === undefined ) {
            if(player2Div.style.display !== 'none' && p2Board.style.display !== 'none' ){
                player2Div.style.display = 'none'
                p2Board.style.display = 'none'
            }
            return
        } else if ( user !== null || user !== undefined && player2Div.style.display === 'none' && p2Board.style.display === 'none' ) {
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
        sendNoti(`$[{roomId}] is currently full.`)
        return
    }
    
    let roomLabel = document.getElementById('roomLabel')
    // let usernameTB = document.getElementById('username');

    roomTB.value = roomId;
    roomLabel.innerHTML = `RoomID: ${roomId}`
    sock.emit('send noti to room', `[${username}] has joined room [${roomTB.value}]`, 'pass')
    // console.log(`${usernameTB.value} has joined the room ${roomId}`)
    resetKeyboard()
    resetPlayerBoard()
    resetPlayerBoardData()
}

function getUsername(){
    let usernameLabel = document.getElementById('usernameLabel')
    return usernameLabel.innerHTML.split(':')[1].replace(' ', '')
}

function updateUsername(noti = true){
    let usernameTB = document.getElementById('username')
    let usernameLabel = document.getElementById('usernameLabel')

    if ( usernameTB.value === usernameLabel.innerHTML.split(':')[1].replace(' ', '') && noti){
        return
    }

    if ( usernameTB.value === '' ){
        sendNoti(`You are unable to leave a blank username`, 'fail')
        return
    }

    usernameLabel.innerHTML = "Username: " + usernameTB.value
    sock.emit('updateUsername', usernameTB.value)
    if( noti )
        sendNoti(`Username updated to [${usernameTB.value}]`, 'pass')
}

function joinRoom(){
    let usernameTB = document.getElementById('username')
    let usernameLabel = document.getElementById('usernameLabel')
    let roomTB = document.getElementById('room')
    let roomLabel = document.getElementById('roomLabel')

    var roomId = roomLabel.innerHTML.split(':')[1].replace(' ', '')
    
    if( usernameTB.value === '' ||  roomTB.value === roomId)
        return

    var username = usernameLabel.innerHTML.split(':')[1].replace(' ', '')
    if( usernameTB.value !== username)
        updateUsername(false)

    resetPlayerStats()
    updatePlayerData()
    sock.emit('send noti to room', `[${username}] has disconnected from room [${roomId}]]`, 'fail')
    sock.emit('disconnectRoom', roomTB.value)
    //console.log(`Joining Room ... [${roomTB.value}]`)
    sock.emit('join room', roomTB.value, checkRoom)
}

function createRoomOnJoin(){
    let roomId = generateRandomRoomID(Math.floor(Math.random() * (10 - 7) + 7))

    sock.emit('join room', roomId, checkRoom)    
    updateUsername(false)
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

function toggleGameFinishedStatus() {
    gameFinished = !gameFinished
    updatePlayerData()
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

function resetPlayerStats(){
    row = 0
    pos = 0
    points = 0
    prevCorrectLetters = 0
    gameFinished = false
    setPoints()
    updatePlayerData()
}

function resetKeyboard(){
    var keyboard = document.querySelectorAll('.keys')

    keyboard.forEach(elem => {
        elem.removeAttribute('data-state')
    })
}

function fullResetPlayer(){
    resetPlayerBoard()
    resetPlayerBoardData()
    resetPlayerStats()
    resetKeyboard()
}

function showOpponentBoard(boardData) {
    const board = document.querySelector("#player2-board")
    console.log(boardData)
    for( var row = 0; row < 6; row++ ){
        var guessedWord = boardData[row]
        var gameRow = board.children.item(row)
        var gameItems = gameRow.getElementsByClassName('row')[0].children
        var letters = boardData.letter[row]

        drawGameBoard( guessedWord, gameItems, JSON.parse(letters), undefined, false, true)
    }
}