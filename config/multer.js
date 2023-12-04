const multer = require('multer');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
      cb(null, req.user._id + '.' + file.mimetype.split('/').slice(-1).pop())
    }
})

module.exports = multer({storage});