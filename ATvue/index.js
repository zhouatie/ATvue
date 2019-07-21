import {
    deepCopy,
    isObject
} from './utils.js';
import {
    isFunction
} from 'util';


class Compiler {
    constructor(el, vm) {
        this.el = this.isRealElem(el) ? el : document.querySelector(el)
        let fragment = this.node2fragment(this.el)
        this.el.appendChild(fragment)
    }
    isRealElem(elem) {
        return elem.nodeType === 1;
    }
    node2fragment(node) {
        // dom 的内存具有可移动性
        let fragment = document.createDocumentFragment()
        let firstChild
        while (firstChild = node.firstChild) {
            console.log(firstChild, 'while')
            fragment.appendChild(firstChild)
        }
        return fragment
    }
}

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

        new Compiler(this.$el, this)
    }
}


const defineReactive = (vm, data) => {
    if (!isObject(data)) return;

    for (let prop in data) {
        if (isObject(prop)) {
            defineReactive(prop)
        } else {
            Object.defineProperty(data, prop, {
                get() {
                    return data[prop]
                },
                set(val) {
                    data[prop] = val
                }
            })
        }
    }
};

export default ATvue