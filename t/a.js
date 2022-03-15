// var a = require("./b")
//
// a.test()
//
// a.a()

// var a = new Map()
// a.set("!","23")
// a.set("9","23")
// console.log(a)
// a.forEach((value, key, map)=>{
//     console.log(key, value, map)
// })
// console.log(a)


// .//browser/query-builder/UpdateQueryBuilder.js:


var exec = require('child_process').exec;
var cmd = 'brew';

exec(cmd, function(error, stdout, stderr) {
    console.log(error, stdout, stderr)
    // 获取命令执行的输出
});