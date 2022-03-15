var f = require("./test3")
let flowCode = "p0p"
// 默认数据
let defaultData = [
    {
        id: "id1",
        flowCode: "1",
        flowVariant: "",
        flowCase: "1",
        activity: "1",
        activityTime: "2021-1-4 9:54",
        isReWork: 0
    },
    {
        id: "id2",
        flowCode: "1",
        flowVariant: "",
        flowCase: "2",
        activity: "3",
        activityTime: "2021-1-4 16:50",
        isReWork: 0
    },
    {
        id: "id3",
        flowCode: "1",
        flowVariant: "",
        flowCase: "1",
        activity: "2",
        activityTime: "2021-1-4 16:22",
        isReWork: 0
    },
    {id: "id4", flowCode: "1", flowVariant: "", flowCase: "1", activity: "1", activityTime: 3, isReWork: 0},
]

// console.log(new Date())
// console.log((new Date("2021-08-05T00:34:00.000Z").valueOf()), (new Date(null).valueOf()) - null)
// console.log(106787 - 105972)
// console.log(106787 / 105972)


// function insert(list, num) {
//     let length = list.length
//     if (length === 0 || length >= 1 && list[length - 1] <= num) {
//         list.push(num);
//         return;
//     }
//     if (length >= 1 && list[0] >= num) {
//         list.unshift(num)
//         return;
//     }
//
//     let left = 0, right = length - 1;
//     while (left + 1 < right) {
//         let middle = Math.floor((left + right) / 2)
//         if (num >= list[middle]) {
//             left = middle;
//         }
//         if (num <= list[middle]) {
//             right = middle;
//         }
//     }
//     // if (list[right] === num) {
//     while (list[right] === num && right + 1 < length) {
//         if (list[right + 1] === num) {
//             right++;
//         } else {
//             right++;
//             break
//         }
//     }
//     // }
//     list.splice(right, 0, num)
//     console.log(right)
// }
//
//
// let a = [1, 1.2, 3, 4]
// insert(a, 2)
// console.log(a)


// let a = [1,2,3]
// console.log(a)
// console.log(a.splice(0, 0, "1"))
// console.log(a)
console.log(["@3", 1] == ["@3", 1])

function csvStrToMapList(str, keys) {
    let data_ = str.split("\r\n")
    for (let i = 0; i < data_.length; i++) {
        data_[i] = data_[i].split(",")
    }
    if (data_.length <= 1) {
        return []
    }
    let keys_ = data_[0];
    let data = []
    for (let i = 1; i < data_.length; i++) {
        let item = {}
        for (let j = 0; j < keys_.length; j++) {
            let key = keys_[j].replace(/\s*/g, "");
            if (keys && keys.length >= j + 1) {
                key = keys[j];
            }
            item[key] = data_[i][j];
        }
        data.push(item)
    }
    return data;
}


function splitList(list, size = 1) {
    if (!list || !list.length) {
        return []
    }
    if (size <= 0) {
        size = 1
    }
    let res = []
    let count = Math.floor(list.length / size);
    let index = 0;
    for (index = 0; index < count; index++) {
        res.push(list.slice(index * size, (index + 1) * size))
    }
    let last = list.slice(index * size)
    if (last.length !== 0) {
        res.push(last)
    }
    return res;
}


// var fs = require('fs');
// var data = fs.readFileSync('./yzj_log.csv', 'utf-8');
// console.log(csvStrToMapList(data, [1, 2, 3, 4, 5, 6, 7, 8, 9]))
// let str1 = "1 . 1".replace(/\s*/g,"");
// console.log(str1)
// console.log(" df ".replaceAll(" ", ""))

// console.log([1, 2, 3].slice(-2, 3))
// let r = splitList([1, 2, 3], 1)
// console.log(r)

function f1() {
    var fs = require('fs');
    var data = fs.readFileSync('./yzj_log.csv', 'utf-8');
    let data_ = data.split("\r\n")
    for (let i = 0; i < data_.length; i++) {
        data_[i] = data_[i].split(",")
    }
    data = []
    for (let i = 1; i < data_.length; i++) {
        if (i > 900000) {
            // break
        }
        let it = data_[i];
        let item = {
            id: "id3",
            flowCode: "1",
            flowVariant: "",
            flowCase: it[0],
            activity: it[1],
            activityTime: it[2],
            isReWork: 0
        }
        data.push(item)
    }
// console.log(data)
    defaultData = data

    let a = new f(flowCode, defaultData)
    console.log(a.getTables())
}


// console.log((new Date("2021/1/4 9:54:00")).valueOf() - new Date("2021/1/3 9:54:00"))

// console.log(defaultData.sort(function (a, b) {
//     let flag = 0;
//     try {
//         let time1 = new Date(a.activityTime);
//         let time2 = new Date(b.activityTime);
//         flag = time1.valueOf() - time2.valueOf()
//     } catch (e) {
//     }
//     return flag;
// }))
//
// console.log(defaultData)

// const assert = require('assert');
// const {
//     Worker, MessageChannel, MessagePort, isMainThread, parentPort,threadId
// } = require('worker_threads');
// if (isMainThread) {
//     const worker = new Worker(__filename);
//     // const worker2 = new Worker(__filename);
//     const subChannel = new MessageChannel();
//     worker.postMessage({ hereIsYourPort: subChannel.port1 }, [subChannel.port1]);
//     subChannel.port2.on('message', (value) => {
//         console.log('1接收到:', value);
//     });
// } else {
//     parentPort.once('message', (value) => {
//         assert(value.hereIsYourPort instanceof MessagePort);
//         value.hereIsYourPort.postMessage({v:'工作线程正在发送此消息', i: threadId});
//         value.hereIsYourPort.close();
//     });
// }
// // const assert = require('assert');
// // const {
// //     Worker, MessageChannel, MessagePort, isMainThread, parentPort,threadId
// // } = require('worker_threads');
// if (isMainThread) {
//     const worker = new Worker(__filename);
//     const subChannel = new MessageChannel();
//     // worker.postMessage({ hereIsYourPort: subChannel.port1 }, [subChannel.port1]);
//     subChannel.port2.on('message', (value) => {
//         console.log('2接收到:', value);
//     });
// } else {
//     // parentPort.once('message', (value) => {
//     //     assert(value.hereIsYourPort instanceof MessagePort);
//     //     value.hereIsYourPort.postMessage({v:'工作线程正在发送此消息', i: threadId});
//     //     value.hereIsYourPort.close();
//     // });
// }