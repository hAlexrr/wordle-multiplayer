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

io.on('connection', (sock) => {
    users[sock.id] = {
        username: '',
        roomId: generateRandomRoomID(Math.floor(Math.random() * (10-5)+5)),
        points: 0,
        word: '',
        row: 0,
        pos: 0
    }
    console.log(sock.id)

    sock.on('disconnect', () => {
        console.log(`Client Leaving -> ${sock.id}`)
        delete users[sock.id]
    })

    sock.on('join room', (roomID, cb) => {
            console.log(roomID)
            console.log(cb)
            sock.join(roomID)
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
})

server.on('error', (error) => {
    console.error(error)
})

server.listen(25352, () => {
    console.log('Server listening on port 25352')
})

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
