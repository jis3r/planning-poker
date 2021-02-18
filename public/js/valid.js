var obj = {
    isValid: false
}

function setValid(value) {
    obj.isValid = value;
    Object.freeze(obj);
    console.log('global valid', obj.isValid);
}

module.exports = {
    setValid,
    obj
};