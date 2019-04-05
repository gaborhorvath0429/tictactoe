import * as http from 'http'
import WebSocketServer from './components/websocketServer'
import HttpServer from './components/httpServer';

/** Class representing the server */
class Server {
  private webSocketServer: WebSocketServer
  private httpServer: HttpServer

  /**
   * Create and start server components.
   */
  constructor(port: number) {
    this.initHttpServer()
    this.initWebSocketServer()
    this.httpServer.listen(port)
  }

  /**
   * Inits http server.
   */
  private initHttpServer(): void {
    this.httpServer = new HttpServer(this.httpRouter)
  }

  /**
   * Inits websocket server.
   */
  private initWebSocketServer(): void {
    this.webSocketServer = new WebSocketServer(this.httpServer.server)
  }

  /**
   * Handles http requests.
   */
  private httpRouter = (req: http.IncomingMessage, res: http.ServerResponse): void => {
    // needed for CORS
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
      this.httpServer.collectRequestData(req, (result: any) => {
        let users = this.webSocketServer.users.map(user => user.name)
        let success = users.indexOf(result.name) === -1 ? true : false
        res.end(JSON.stringify({ success }))
      })
    }
  }
}

new Server(3000)
