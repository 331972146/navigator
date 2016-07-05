function isObjectEmpty (obj)
{
    for (var key in obj) {
        return false;
    }
    return true;
};
module.exports = isObjectEmpty;