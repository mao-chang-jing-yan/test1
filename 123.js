//{"code":0,"deviceStatusList":[{"value":"AVUBIQACFBYBCggAAgMBAATeQHU8IE4SABEAAAAAAAB6AJQAhwCGAI8AfQCPAIgAdgCSAIwAeQCPAIsAiQCYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA=","timestamp":1641773789501,"datasetId":"APPdata"}],"desc":""}

// const data = "AVUBIQACFBYBCggAAgMBAATeQHU8IE4SABEAAAAAAAB6AJQAhwCGAI8AfQCPAIgAdgCSAIwAeQCPAIsAiQCYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA="
const data = "AFUBIPsAFBYBBg0KABQWAQYKDQ4yNzE2NwAAAAAAVjExMC45AAAAALD8AAAAAAAAAP+14UBNQECZvEIAAAAAEgMAAQA34m09AgA/b7A8AwBRCUs9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAACABr+hT0DAD4Ksj0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAIAPTOKPQMAKszEPQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJg="

let buffer = Buffer.from(data, 'Base64')


console.log(buffer.readUInt8(0))
console.log(buffer.readUInt8(1))
console.log(buffer.readUInt8(2))
console.log(buffer.readUInt8(3))
console.log(buffer.readInt16BE(4))
// ???????????????	unsigned char	7		?????????????????????????????????
console.log("???????????????")
console.log(buffer.readUInt8(6))
console.log(buffer.readUInt8(7))
console.log(buffer.readUInt8(8))
console.log(buffer.readUInt8(9))
console.log(buffer.readUInt8(10))
console.log(buffer.readUInt8(11))
console.log(buffer.readUInt8(12))
// ????????????	unsigned char	7		?????????????????????????????????
console.log("????????????")
console.log(buffer.slice(13, 19).toString())
console.log(buffer.readUInt8(13))
console.log(buffer.readUInt8(14))
console.log(buffer.readUInt8(15))
console.log(buffer.readUInt8(16))
console.log(buffer.readUInt8(17))
console.log(buffer.readUInt8(18))
console.log(buffer.readUInt8(19))

// SN	char	10
console.log("SN", buffer.slice(20, 30).toString())
console.log(buffer.readInt8(20))
console.log(buffer.readInt8(21))
console.log(buffer.readInt8(22))
console.log(buffer.readInt8(23))
console.log(buffer.readInt8(24))
console.log(buffer.readInt8(25))
console.log(buffer.readInt8(26))
// ????????????	char	10
console.log("????????????", buffer.slice(20, 30).toString("ascii"))
console.log("????????????", buffer.slice(20, 30).toString("utf8"))
console.log("????????????", buffer.slice(20, 30).readInt8(0))
console.log("????????????", buffer.slice(20, 30).readInt8(1))
console.log("????????????", buffer.slice(20, 30).readInt8(2))
console.log("????????????", buffer.slice(20, 30).readInt8(3))
console.log("????????????", buffer.slice(20, 30).readInt8(4))
console.log("????????????", buffer.slice(20, 30).readInt8(5))
console.log("????????????", buffer.slice(20, 30).readInt8(6))
console.log("????????????", buffer.slice(20, 30).readInt8(7))
console.log("????????????", buffer.slice(20, 30).readInt8(8))

// ????????????	char	10		byte1???RSRP ??? byte2???RSRQ
console.log("????????????", buffer.slice(30, 40).toString("ascii"))
console.log("????????????", buffer.slice(30, 40).toString("utf8"))
console.log("????????????", buffer.slice(30, 40).readInt8(0))
console.log("????????????", buffer.slice(30, 40).readInt8(1))
console.log("????????????", buffer.slice(30, 40).readInt8(2))
console.log("????????????", buffer.slice(30, 40).readInt8(3))
console.log("????????????", buffer.slice(30, 40).readInt8(4))
console.log("????????????", buffer.slice(30, 40).readInt8(5))
console.log("????????????", buffer.slice(30, 40).readInt8(6))
console.log("????????????", buffer.slice(30, 40).readInt8(7))
console.log("????????????", buffer.slice(30, 40).readInt8(8))
console.log("????????????", buffer.slice(30, 40).readInt8(9))
// console.log("????????????", buffer.slice(30, 40).readInt8(10))
// RSSI	signed char	1
console.log("RSSI", buffer.readInt8(41))
// ??????	float	4
console.log("??????", buffer.readFloatLE(42))
// ??????	float	4
console.log("??????", buffer.readFloatLE(46))
// ??????	float	4
console.log("??????", buffer.readFloatLE(50))
// ??????	signed char	1		???????????????
console.log("??????", buffer.readInt8(54))

console.log(buffer.slice(0, 50))
console.log(buffer.slice(50, 100))
console.log(buffer.slice(100, 150))
console.log(buffer.slice(150, 200))


console.log(buffer.slice(200, 250))
console.log(buffer.slice(250, 300))
console.log(buffer.slice(300, 350))
console.log(buffer.slice(350, 400))
console.log(buffer.slice(400, 450))
console.log(buffer.slice(450, 500))


