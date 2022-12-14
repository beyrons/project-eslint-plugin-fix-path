// Если путь начинается с указанных шаблонов, то мы считаем, что путь относительный
function isPathRelative(path) {
    return path === '.' || path.startsWith('./') || path.startsWith('../')
}

module.exports = {
    isPathRelative,
}
