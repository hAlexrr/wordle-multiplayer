const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const fs = require('fs');

const wordsPath = './words.txt'
const app = express()

app.use(express.static(`${__dirname}/front_end/`))

const server = http.createServer(app)
const io = socketio(server)

const allWords = cleanAllWordsArray(fs.readFileSync(__dirname+'/words.txt', 'utf-8').split('\n'))

let users = {}
let boards = {}
let rooms = {}

io.on('connection', (sock) => {

    users[sock.id] = {
        username: '',
        roomId: '',
        points: 0,
        word: '',
        row: 0,
        pos: 0,
        gameFinished: false
    }

    boards[sock.id] = {
        0: '',
        1: '',
        2: '',
        3: '',
        4: '',
        5: '',
        letter: {
            0: '',
            1: '',
            2: '',
            3: '',
            4: '',
            5: ''
        }
    }
    console.log(sock.id)

    sock.on('disconnectRoom', (room) => {
        leaveRoom(sock, room)
        console.log(rooms)
        console.log('Successfully disconnected from room ')
    })

    sock.on('disconnect', () => {
        console.log(`Client Leaving -> ${sock.id}`)
        sendToOtherUser(users[sock.id].roomId, sock, 'resetPlayerStats')
        sendToOtherUser(users[sock.id].roomId, sock, 'resetPlayerBoard')
        sendToOtherUser(users[sock.id].roomId, sock, 'resetPlayerKeyboard')
        leaveRoom(sock)
        delete users[sock.id]
        console.log('ROOMS LEFT \n')
        console.log(rooms)
    })

    sock.on('join room', (roomID, cb) => {

        if( ( rooms[roomID] !== null && rooms[roomID] !== undefined) && Object.keys(rooms[roomID]).length >= 2){
            cb(roomID, true)
            return
        }   

        sock.join(roomID)
        users[sock.id].roomId = roomID
        if ( !(roomID in rooms) ){ 
            rooms[roomID] = { [sock.id]: 'User'}
        } else {
            rooms[roomID][sock.id] = 'user'
        }
        var word = allWords[getRandomInt(allWords.length)]  

        console.log('Room Joined\n')
        console.log(rooms)
        changeWordForRoom(word, roomID)
        sendRestToPlayer(roomID, sock);
        cb(roomID)
    })

    sock.on('choose word', () => {
        var word = allWords[getRandomInt(allWords.length)]  
        console.log(word)
        users[sock.id].word = word.replace('\r', '')
    })

    sock.on('isRealWord', (guessedWord, callback) => {
        if( arrayContains(allWords, guessedWord) )
            callback(true)
        callback(false)
    })

    sock.on('doesWordsMatch', (guessedWord, callback) => {
        if(guessedWord == users[sock.id].word)
            callback(true)
        callback(false)
    })

    sock.on('getMatchingLetters', (guessedWord, callback) => {
        var correctLetters = {}
        var gameWord = users[sock.id].word
        for( var i = 0; i < guessedWord.length; i++){
            if(gameWord[i] === guessedWord[i]){
                correctLetters[i] = 'c'
            }
            else if(gameWord.includes(guessedWord[i])){
                correctLetters[i] = 'p'
            }
            else {
                correctLetters[i] = 'i'
            }
        }
        callback(correctLetters)
    })

    sock.on('updatePlayerData', (row, pos, points, gameFinished, cb) => {
        // console.log(row, pos, points, gameFinished, cb)
        users[sock.id].row = row
        users[sock.id].pos = pos
        users[sock.id].points = points
        users[sock.id].gameFinished = gameFinished
        sendToOtherUser(users[sock.id].roomId, sock, 'updatePlayerList')
        cb()
    })

    sock.on('updateUsername', (username) => {
        users[sock.id].username = username
    })

    sock.on('getMyData', (cb)=>{
        cb(users[sock.id])
    })

    sock.on('getPlayer2Data', (RoomID, cb)=>{
        for ( var key in rooms[RoomID] )
            if ( key !== sock.id){
                cb( users[key] )
            }
            cb( undefined )
    })

    sock.on('saveBoardData', (guessWord, letters) => {
        //This will save the board on the last row
        for ( var row in boards[sock.id] )
        {
            if( boards[sock.id][row] === '' && typeof boards[sock.id][row] !== 'object' ){
                boards[sock.id][row] = guessWord
                break
            }
        }

        for ( var row in boards[sock.id].letter )
        {
            if( boards[sock.id].letter[row] === '' && typeof boards[sock.id][row] !== 'object' ){
                boards[sock.id].letter[row] = JSON.stringify(letters) 
                break
            }
        }

        
        console.log(boards[sock.id])
    })

    sock.on('resetBoardData', () => {
        //This will reset the board data
        boards[sock.id] = {
            0: '',
            1: '',
            2: '',
            3: '',
            4: '',
            5: '',
            letter: {
                0: '',
                1: '',
                2: '',
                3: '',
                4: '',
                5: ''
            }
        }
    })

    sock.on('checkGameStatus', (cb) => {
        var opID = getOpponentSockId(users[sock.id].roomId, sock.id)
        if(opID === null)
            return

        if (users[sock.id].gameFinished && users[opID].gameFinished)
            cb(true, boards[opID])

        cb(false)
    })

    sock.on('showGameBoardsToAll', () => {
        sendToOtherUser(users[sock.id].roomId, sock, 'showGameBoardsToAll', boards[sock.id])
    })
    
})

server.on('error', (error) => {
    console.error(error)
})

server.listen(25352, () => {
    console.log('Server listening on port 25352')
})

function sendRestToPlayer(roomID, sock) {
    sendToOtherUser(roomID, sock, 'resetPlayerStats');
    sendToOtherUser(roomID, sock, 'resetPlayerBoard');
    sendToOtherUser(roomID, sock, 'resetBoardData');
    sendToOtherUser(roomID, sock, 'resetPlayerKeyboard');
    sendToOtherUser(roomID, sock, 'updatePlayerList');
}

function changeWordForRoom(word, roomID){
    for ( var user in rooms[roomID] ){
        users[user].word = word
    }
    console.log('Changed room word')
    console.log(word)
}

function getOpponentSockId(roomID, sockID){
    for ( var key in rooms[roomID] ){
        if ( key !== sockID) {
            return key
        }
    }
    return null
}

function sendToOtherUser(roomID, sock, event, data=null) {
    var key = getOpponentSockId(roomID, sock.id)
    if ( key !== null){
        if( data !== null ){
            io.to(key).emit(event, data)
            return
        }
        io.to(key).emit(event)
    }
}

function leaveRoom(sock, room=''){
    if ( users[sock.id] !== undefined ){
        sendToOtherUser(users[sock.id].roomId, sock, 'updatePlayerList')
        sendRestToPlayer(users[sock.id].roomId, sock)
        users[sock.id].roomId = room !== '' ? room : ''
    }

    for ( var key in rooms ){
        delete rooms[key][sock.id]
        if ( Object.keys(rooms[key]).length == 0 )
         delete rooms[key]
    }
}

function cleanAllWordsArray(words) {
    let cleanArray = words
    for(var i = 0; i < cleanArray.length; i++)
        cleanArray[i] = cleanArray[i].replace(/(\r\n|\n|\r)/gm,"")
    return cleanArray
}

function getRandomInt(max){
    return Math.floor(Math.random() * max)
}

function arrayContains (words, word){
    return (words.indexOf(word) > -1)
}
