// var myIterable = {}
// myIterable[Symbol.iterator] = function* () {
//     yield 1;
//     yield 2;
//     yield 3;
// };
// [...myIterable] // [1, 2, 3]


async function find() {
    return {data: [], count: 100}
}

// 为不可迭代的对象添加迭代器
let findallIlter = function (pageSize) {
    return {
        pageSize: 1,
        b: 2,
        [Symbol.iterator]: function* (){
            let index = 0;
            let count = 0;
            let result = find();
            

        }
    }

}



