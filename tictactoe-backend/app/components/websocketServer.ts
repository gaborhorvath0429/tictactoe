import * as http from 'http'
import * as websocket from 'websocket'

interface User {
  name: string
  connection: websocket.connection
}

/** Class representing the websocket server */
export default class WebSocketServer {
  // Connected users.
  public users: User[] = []

  constructor(httpServer: http.Server) {
    let ws = new websocket.server({ httpServer })

    // Handle requests.
    ws.on('request', request => {
      let connection = request.accept('tictactoe', request.origin)
      console.log(new Date() + ' Connection accepted.')

      connection.on('message', message => {
        if (message.type !== 'utf8') return
        let { utf8Data } = message
        console.log('Received Message: ' + utf8Data)

        this.handleMessage(connection, JSON.parse(utf8Data))
      })

      connection.on('close', () => this.removeUser(connection))
    })
  }

  /**
   * Handles messages based on message type.
   */
  private handleMessage(connection: websocket.connection, msg: any): void {
    switch (msg.type) {
      case 'enterLobby':
        this.addUser(connection, msg)
        break
      case 'leaveLobby':
        this.removeUser(connection)
        break
      default:
        break
    }
  }

  /**
   * Adds user to users list.
   */
  private addUser(connection: websocket.connection, msg: any): void {
    this.users.push({ name: msg.name, connection })
    this.emitUsers()

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
   * Removes user from users list.
   */
  private removeUser(connection: websocket.connection): void {
    console.log(
      new Date() + ' Peer ' + connection.remoteAddress + ' disconnected.'
    )
    this.users = this.users.filter(user => user.connection !== connection)
    this.emitUsers()
  }
}
