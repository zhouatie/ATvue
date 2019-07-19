export const deepCopy = (data) => JSON.parse(JSON.stringify(data))
export const isObject = (data) => /\sObject]/.test(Object.prototype.toString.call(data))
export const isFunction = (data) => /\sFunction]/.test(Object.prototype.toString.call(data))