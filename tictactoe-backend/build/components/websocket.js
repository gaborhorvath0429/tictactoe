"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const websocket = __importStar(require("websocket"));
class WebSocketServer {
    create(httpServer) {
        let ws = new websocket.server({
            httpServer: httpServer,
            autoAcceptConnections: false
        });
        ws.on('request', request => {
            var connection = request.accept('tictactoe', request.origin);
            console.log(new Date() + ' Connection accepted.');
            connection.on('message', message => {
                if (message.type === 'utf8') {
                    let { utf8Data: msg } = message;
                    console.log('Received Message: ' + msg);
                    connection.sendUTF(msg);
                }
            });
            connection.on('close', (reasonCode, description) => {
                console.log(new Date() + ' Peer ' + connection.remoteAddress + ' disconnected.');
            });
        });
        return ws;
    }
}
exports.default = WebSocketServer;
