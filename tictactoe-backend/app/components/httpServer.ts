import * as http from 'http'

/** Class representing the https server */
export default class HttpServer {
  public server: http.Server

  constructor(requestHandler: http.RequestListener) {
    this.server = http.createServer(requestHandler)
  }

  /**
   * Starts the http server.
   */
  public listen(port: Number): void {
    this.server.listen(port, () => {
      console.log('server started at port ' + port)
    })
  }

  /**
   * Function that parses body of requests.
   */
  public collectRequestData(
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
}
