import {httpServer} from "./servers/http.js";
import {wsServer} from "./servers/ws.js";
import configDotenv from 'dotenv';

configDotenv.config({
    path: '../.env'
});

const PORT = process.env.SERVER_PORT || 3001;
const app = httpServer(PORT);
const wss = wsServer();

const server = app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
    if (request.url === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});
