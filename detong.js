// const CryptoJS = require('crypto-js')
// const Server = require('server')
// const config = require('./detong.json')
// const request = require('request')
// const log4js = require('log4js')
// const logger = log4js.getLogger('detong')
// logger.level = 'debug'

const intervalTime = 5 * 24 * 60 * 60 * 1000

// const intervalTime = eval(config.server.deviceConfig.interval) || 10 * 60 * 1000 //3 * 24 * 60 * 60 * 1000

function hmacSha1(message, secret) {
    const s = CryptoJS.HmacSHA1(message, secret).toString()
    const words = []
    const step = 8
    const len = Math.floor(s.length / step)
    for (let i = 0; i < len; i++) {
        const start = i * step
        const end = (i + 1) * step
        words[i] = parseInt(s.substring(start, end), 16)
    }
    const x = CryptoJS.lib.WordArray.create(words)
    return CryptoJS.enc.Base64.stringify(x)
}

function getSignature(application, timestamp, secret, body) {
    // let str = 'application:XiiUNeSI4Of\ntimestamp:1641891275515\n{\"productId\":\"15133135\",\"deviceId\":\"50a6d59b3fde44898d022a9ee625b7da\",\"begin_timestamp\": 1641457080278, \"end_timestamp\": 1641546722606, \"page_size\": 1}\n'
    const bodystr = JSON.stringify(body)
    const str = "application:" + application + "\ntimestamp:" + timestamp + "\n" + bodystr + "\n"
    return hmacSha1(str, secret)
}

async function generateHeaders(config, clientKey, body) {
    let timestamp = await getTime(config.echoUrl)
    let application = config.application
    let secret = config.secret
    return {
        application: application,
        version: 20190928013337,
        timestamp: timestamp,
        signature: getSignature(application, timestamp, secret, body),
        sdk: "0"
    }
}

function generateBody(deviceId, productId) {
    let timestamp = new Date().getTime()
    return {
        begin_timestamp: timestamp - intervalTime,
        deviceId: deviceId,
        end_timestamp: timestamp,
        productId: productId,
        page_size: 1000,
        page_timestamp: ""
    }
}

function generateMethod() {
    return 'POST'
}

async function getOptions(deviceConfig, clientKey) {
    try {
        let body = generateBody(clientKey, deviceConfig.productId)
        let headers = await generateHeaders(deviceConfig, clientKey, body)
        return {
            headers: headers,
            body: JSON.stringify(body),
            method: generateMethod()
        }
    } catch (err) {
        logger.error(err)
    }
}

function Request(url, options) {
    return new Promise((resolve, reject) => {
        request(url, options, (err, response, body) => {
            if (err) {
                reject(err)
            } else {
                resolve(response)
            }
        })
    })
}

async function getTime(echoUrl) {
    let time = new Date().getTime()
    // logger.info(time)
    let data = await Request(echoUrl, {'method': 'GET'})
    let offset = data.headers.timestamp - time
    return time + offset
}

function dataHandle(data) {
    data = JSON.parse(data.body)
    // logger.info(data)
    if ((data.code && data.code !== 0) || (data.deviceStatusList && data.deviceStatusList.length === 0)) {
        return null
    }
    try {
        let result = []
        for (let item of data.deviceStatusList) {
            let bufferData = item.APPdata
            let buffer = Buffer.from(bufferData, 'Base64')
            if (buffer[0] === 0x00) {
                result.push({
                    "RSSI": parseInt(buffer.slice(50, 51).toString('hex'), 16),
                    "vol": buffer.slice(51, 55).readFloatLE(0),
                    "cur": buffer.slice(55, 59).readFloatLE(0),
                    "IR": buffer.slice(59, 63).readFloatLE(0),
                    "temp": parseInt(buffer.slice(63, 64).toString('hex'), 16)
                })
            } else if (buffer[0] === 0x01) {
                result.push({
                    "waveDirection": buffer[13],   //1:x,2:y,3:z
                    "waveType": buffer[14],
                    "waveState": buffer[15],
                    "waveLength": buffer[16],
                    "translate": buffer.slice(17, 20).toString('hex'),
                    "freq": parseInt(buffer.slice(20, 22).toString('hex'), 16),
                    "data": buffer.slice(31, 511).toString('hex')
                })
            }
        }
        return result
    } catch (err) {
        logger.error(err)
    }

}

async function main() {
    hmacSha1("1234", "PAz8yCOLfc")
    // let deviceConfig = config.deviceConfig
    // let url = deviceConfig.url
    // const server = new Server(config)
    // server.registerParseData(dataHandle)
    // for (let device of deviceConfig.deviceList) {
    //     let clientKey = device.clientKey
    //     await server.crRequest(clientKey, url, await getOptions(deviceConfig, clientKey))
    //     setInterval(async () => {
    //         await server.crRequest(clientKey, url, await getOptions(deviceConfig, clientKey))
    //     }, intervalTime)
    // }
}

main().catch(err => {
    logger.error(err)
})
