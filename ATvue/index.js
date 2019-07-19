import {
    deepCopy,
    isObject
} from './utils.js';
import {
    isFunction
} from 'util';

class ATvue {
    constructor(options) {
        this.vm = this
        this.$el = options.el
        
        if (isObject(options.data)) {
            this.$data = deepCopy(options.data);
        } else if (isFunction(options.data)) {
            this.$data = options.data();
        } else {
            console.error('data 参数有误')
        }

        // new Compiler(this.$data)
    }
}


const defineReactive = (vm, data) => {
    if (!isObject(data)) return;

    for(let prop in data) {
        if (isObject(prop)) {
            defineReactive(prop)
        } else {
            Object.defineProperty(data, prop, {
                get() {
                    return data[prop]
                },
                set(val) {
                    
                }
            })
        }
    }
};

class Observer {
    constructor() {

    }
}
export default ATvue