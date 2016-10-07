var http = require('http');
var path = require('path');
var winston = require('winston');
var aws = require('aws-sdk');
//
//
//
var bucket = process.env.AWS_S3_BUCKET;
var accessKey = process.env.AWS_ACCESS_KEY;
var secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

aws.config.update({
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey
});

var s3 = new aws.S3({params: {Bucket: bucket}});

function _proceedToStreamToHost(remoteImageSourceURL, destFilename, callback)
{
    var hostedFilePublicUrl = _hostedPublicUrlFrom(destFilename);
    winston.info("📡  Streaming " + remoteImageSourceURL + " -> " + hostedFilePublicUrl);
    //
    var request = http.get(remoteImageSourceURL, function(response) {
        var payload = {
            Key: destFilename,
            Body: response,
            ACL: 'public-read',
        };

        s3.upload(payload, function(err){
            if (err) {
                winston.error("❌  AWS S3 write stream error for remote img src url " + remoteImageSourceURL + " and dest filename " + destFilename, " err: " , err);
            }

            return callback(err, hostedFilePublicUrl);
        });
    }).on('error', function(err) {
        winston.error("❌  Could not read the remote image " + remoteImageSourceURL + ": " , err);
        return callback(err);
    });
}
//
//
function _dotPlusExtnameSansQueryParamsFrom(url)
{
    var regex = /[#\\?]/g;
    var extname = path.extname(url);
    var endOfExt = extname.search(regex);
    if (endOfExt > -1) {
        extname = extname.substring(0, endOfExt);
    }
    
    return extname;
}
//
//
function _hostedPublicUrlFrom(filename)
{
    return 'https://' + bucket + '.s3.amazonaws.com/' + filename;
}
//
//
module.exports.hostImageLocatedAtRemoteURL = function(remoteImageSourceURL, destinationFilenameSansExt, hostingOpts, callback)
{
    //
    var dotPlusExtname = _dotPlusExtnameSansQueryParamsFrom(remoteImageSourceURL);
    var finalizedFilenameWithExt = destinationFilenameSansExt + dotPlusExtname; // construct after extracting ext from image src url
    //
    var hostedFilePublicUrl = _hostedPublicUrlFrom(finalizedFilenameWithExt);
    //
    hostingOpts = hostingOpts || {};
    if (typeof hostingOpts.overwrite === 'undefined') {
        hostingOpts.overwrite = false;
    }
    if (hostingOpts.overwrite == true) { // overwrite if exists
        _proceedToStreamToHost(remoteImageSourceURL, finalizedFilenameWithExt, callback);
    } else {
        var params = {
            Bucket: bucket,
            Key: finalizedFilenameWithExt
        };
        try {
            s3.headObject(params, function (err, data) {
                if (!err) {
                    winston.info("💬  File already uploaded but overwrite:false for " + hostedFilePublicUrl);
                    return callback(null, hostedFilePublicUrl);
                }
                // if (err.code == 'NotFound')
                    _proceedToStreamToHost(remoteImageSourceURL, finalizedFilenameWithExt, callback);
            });
        } catch (err) {
            if (err.code == 'NotFound')
                _proceedToStreamToHost(remoteImageSourceURL, finalizedFilenameWithExt, callback);
        }
    }
}