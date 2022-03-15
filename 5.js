

function loggingDecorator(wrapped) {
    return function() {
        console.log('Starting');
        const result = wrapped.apply(this, arguments);
        console.log('Finished');
        return result;
    }
}

@loggingDecorator()
function doSomething(name) {
    console.log('Hello, ' + name);
}



// const wrapped = loggingDecorator(doSomething);
// wrapped()
doSomething("8798")