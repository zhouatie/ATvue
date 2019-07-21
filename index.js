import ATvue from './ATvue'

new ATvue({
    el: '#app',
    data: {
        school: {
            name: "珠峰",
            age: 10
        },
        message: '<h1>thsiis message</h1>'
    },
    computed: {
        getNewName() {
            return this.school.name + '架构'
        }
    },
    methods: {
        change() {
            this.message = `<h1>${Date.now()}</h1>`
        }
    }
})