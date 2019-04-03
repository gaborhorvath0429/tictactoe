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
        this.users.push({ name: msg.name, connection })
        connection.sendUTF(
          JSON.stringify({
            type: 'users',
            message: this.users.map(user => user.name)
          })
        )
        break
      case 'leaveLobby':
        this.removeUser(connection)
        break
      default:
        break
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
  }
}
