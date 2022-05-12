const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const app = express()

app.use(express.static(`${__dirname}/front_end/`))

const server = http.createServer(app)
const io = socketio(server)

io.on('connection', (sock) => {
    console.log(sock.id)

    sock.on('join room', (roomID, cb) => {
            console.log(roomID)
            console.log(cb)
            sock.join(roomID)
            cb(roomID)
    })

})

server.on('error', (error) => {
    console.error(error)
})

server.listen(25352, () => {
    console.log('Server listening on port 25352')
})