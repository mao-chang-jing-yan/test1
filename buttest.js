// var buf = Buffer.alloc(251)
// buf.write("1", 0, 1) // type (1B)
// buf.write("1", 1, 1) // head (1B)
// buf.write("1", 2, 1) // version (1B)
// buf.write("1", 3, 1) // cmd (1B)
// buf.write("12", 4, 2) // len (2B)
// buf.write("1", 0, 1) // data ( ** B)
// buf.write("1", 0, 1) // cs (1B)
function Base64() {

    // private property
    let _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    // public method for encoding
    this.encode = function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        input = _utf8_encode(input);
        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output = output +
                _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
                _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
        }
        return output;
    }

    // public method for decoding
    this.decode = function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (i < input.length) {
            enc1 = _keyStr.indexOf(input.charAt(i++));
            enc2 = _keyStr.indexOf(input.charAt(i++));
            enc3 = _keyStr.indexOf(input.charAt(i++));
            enc4 = _keyStr.indexOf(input.charAt(i++));
            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;
            output = output + String.fromCharCode(chr1);
            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }
        }
        output = _utf8_decode(output);
        return output;
    }

    // private method for UTF-8 encoding
    _utf8_encode = function (string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }
        return utftext;
    }

    // private method for UTF-8 decoding
    _utf8_decode = function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;
        while (i < utftext.length) {
            c = utftext.charCodeAt(i);
            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            } else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return string;
    }
}

var base = new Base64();


function parseHead(dataBuf) {
    // TPYE（1B）+ HEAD（1B）+ VERSION（1B）+ CMD（1B）+ LEN（2B）+ DATA + CS（1B）
    var buf = Buffer.alloc(7 + dataBuf.length)
    buf.write("0", 0, 1) // type (1B)
    buf.write("1", 1, 1) // head (1B)
    buf.write("1", 2, 1) // version (1B)
    buf.write("1", 3, 1) // cmd (1B)
    buf.write(dataBuf.length + "", 4, 2) // len (2B)

    dataBuf.copy(buf, 6, 0, dataBuf.length) //data ( ** B)
    buf.write("1", dataBuf.length + 6, 1) // cs (1B)

    return buf
}

function parseData() {
    var buf = Buffer.alloc(244)
    // 特征值时间	unsigned char	7		年、月、日、时、分、秒
    buf.write("1234567", 0, 7)
    // console.log(buf)
    // 参数时间	unsigned char	7		年、月、日、时、分、秒
    buf.write("7654321", 7, 7)
    // console.log(buf)
    // SN	char	10
    buf.write("234", 14, 10)
    // console.log(buf)
    // 软件版本	char	10
    buf.write("fgdfg", 24, 10)
    // console.log(buf)
    // 硬件版本	char	10		byte1：RSRP ， byte2：RSRQ
    buf.write("34234", 34, 10)
    // console.log(buf)
    // RSSI	signed char	1
    buf.write("1", 44, 1)
    // console.log(buf)
    // 电压	float	4
    buf.writeFloatLE(12.0, 45)
    // console.log(buf.readFloatLE(45))
    // 电流	float	4
    buf.writeFloatLE(12.0, 49)
    // console.log(buf.readFloatLE(45), buf.readFloatLE(49))
    // 内阻	float	4
    buf.writeFloatLE(12.0, 53)
    // console.log(buf.readFloatLE(49), buf.readFloatLE(53))
    // 温度	signed char	1		传感器温度
    buf.write("1", 57, 1)
    // console.log(buf.readFloatLE(53), buf.slice(57, 58).toString())
    // 特征值方向数据结构：
    // 特征值方向	unsigned char	1		1-X轴；2-Y轴；3-Z轴
    buf.write("1", 58, 1)
    // console.log(buf.slice(58,59).toString(),buf.slice(58, 59).toString())
    // 方向状态	unsigned char	1		0-正常；1-特征值报警；2-温度报警；3-特征值+温度报警
    buf.write("1", 59, 1)
    // 特征值数据结构：
    // 特征值类型	unsigned char	1		1-高加总值；2-低加总值；3-速度总值；4-10 预留
    buf.write("1", 60, 1)
    // 特征值状态	unsigned char	1		0-正常；1-报警
    buf.write("1", 61, 1)
    // 值	float	4
    buf.writeFloatLE(12, 62)

    for (let i = 0; i < 3; i++) {
        let buf1 = parse_st_dir()
        buf1.copy(buf, 66 + i * 62)
    }
    return buf

}


function parse_st_data() {
    let buf = Buffer.alloc(6);
    buf.write("1", 0, 1)
    buf.write("1", 1, 1)
    buf.writeFloatLE(1234, 2)
    return buf
}

function parse_st_dir() {
    let buf = Buffer.alloc(62);
    buf.write("0", 0, 1)
    buf.write("0", 1, 1)

    for (let i = 0; i < 10; i++) {
        let buf1 = parse_st_data()
        buf1.copy(buf, 2 + i * buf1.length)
    }
    return buf
}

function parseAppData() {
    var data = parseData()
    console.log(data.length)
    console.log(data.slice(62, 69).readFloatLE(0))

    var b = parseHead(data)
    console.log("er", b.length, b.slice(72, 73).toString())
    console.log(base.encode(b.toString()))
    // console.log(b)
    return b.toString("base64")
}

let b = parseAppData()
console.log("b ", b)
// for (let i = 0; i < 10; i++) {
//     console.log(b.slice( 100 * i, (i + 1)* 100))
// }





