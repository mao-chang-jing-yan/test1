const net = require("net");
const ModbusRTU = require("modbus-serial");

class DTU {
    options = {
        host: '127.0.0.1',
        port: 8502
    }

    constructor(slaveNum) {
        this.tcp_client = net.Socket();
        this.modbus_client = new ModbusRTU();
        this.orders = []
        this.res = []


    }

    connect() {
        this.modbus_client.connectTCP("127.0.0.1", {port: 8502});
        this.tcp_client.connect(this.options, function () {
            console.log('connected to Server');
            this.tcp_client.write('I am tcp_client of node!');
        })
        this.tcp_client.on("data", function (data) {
            console.log('received data: %s from server', data.toString());
            this.orders.push("data")

        })
    }

    mainLoop() {
        while (true) {
            let order = this.orders.pop()
            // do order
            // let res = await this.modbus_client.write("")
            let res = ""
            this.res.push(res)

            res = this.res.pop()
            this.tcp_client.write(res)

            return
        }
    }

    register(clientKey) {
        if (!this.tcp_client.isConnected) {
            this.connect()
        }
        this.tcp_client.write(clientKey)
    }


}