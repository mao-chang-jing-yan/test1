// 随机数
function getRandNum(left, right) {
    return Math.floor(Math.random() * (right - left)) + left
}

function buildHeader(dataBuf) {
    // TPYE（1B）+ HEAD（1B）+ VERSION（1B）+ CMD（1B）+ LEN（2B）+ DATA + CS（1B）
    var buf = Buffer.alloc(7 + dataBuf.length)
    buf.writeInt8(0x00, 0) // type (1B)
    buf.write("1", 1, 1) // head (1B)
    buf.write("1", 2, 1) // version (1B)
    buf.write("1", 3, 1) // cmd (1B)
    buf.write(dataBuf.length + "", 4, 2) // len (2B)

    dataBuf.copy(buf, 6, 0, dataBuf.length) //data ( ** B)
    buf.write("1", dataBuf.length + 6, 1) // cs (1B)

    return buf
}

function buildData() {
    var buf = Buffer.alloc(244)
    // 特征值时间	unsigned char	7		年、月、日、时、分、秒
    buf.writeUInt8(20, 0) // 年
    buf.writeUInt8(21, 1) // 年
    buf.writeUInt8(12, 2) // 月
    buf.writeUInt8(12, 3) // 日
    buf.writeUInt8(6, 4)  // 时
    buf.writeUInt8(18, 5) // 分
    buf.writeUInt8(30, 6) // 秒

    // 参数时间	unsigned char	7		年、月、日、时、分、秒
    buf.writeUInt8(20, 7) // 年
    buf.writeUInt8(21, 8) // 年
    buf.writeUInt8(12, 9) // 月
    buf.writeUInt8(12, 10) // 日
    buf.writeUInt8(6,11)  // 时
    buf.writeUInt8(18, 12) // 分
    buf.writeUInt8(30, 13) // 秒

    // SN	char	10
    buf.write("234", 14, 10)
    // buf.writeInt8(1, 14)


    // console.log(buf)
    // 软件版本	char	10
    buf.write("fgdfg", 24, 10)
    // console.log(buf)
    // 硬件版本	char	10		byte1：RSRP ， byte2：RSRQ
    buf.write("34234", 34, 10)
    // console.log(buf)
    // RSSI	signed char	1
    buf.writeInt8(0, 44)
    // console.log(buf)
    // 电压	float	4
    buf.writeFloatLE(getRandNum(10, 100), 45)
    // console.log(buf.readFloatLE(45))
    // 电流	float	4
    buf.writeFloatLE(12.0, 49)
    // console.log(buf.readFloatLE(45), buf.readFloatLE(49))
    // 内阻	float	4
    buf.writeFloatLE(12.0, 53)
    // console.log(buf.readFloatLE(49), buf.readFloatLE(53))
    // 温度	signed char	1		传感器温度
    buf.writeInt8(1, 57)
    // console.log(buf.readFloatLE(53), buf.slice(57, 58).toString())


    // 特征值方向数据结构：
    for (let i = 0; i < 3; i++) {
        let buf1 = build_st_dir()
        buf1.copy(buf, 58 + i * 62)
    }
    return buf

}

// 特征值数据结构：
function build_st_data() {
    let buf = Buffer.alloc(6);
    // 特征值类型	unsigned char	1		1 - 高加总值；2 - 低加总值；3 - 速度总值；4 - 10 预留
    buf.writeUInt8(getRandNum(1, 3), 0)
    // 特征值状态	unsigned char	1		0 - 正常；1 - 报警
    buf.writeUInt8(getRandNum(0, 1), 1)
    // 值	float	4
    buf.writeFloatLE(1234, 2)
    return buf
}

// 特征值方向数据结构：
function build_st_dir() {
    let buf = Buffer.alloc(62);
    // 特征值方向	unsigned char	1		1 - X轴；2 - Y轴；3 - Z轴
    buf.writeUInt8(getRandNum(1,3), 0)
    // 方向状态	unsigned char	1		0 - 正常；1 - 特征值报警；2 - 温度报警；3 - 特征值 + 温度报警
    buf.writeUInt8(0, 1)

    // 特征值数据结构：
    for (let i = 0; i < 10; i++) {
        let buf1 = build_st_data()
        buf1.copy(buf, 2 + i * buf1.length)
    }
    return buf
}

function buildAppData() {
    var data = buildData()
    // console.log(data.length)
    // console.log(data.slice(62, 69).readFloatLE(0))

    var b = buildHeader(data)
    // console.log("er", b.length, b.slice(72, 73).toString())
    // console.log(base.encode(b.toString()))
    return b.toString("base64")
}


var b = buildAppData()
// console.log(b)
