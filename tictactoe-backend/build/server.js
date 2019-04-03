"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http = __importStar(require("http"));
const websocket_1 = __importDefault(require("./components/websocket"));
/** Class representing the http server */
class Server {
    /**
     * Create http server.
     */
    constructor() {
        this.server = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            let { url } = req;
            if (url === '/about') {
                res.write('<h1>about us page<h1>');
                res.end();
            }
        });
        this.initWebSocketServer();
    }
    /**
     * Inits websocket server.
     */
    initWebSocketServer() {
        this.webSocketServer = new websocket_1.default().create(this.server);
    }
    /**
     * Start the http server.
     * @param {Number} port
     */
    listen(port) {
        this.server.listen(port, () => {
            console.log('server started at port ' + port);
        });
    }
}
new Server().listen(3000);
