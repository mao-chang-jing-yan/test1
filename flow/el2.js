
async function f() {

    return 0
}


async function createIterator(items) {
    var i = 0;
    return {
        next: async function() {
            // var done = (i >= items.length);
            // var value = !done ? items[i++] : undefined;
            let re = 123;
            let res = f().then(r=>{
                console.log(r)
                re = r
                return r
            })
            let result =  await res;
            console.log("result",result)
            // while (i < 1){
            //     let result = yield res
            //
            // }
            return  {
                done: 1,
                value: res
            };
        }
    };
}

async function main() {
    var iterator = await createIterator([1, 2, 3]);
//     console.log(await iterator.next()); // "{ value: 1, done: false }"
//     console.log(iterator.next()); // "{ value: 2, done: false }"
//     console.log(iterator.next()); // "{ value: 3, done: false }"
//     console.log(iterator.next()); // "{ value: undefined, done: true }"
// // 之后的所有调用
//     console.log(iterator.next()); // "{ value: undefined, done: true }"

    for (let iteratorElement of await iterator) {
        console.log(await iteratorElement)
    }
}

main().then()
