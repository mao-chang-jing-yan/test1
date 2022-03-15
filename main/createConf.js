

// 随机数
function getRandNum(left, right) {
    return parseInt(Math.floor(Math.random() * (right - left)) + left)
}


// 保存json
function saveJSON(data, filename) {
    //文件模块
    let fs = require('fs');
    //系统路径模块
    let path = require('path');

    // 格式化json
    let text = JSON.stringify(data)
    // 指定要创建的目录和文件名称 __dirname为执行当前js文件的目录
    let file = path.join(__dirname, filename);
    //写入文件
    fs.writeFile(file, text, function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log('文件创建成功~' + file);
        }
    });
}

// 创建conf 文件 增加测试数据
function createConf () {
    let jsStr = require("./modbus.json")
    let deviceList = jsStr["deviceConfig"]

    for (let i = 100; i < 1000; i++) {
        let slaveId = [0, 1]
        for (let j = 0; j < 10; j++) {
            let num = getRandNum(0, 100)
            if (!slaveId.includes(num)){
                slaveId.push(num)
            }
        }
        deviceList.push({
            "clientKey": i + "",
            "slaveId": slaveId,
            "template": "template1"
        })
    }
    jsStr["deviceConfig"] = deviceList
    saveJSON(jsStr, "./test.json")
}


// createConf()

module.exports = {
    createConf: createConf
}