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
        pos: 0
    }
    boards[sock.id] = {
        row1: '',
        row2: '',
        row3: '',
        row4: '',
        row5: '',
        row6: ''
    }
    console.log(sock.id)

    sock.on('disconnectRoom', (room) => {
        leaveRoom(sock)
        console.log('Successfully disconnected from room ')
    })

    sock.on('disconnect', () => {
        console.log(`Client Leaving -> ${sock.id}`)
        delete users[sock.id]
        leaveRoom(sock)
        console.log('ROOMS LEFT \n')
        console.log(rooms)
    })

    sock.on('join room', (roomID, cb) => {
            sock.join(roomID)
            sendToOtherUser(roomID, sock, 'updatePlayerList')
            users[sock.id].roomId = roomID
            console.log( roomID in rooms )
            if ( !(roomID in rooms) ){ 
                rooms[roomID] = { [sock.id]: 'User'}
            } else {
                rooms[roomID][sock.id] = 'user'
            }
            // console.log('Room Joined\n')
            // console.log(rooms)
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

    sock.on('updatePlayerData', (row, pos, points, cb) => {
        users[sock.id].row = row
        users[sock.id].pos = pos
        users[sock.id].points = points
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
                cb(users[key])
            }
    })

    sock.on('saveBoardData', (guessWord) => {
        //This will save the board on the last row
        for ( var row in boards[sock.id] )
        {
            if( boards[sock.id][row] === ''){
                boards[sock.id][row] = guessWord
                break
            }
        }
    })
})

server.on('error', (error) => {
    console.error(error)
})

server.listen(25352, () => {
    console.log('Server listening on port 25352')
})

function sendToOtherUser(roomID, sock, event) {
    for ( var key in rooms[roomID] )
        if ( key !== sock.id) {
            console.log(`Sending to user ${key}`)
            io.to(key).emit(event)
        }
}

function leaveRoom(sock){
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

function generateRandomRoomID(len){
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let id = ''

    for(let x = 0; x < len; x++){
        id += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return id
}

function getRandomInt(max){
    return Math.floor(Math.random() * max)
}

function arrayContains (words, word){
    return (words.indexOf(word) > -1)
}
