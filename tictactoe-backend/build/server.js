"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const websocketServer_1 = __importDefault(require("./components/websocketServer"));
const httpServer_1 = __importDefault(require("./components/httpServer"));
/** Class representing the server */
class Server {
    /**
     * Create and start server components.
     */
    constructor(port) {
        /**
         * Handles http requests.
         */
        this.httpRouter = (req, res) => {
            // needed for CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Request-Method', '*');
            res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
            res.setHeader('Access-Control-Allow-Headers', '*');
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            let { url, method } = req;
            if (url === '/login' && method === 'POST') {
                this.httpServer.collectRequestData(req, (result) => {
                    let users = this.webSocketServer.users.map(user => user.name);
                    let success = users.indexOf(result.name) === -1 ? true : false;
                    res.end(JSON.stringify({ success }));
                });
            }
        };
        this.initHttpServer();
        this.initWebSocketServer();
        this.httpServer.listen(port);
    }
    /**
     * Inits http server.
     */
    initHttpServer() {
        this.httpServer = new httpServer_1.default(this.httpRouter);
    }
    /**
     * Inits websocket server.
     */
    initWebSocketServer() {
        this.webSocketServer = new websocketServer_1.default(this.httpServer.server);
    }
}
new Server(3000);
