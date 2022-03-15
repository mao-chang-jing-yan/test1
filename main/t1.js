
var defaultVector = {
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
    getDiscreteInput(addr, unitID, callback) {
        setTimeout(function () {
            // callback = function(err, value)
            callback(null, addr + 8000);
        }, 10);
    },
    getMultipleInputRegisters(addr, length,unitID, callback){
        setTimeout(function () {
            // callback = function(err, value)
            callback(null, addr + 8000);
        }, 10);
    },
    getMultipleHoldingRegisters(addr, length,unitID, callback){

    },

    /* getMultipleInputRegisters?:
        ((addr: number, length: number, unitID: number, cb: FCallbackVal<number>) => void) |
        ((addr: number, length: number, unitID: number) => Promise<number>) |
        ((addr: number, length: number, unitID: number) => number);
    getMultipleHoldingRegisters?:
        ((addr: number, length: number, unitID: number, cb: FCallbackVal<number>) => void) |
        ((addr: number, length: number, unitID: number) => Promise<number>) |
        ((addr: number, length: number, unitID: number) => number); */

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


var s = require("./severTcp")

var r = new s.ServerTCP(defaultVector, {host: "127.0.0.1", port: 8502, debug: true, unitIDS: [1], clientKey: "3030303466666662"})


