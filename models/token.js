var cryptojs = require('crypto-js');
var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;

var TokenSchema = new Schema({
    tokenHash: { type: String, required: true, index: { unique: true } },
    createDate: {type: Date, default: Date.now}
});

TokenSchema.methods.hasExpired = function(){
    var now = new Date();
    return (now - createDate) > 7; //token is a week old
};


//Token Encrypt
TokenSchema.pre('save', function(next) {
    var token = this;

    // only hash the password if it has been modified (or is new)
    if (!token.isModified('tokenHash')) return next();

		var hash = cryptojs.MD5(token.tokenHash).toString();
        token.tokenHash = hash;
        next();
});



module.exports = mongoose.model('Token', TokenSchema);