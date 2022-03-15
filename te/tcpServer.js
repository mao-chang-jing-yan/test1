var net = require('net');
var tcp_server = net.createServer();  // 创建 tcp server

var Sockets = {};
var SocketID = 1;



// 处理客户端连接
tcp_server.on('connection',function (socket){
    console.log(socket.address());
    // Sockets[SocketID] =socket;
    // SocketID++;
    DealConnect(socket)
})

tcp_server.on('error', function (){
    console.log('tcp_server error!');
})

tcp_server.on('close', function () {
    console.log('tcp_server close!');
})


// 处理每个客户端消息
function DealConnect(socket){

    socket.on('data',function(data){
        data = data.toString();
        // 向所有客户端广播消息
        for(var i in Sockets){
            Sockets[i].write(data);
        }
        // socket.write(data);
        console.log('received data %s',data);
    })

    // 客户端正常断开时执行
    socket.on('close', function () {
        console.log('client disconneted!');
    })
// 客户端正异断开时执行
    socket.on("error", function (err) {
        console.log('client error disconneted!');
    });
}

// 监听 端口
tcp_server.listen(8502,function (){
    console.log('tcp_server listening 8502');
});