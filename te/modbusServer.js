// deviceKeys = ["12345", "12355", "12312acb", ]
// deviceNum = 100

// serverIp = "192.168.2.233"
// port = 8504
// reset time = random()   //多少s ,reset重连


// ﻿﻿﻿﻿ervecreate an empty modbus client
// ﻿
// import {FCallbackVal} from "modbus-serial/ServerTCP";

var ModbusRTU = require("modbus-serial");

var vector = {
    getInputRegister: function (addr, unitID) {
        // Synchronous handling
        return addr;
    },
    getHoldingRegister: function (addr, unitID, callback) {
        // Asynchronous handling (with callback)
        setTimeout(function () {
            // callback = function(err, value)
            callback(null, addr + 8000);
        }, 10);
    },
    // getDiscreteInput:
    //     ((addr: number, unitID: number, cb: FCallbackVal<boolean>) => void) |
    //     ((addr: number, unitID: number) => Promise<boolean>) |
    //     ((addr: number, unitID: number) => boolean);
    getDiscreteInput(addr, unitID, callback) {
        setTimeout(function () {
            // callback = function(err, value)
            callback(null, addr + 8000);
        }, 10);
    },


    getCoil: function (addr, unitID) {
        // Asynchronous handling (with Promises, async/await supported)
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve((addr % 2) === 0);
            }, 10);
        });
    },
    setRegister: function (addr, value, unitID) {
        // Asynchronous handling supported also here
        console.log("set register", addr, value, unitID);
        return;
    },
    setCoil: function (addr, value, unitID) {
        // Asynchronous handling supported also here
        console.log("set coil", addr, value, unitID);
        return;
    },
    readDeviceIdentification: function (addr) {
        return {
            0x00: "MyVendorName",
            0x01: "MyProductCode",
            0x02: "MyMajorMinorRevision",
            0x05: "MyModelName",
            0x97: "MyExtendedObject1",
            0xAB: "MyExtendedObject2"
        };
    }
};

// set the server to answer for modbus requests
console.log("ModbusTCP listening on modbus://0.0.0.0:8502");
var serverTCP = new ModbusRTU.ServerTCP(vector, {
    host: "127.0.0.1",
    port: 8502,
    debug: true,
    unitIDS: [1, 2],
    clientKey: "0004fffb"
});
//var serverTCP1 = new ModbusRTU.ServerTCP(vector, {host: "127.0.0.1", port: 8502, debug: true, unitID: 1});


serverTCP.on("socketError", function (err) {
    // Handle socket error if needed, can be ignored
    console.error(err);
});

serverTCP.on("error", function (err) {
    // Handle socket error if needed, can be ignored
    console.log("error");
});

serverTCP.on("initialized", function (err) {
    // Handle socket error if needed, can be ignored
    console.log("initialized", err);
});

