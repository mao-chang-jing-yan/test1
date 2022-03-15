const ModbusRTU = require("./severTcp");
async function sleep(ms) {
    await new Promise(resolve=>setTimeout(resolve, ms))
}

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



class Clients {
    // 构造函数
    constructor(DUMP) {
        this.DTUMAP = DUMP || {
            "0003fffc55aa5500258003a8": {
                vector: defaultVector,
                options: {
                    host: "127.0.0.1",
                    port: 8502,
                    debug: true,
                    unitIDS: [1],
                    clientKey: "0003fffc55aa5500258003a8"
                },
                DTU: null,
            },
            "12": {
                vector: defaultVector,
                options: {host: "127.0.0.1", port: 8502, debug: true, unitIDS: [1], clientKey: "3030303466666662"},
                DTU: null,
            }
        }
    }

    // 运行所有 this.DTUMAP
    runAll() {
        for (const clientKey in this.DTUMAP) {
            if (this.DTUMAP.hasOwnProperty(clientKey)) {
                if (!this.DTUMAP[clientKey].options.hasOwnProperty("clientKey")) {
                    continue
                }

                try {
                    this.DTUMAP[clientKey].DTU = new ModbusRTU.ServerTCP(this.DTUMAP[clientKey].vector, this.DTUMAP[clientKey].options);
                } catch (e) {
                    console.log(e)
                }
            }
        }
    }

    runAllInConf(conf) {
        for (const i in conf["deviceConfig"]) {
            var unitIDS = conf["deviceConfig"][i]["slaveId"]
            var clientKey = conf["deviceConfig"][i]["clientKey"]

            // console.log(conf["deviceConfig"][i])

            try {
                new ModbusRTU.ServerTCP(defaultVector, {
                    host: "127.0.0.1",
                    port: 8502,
                    debug: true,
                    unitIDS: unitIDS,
                    clientKey: clientKey
                });
            } catch (e) {
                console.log(e)
            }
        }
        // console.log(conf["deviceConfig"])
    }


}

function test1() {
    const a = new Clients(null);
    a.runAll()
}

function test2() {
    const a = new Clients({
        "clientKey1": {
            vector: defaultVector,
            options: {
                host: "127.0.0.1",
                port: 8502,
                debug: true,
                unitIDS: [1, 2],
                clientKey: "clientKey1"
            },
            DTU: null,
        },
        "clientKey2": {
            vector: defaultVector,
            options: {
                host: "127.0.0.1",
                port: 8502,
                debug: true,
                unitIDS: [1, 2],
                clientKey: "clientKey2"
            },
            DTU: null,
        }
    });
    a.runAll()
}

async function test3() {
    const conf = require("./createConf");
    conf.createConf()
    await sleep(2500) // 休眠2.5s
    const a = new Clients(null);
    a.runAllInConf(require("./test.json"))
}






// test1()
// test2()
test3().then(r => {})










