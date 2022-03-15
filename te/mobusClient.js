var ModbusRTU = require("modbus-serial");
var client = new ModbusRTU();

// open connection to a tcp line
client.connectTCP("127.0.0.1", { port: 8502 });
client.setID(1);

// read the values of 10 registers starting at address 0
// on device number 1. and log the values to the console.
setInterval(function() {
    client.readHoldingRegisters(9, 4, function(err, data) {
        console.log(data);
    });
    // client.readCoils(3000, 1).then(r => {
    //     console.log(r)
    // })
}, 1000);

//initialized undefined
// data <Buffer 00 01 00 00 00 06 02 01 0b b8 00 01>
// recvBuffer <Buffer 00 01 00 00 00 06 02 01 0b b8 00 01>
// requestBuffer <Buffer 02 01 0b b8 00 01 7f f8>
// data <Buffer 00 02 00 00 00 06 02 01 0b b8 00 01>
// recvBuffer <Buffer 00 02 00 00 00 06 02 01 0b b8 00 01>
// requestBuffer <Buffer 02 01 0b b8 00 01 7f f8>
// data <Buffer 00 03 00 00 00 06 02 01 0b b8 00 01>
// recvBuffer <Buffer 00 03 00 00 00 06 02 01 0b b8 00 01>
// requestBuffer <Buffer 02 01 0b b8 00 01 7f f8>
// data <Buffer 00 04 00 00 00 06 02 01 0b b8 00 01>
// recvBuffer <Buffer 00 04 00 00 00 06 02 01 0b b8 00 01>
// requestBuffer <Buffer 02 01 0b b8 00 01 7f f8>


// buffer.from([0x00, message_id, 0x00, 0x00, 0x00, length, sleave_id, data1, data2])
// buffer.from([slid, fnc, data1, data2, cs1, cs2])


data.slice(0,1) + data.slice(-3, -1)


