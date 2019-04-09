import { expect } from 'chai'
import Server from '../app/server'
import * as websocket from 'websocket'

describe('Websocket', () => {
  let server: Server
  let client1: websocket.client
  let client2: websocket.client
  let client3: websocket.client
  let conn1: websocket.connection
  let conn2: websocket.connection
  let conn3: websocket.connection
  let url: string = 'ws://localhost:3001'
  let protocol: string = 'tictactoe'

  before(done => {
    server = new Server()
    server.listen(3001, () => {
      client1 = new websocket.client()
      client2 = new websocket.client()
      client3 = new websocket.client()
      done()
    })
  })

  it('should be able to enter lobby as player 1', done => {
    client1.on('connect', conn => {
      conn1 = conn
      conn.once('message', message => {
        message = JSON.parse(message.utf8Data)
        expect(message.type).to.equal('users')
        expect(message.message).to.be.an('array')
        expect(message.message).to.be.empty
        done()
      })
      conn.sendUTF(JSON.stringify({ type: 'enterLobby', name: 'Player 1' }))
    })
    client1.connect(url, protocol)
  })

  it('should be able to enter lobby as player 2', done => {
    client2.on('connect', conn => {
      conn2 = conn
      conn.once('message', message => {
        message = JSON.parse(message.utf8Data)
        expect(message.type).to.equal('users')
        expect(message.message).to.be.an('array')
        expect(message.message).to.have.lengthOf(1)
        done()
      })
      conn.sendUTF(JSON.stringify({ type: 'enterLobby', name: 'Player 2' }))
    })
    client2.connect(url, protocol)
  })

  it('should be able to enter lobby as player 3', done => {
    client3.on('connect', conn => {
      conn3 = conn
      conn.once('message', message => {
        message = JSON.parse(message.utf8Data)
        expect(message.type).to.equal('users')
        expect(message.message).to.be.an('array')
        expect(message.message).to.have.lengthOf(2)
        done()
      })
      conn.sendUTF(JSON.stringify({ type: 'enterLobby', name: 'Player 3' }))
    })
    client3.connect(url, protocol)
  })

  it('should be able to challenge Player 2 as Player 1', done => {
    conn2.once('message', message => {
      message = JSON.parse(message.utf8Data)
      expect(message.type).to.equal('challenge')
      expect(message.message).to.equal('Player 1')
      done()
    })
    conn1.sendUTF(
      JSON.stringify({ type: 'challenge', from: 'Player 1', to: 'Player 2' })
    )
  })

  it('should be able to accept challenge as Player 2', done => {
    conn1.once('message', message => {
      message = JSON.parse(message.utf8Data)
      expect(message.type).to.equal('acceptChallenge')
      expect(message.message).to.equal('Player 2')
      done()
    })
    conn2.sendUTF(
      JSON.stringify({ type: 'acceptChallenge', from: 'Player 2', to: 'Player 1' })
    )
  })
  
  it('should be able to spectate game of Player 1 and 2 as Player 3', done => {
    conn3.once('message', message => {
      message = JSON.parse(message.utf8Data)
      expect(message.type).to.equal('spectate')
      expect(message.message).to.deep.equal(Array.from(Array(9).keys())) // initial board
      done()
    })
    conn3.sendUTF(
      JSON.stringify({ type: 'spectate', O: 'Player 1', X: 'Player 2' })
    )
  })

  it('should recieve the play of Player 1 as Player 2', done => {
    let board = ['O', 1, 2, 3, 4, 5, 6, 7, 8]
    conn2.once('message', message => {
      message = JSON.parse(message.utf8Data)
      expect(message.type).to.equal('turn')
      expect(message.message.next).to.equal('X') // we are next
      expect(message.message.board).to.deep.equal(board) // other player made its turn
      expect(message.message.winner).to.be.null // no winner yet
      done()
    })
    conn1.sendUTF(
      JSON.stringify({ type: 'turn', player: 'O', board })
    )
  })


  it('should be able to quit spectating', done => {
    conn3.once('message', message => {
      message = JSON.parse(message.utf8Data)
      expect(message.type).to.equal('users') // we find ourselves in lobby
      expect(message.message).to.be.empty // no available users to play with
      done()
    })
    conn3.sendUTF(
      JSON.stringify({ type: 'leaveGame', name: 'Player 3' })
    )
  })

  it('should be able to play game against the AI as Player 3', done => {
    conn3.on('message', message => {
      let msg = JSON.parse(message.utf8Data)
      if (msg.type === 'turn') {
        expect(msg.message.next).to.equal('O') // we are next
        expect(msg.message.board).to.deep.include('X') // AI made its turn
        expect(msg.message.winner).to.be.null // no winner yet
        done()  
      }
    })
    // start game
    conn3.sendUTF(
      JSON.stringify({ type: 'startAI' })
    )
    // make a play
    conn3.sendUTF(
      JSON.stringify({ type: 'AITurn', board: ['O', 1, 2, 3, 4, 5, 6, 7, 8]})
    )
  })
})
