/*jshint esversion: 9 */
const _d = {
    qs: function (s) {
        return document.querySelector(s);
    },
    qsa: function (s) {
        return document.querySelectorAll(s);
    },
    gei: function (s) {
        return document.getElementById(s);
    },
    gen: function (s) {
        return document.getElementsByName(s);
    },
    getn: function (s) {
        return document.getElementsByTagName(s);
    }
}

export default _d 