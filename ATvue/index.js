import {
    deepCopy,
    isObject
} from './utils.js';
import {
    isFunction
} from 'util';

class Dep {
    constructor() {
        this.subs = []
    }
    addSub(watcher) {
        this.subs.push(watcher)
    }
    notify() {
        this.subs.forEach(watcher => watcher.update())
    }
}
// 观察者 （发布订阅）观察者 被观察者
class Watcher {
    constructor(vm, expr, cb) {
        this.vm = vm
        this.expr = expr
        this.cb = cb
        // 默认先存放在一个老值
        this.oldValue = this.get()
    }
    get() {
        Dep.target = this;
        let value = CompileUtil.getVal(this.vm, this.expr)
        Dep.target = null;
        return value
    }
    update() {
        let newVal = CompileUtil.getVal(this.vm, this.expr)
        if (newVal !== this.oldValue) {
            this.cb(newVal)
        }
    }
}
class Observer {
    constructor(data) {
        this.observer(data)
    }
    observer(data) {
        // 如果是对象才观察
        if (data && typeof data == 'object') {
            // 如果是对象
            for (let key in data) {
                this.defineReactive(data, key, data[key])
            }
        }
    }
    defineReactive(obj, key, value) {
        this.observer(value);
        let dep = new Dep()
        Object.defineProperty(obj, key, {
            get() {
                // 创建watcher时 会到对应的内容
                Dep.target && dep.subs.push(Dep.target);
                return value;
            },
            set: (newVal) => {
                if (newVal != value) {
                    this.observer(newVal);
                    value = newVal
                    dep.notify()
                }
            }
        })
    }
}

const CompileUtil = {
    // 根据表达式取到对应的数据
    getVal(vm, expr) {
        return expr.split('.').reduce((data, current) => {
            return data[current];
        }, vm.$data)
    },
    setValue(vm, expr, value) {
        return expr.split('.').reduce((data, current, index, arr) => {
            if (index == arr.length - 1) {
                return data[current] = value
            }
            return data[current];
        }, vm.$data)
    },
    model(node, expr, vm) { // node是节点 expr 是表达式 vm是当前实例 
        // 给输入框赋予value属性 node.value = xxx
        let fn = this.updater['modelUpdater']
        new Watcher(vm, expr, (newVal) => { // 给输入框加一个观察者，如果稍后数据更新了会触发此方法，会拿新增给输入框赋值
            fn(node, newVal)
        })
        node.addEventListener('input', (e) => {
            let value = e.target.value; // 获取用户输入的内容
            this.setValue(vm, expr, value)
        })
        let value = this.getVal(vm, expr)
        fn(node, value)
    },
    html(node,expr,vm) {
        let fn = this.updater['htmlUpdater'];
        new Watcher(vm, expr, (newVal) => { // 给输入框加一个观察者，如果稍后数据更新了会触发此方法，会拿新增给输入框赋值
            fn(node, newVal)
        })
        let value = this.getVal(vm, expr)
        fn(node, value)
    },
    getContentValue(vm, expr) {
        return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
            return this.getVal(vm, args[1]);
        })
    },
    on(node, expr, vm, eventName) {
        node.addEventListener(eventName, (e) => {
            vm[expr].call(vm, e)
        })
    },
    text(node, expr, vm) {
        let fn = this.updater['textUpdater'];
        let content = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
            new Watcher(vm, args[1], (newVal) => {
                fn(node, this.getContentValue(vm, expr));
            })
            return this.getVal(vm, args[1]);
        })
        fn(node, content)
    },
    updater: {
        htmlUpdater(node, value) {
            node.innerHTML = value;
        },
        modelUpdater(node, value) {
            node.value = value;
        },
        textUpdater(node, value) {
            node.textContent = value;
        }
    }
}


class Compiler {
    constructor(el, vm) {
        this.el = this.isRealElem(el) ? el : document.querySelector(el)
        this.vm = vm
        let fragment = this.node2fragment(this.el)
        this.compile(fragment)
        this.el.appendChild(fragment)
    }
    isDirective(attrName) {
        return attrName.startsWith('v-')
    }
    compileElement(node) {
        const attribute = node.attributes
        // console.log(attribute, 'compileElement')
        Array.from(attribute).forEach(attr => {
            const {
                name,
                value: expr
            } = attr
            if (this.isDirective(name)) {
                let [, directive] = name.split('-')
                let [directiveName, eventName] = directive.split(':')
                // 需要调用不同的指令来处理
                CompileUtil[directiveName](node, expr, this.vm, eventName);
            }
        })
    }
    compileText(node) {
        const content = node.textContent;
        if (/\{\{.+?\}\}/.test(content)) {
            // 文本节点
            CompileUtil['text'](node, content, this.vm)
        }
        // console.log(node, 'compileText')
    }
    isRealElem(elem) {
        return elem.nodeType === 1;
    }
    compile(node) {
        let childNodes = node.childNodes
        Array.from(childNodes).forEach(child => {
            // console.log(child, 'child')
            if (this.isRealElem(child)) {
                this.compileElement(child)
                this.compile(child)
            } else {
                this.compileText(child)
            }
        });
    }
    node2fragment(node) {
        // dom 的内存具有可移动性
        let fragment = document.createDocumentFragment()
        let firstChild
        while (firstChild = node.firstChild) {
            fragment.appendChild(firstChild)
        }
        return fragment
    }
}

class ATvue {
    constructor(options) {
        this.$el = options.el
        this.$data = options.data;
        let computed = options.computed;
        let methods = options.methods;
        if (this.$el) {
            // 把数据 全部转化为用Object.defineProperty来定义
            new Observer(this.$data)


            for (let key in computed) {
                Object.defineProperty(this.$data, key, {
                    get: () => {
                        return computed[key].call(this)
                    }
                })
            }

            for (let key in methods) {
                Object.defineProperty(this, key, {
                    get() {
                        return methods[key]
                    }
                })
            }
            // 把数据获取操作 vm上的取值操作 都代理到vm.$data
            this.proxyVm(this.$data)
        }
        // 把数据获取操作 vm上的取值操作 都代理到 vm.$data
        new Compiler(this.$el, this)
    }
    proxyVm(data) {
        for (let key in data) {
            Object.defineProperty(this, key, {
                get() {
                    return data[key];
                },
                set(newVal) {
                    data[key] = newVal;
                }
            })
        }
    }
}


export default ATvue