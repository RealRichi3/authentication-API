const { format, compareAsc } = require('date-fns');


class CustomDate {
    constructor(date) {
        this.date = date;
    }
    format () {
        return format(new Date(this.date), 'yyyy-MM-dd')
    }
}

module.exports = {
    CustomDate
}