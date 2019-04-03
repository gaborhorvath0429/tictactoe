import * as http from 'http'
import WebSocketServer from './components/websocket'

function collectRequestData(
  request: http.IncomingMessage,
  callback: Function
): void {
  let body: string = ''
  request.on('data', chunk => {
    body += chunk.toString()
  })
  request.on('end', () => {
    callback(JSON.parse(body))
  })
}

/** Class representing the server */
class Server {
  private httpServer: http.Server
  private webSocketServer: WebSocketServer

  /**
   * Create server components.
   */
  constructor() {
    this.httpServer = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Request-Method', '*')
      res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET')
      res.setHeader('Access-Control-Allow-Headers', '*')
      if (req.method === 'OPTIONS') {
        res.writeHead(200)
        res.end()
        return
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      let { url, method } = req
      if (url === '/login' && method === 'POST') {
        collectRequestData(req, (result: any) => {
          let users = this.webSocketServer.users.map(user => user.name)
          let success = users.indexOf(result.name) === -1 ? true : false
          res.end(JSON.stringify({ success }))
        })
      }
    })
    this.initWebSocketServer()
  }

  /**
   * Inits websocket server.
   */
  private initWebSocketServer(): void {
    this.webSocketServer = new WebSocketServer(this.httpServer)
  }

  /**
   * Starts the http server.
   * @param {Number} port
   */
  public listen(port: Number): void {
    this.httpServer.listen(port, () => {
      console.log('server started at port ' + port)
    })
  }
}

new Server().listen(3000)
