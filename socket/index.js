module.exports = function(io) {
    io.on('connection', function(socket) {
        socket.removeAllListeners();
        console.log("SOCKET CONNECTED",socket.id);
        socket.on('panel',function(){
            socket.join('panel');
        })
    });
};
