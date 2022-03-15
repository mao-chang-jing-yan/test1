// // create a queue object with concurrency 2
// const async = require("async");
//
// var q = async.queue(function(task, callback) {
//     console.log('hello ' + task.name);
//     callback();
// }, 2);
//
// // assign a callback
// q.drain(function() {
//     console.log('all items have been processed');
// });
// // or await the end
// // await q.drain()
//
// // assign an error callback
// q.error(function(err, task) {
//     console.error('task experienced an error');
// });
//
// // add some items to the queue
// q.push({name: 'foo'}, function(err) {
//     console.log('finished processing foo');
// });
// // callback is optional
// q.push({name: 'bar'});
//
// // add some items to the queue (batch-wise)
// q.push([{name: 'baz'},{name: 'bay'},{name: 'bax'}], function(err) {
//     console.log('finished processing item');
// });
//
// // add some items to the front of the queue
// q.unshift({name: 'bar'}, function (err) {
//     console.log('finished processing bar');
// });
// //--------------------------
// // create a queue object with concurrency 1
// var q = async.priorityQueue(function(task, callback) {
//     console.log('Hello ' + task.name);
//     callback();
// }, 1);
//
// // assign a callback
// q.drain = function() {
//     console.log('All items have been processed');
// };
//
// // add some items to the queue with priority
// q.push({name: 'foo3'}, 3, function(err) {
//     console.log('Finished processing foo');
// });
//
// q.push({name: 'bar2'}, 2, function (err) {
//     console.log('Finished processing bar');
// });
//
// // add some items to the queue (batch-wise) which will have same priority
// q.push([{name: 'baz1'},{name: 'bay1'},{name: 'bax1'}], 1, function(err) {
//     console.log('Finished processing item');
// });
//
// q.pop()



console.log([1].includes(1))
console.log(0x0bb8)