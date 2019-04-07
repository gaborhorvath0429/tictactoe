import * as http from 'http'
import * as websocket from 'websocket'
import Game from '../helpers/game'

interface User {
  name: string
  connection: websocket.connection
}

interface Challenge {
  from: User
  to: User
}

interface Game {
  board: Array<string | number>
  X: User
  O: User
}

/** Class representing the websocket server */
export default class WebSocketServer {
  // Connected users.
  public users: User[] = []

  // Active challenges waiting to be accepted or rejected.
  public challenges: Challenge[] = []

  // Running games.
  public games: Game[] = []

  constructor(httpServer: http.Server) {
    let ws = new websocket.server({ httpServer })

    // Handle requests.
    ws.on('request', request => {
      try {
        let connection = request.accept('tictactoe', request.origin)
        console.log(new Date() + ' Connection accepted.')

        connection.on('message', message => {
          if (message.type !== 'utf8') return
          let { utf8Data } = message
          console.log('Received Message: ' + utf8Data)

          this.handleMessage(connection, JSON.parse(utf8Data))
        })

        connection.on('close', () => {
          // check if user had any running games
          let { game, opponent } = this.getGame(connection)
          if (opponent) this.leaveGame(game, opponent)
          this.removeUser(connection)
        })
      } catch (e) {
        console.log(e)
      }
    })
  }

  /**
   * Handles messages based on message type.
   */
  private handleMessage(connection: websocket.connection, msg: any): void {
    let from = msg.from ? this.users.find(user => user.name === msg.from) : null
    let to = msg.to ? this.users.find(user => user.name === msg.to) : null
    switch (msg.type) {
      case 'enterLobby':
        this.addUser(connection, msg.name)
        break
      case 'leaveLobby':
        this.removeUser(connection)
        break
      case 'challenge':
        this.challengeUser(from, to)
        break
      case 'cancelChallenge':
        this.cancelChallenge(from, to)
        break
      case 'declineChallenge':
        this.declineChallenge(from, to)
        break
      case 'acceptChallenge':
        this.acceptChallenge(from, to)
        break
      case 'leaveGame':
        this.users.push({ name: msg.name, connection })
        let { game, opponent } = this.getGame(connection)
        if (opponent) this.leaveGame(game, opponent)
        break
      case 'turn':
        this.makeTurn(connection, msg.player, msg.board)
        break
      default:
        break
    }
    this.emitUsers()
    this.emitGames()
  }

  /**
   * Makes a turn and emits the new board to the opponent.
   */
  private makeTurn(connection: websocket.connection, player: string, board: Array<string | number>) {
    let { game } = this.getGame(connection)
    game.board = board
    let winner = Game.checkWinner(board)
    let next = player === 'X' ? 'O' : 'X'
    let msg = JSON.stringify({
      type: 'turn',
      message: { board, next, winner }
    })
    game.O.connection.sendUTF(msg)
    game.X.connection.sendUTF(msg)
  }

  /**
   * Adds user to users list.
   */
  private addUser(connection: websocket.connection, name: string): void {
    this.users.push({ name, connection })

    // Emit online users to new user.
    connection.sendUTF(
      JSON.stringify({
        type: 'users',
        message: this.users
          .filter(user => user.connection !== connection)
          .map(user => user.name)
      })
    )
  }

  /**
   * Removes user from users list.
   */
  private removeUser(connection: websocket.connection): void {
    console.log(
      new Date() + ' Peer ' + connection.remoteAddress + ' disconnected.'
    )
    this.users = this.users.filter(user => user.connection !== connection)
  }

  /**
   * Challenges the given user.
   */
  public challengeUser(from: User, to: User): void {
    this.challenges.push({ from, to })
    to.connection.sendUTF(
      JSON.stringify({
        type: 'challenge',
        message: from.name
      })
    )
  }

  /**
   * Cancels challenge.
   */
  public cancelChallenge(from: User, to: User): void {
    this.challenges = this.challenges.filter(
      challenge => challenge !== { from, to }
    )
    to.connection.sendUTF(
      JSON.stringify({
        type: 'cancelChallenge',
        message: from.name
      })
    )
  }

  /**
   * Declines challenge.
   */
  public declineChallenge(from: User, to: User): void {
    this.challenges = this.challenges.filter(
      challenge => challenge !== { from, to }
    )
    to.connection.sendUTF(
      JSON.stringify({
        type: 'declineChallenge',
        message: from.name
      })
    )
  }

  /**
   * Accepts challenge.
   */
  public acceptChallenge(from: User, to: User): void {
    this.challenges = this.challenges.filter(
      challenge =>
        [from, to].indexOf(challenge.from) === -1 &&
        [from, to].indexOf(challenge.to) === -1
    )
    this.users = this.users.filter(user => [from, to].indexOf(user) === -1)
    this.games.push({ X: from, O: to, board: Array.from(Array(9).keys()) })
    to.connection.sendUTF(
      JSON.stringify({
        type: 'acceptChallenge',
        message: from.name
      })
    )
  }

  /**
   * Get running game of a user.
   */
  public getGame(
    connection: websocket.connection
  ): { game: Game; opponent: User } {
    let opponent: User = null
    let game: Game = null
    for (let item of this.games) {
      if (item.O.connection === connection) {
        opponent = item.X
        game = item
        break
      }
      if (item.X.connection === connection) {
        opponent = item.O
        game = item
        break
      }
    }
    return { game, opponent }
  }

  /**
   * User leaves game.
   */
  public leaveGame(game: Game, opponent: User): void {
    opponent.connection.sendUTF(
      JSON.stringify({
        type: 'leaveGame'
      })
    )
    this.games = this.games.filter(item => item !== game)
  }

  /**
   * Emits user list to everyone.
   */
  private emitUsers(): void {
    for (let client of this.users) {
      client.connection.sendUTF(
        JSON.stringify({
          type: 'users',
          message: this.users
            .filter(user => user.connection !== client.connection)
            .map(user => user.name)
        })
      )
    }
  }

  /**
   * Emits game list to everyone.
   */
  private emitGames(): void {
    for (let client of this.users) {
      client.connection.sendUTF(
        JSON.stringify({
          type: 'games',
          message: this.games.map(game => ({ O: game.O.name, X: game.X.name }))
        })
      )
    }
  }
}
