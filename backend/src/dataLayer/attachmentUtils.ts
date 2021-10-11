import * as AWS from 'aws-sdk'
import * as createHttpError from 'http-errors';
import { createLogger } from '../utils/logger';
const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})
const s33 = new AWS.S3({
  signatureVersion: 'v4'
});
const attachmentBucketName = process.env.ATTACHMENT_S3_BUCKET;
const urlExpiration = +process.env.SIGNED_URL_EXPIRATION;
const logger = createLogger('attachmentUrils.ts');
// TODO: Implement the fileStogare logic

export class AttachmentUtils {
  getUploadUrl(todoId: string) {
    return s3.getSignedUrl('putObject', {
      Bucket: attachmentBucketName,
      Key: todoId,
      Expires: urlExpiration
    })
  }
  deleteAttachment(todoId: string) {
    return s33.deleteObject({
      Bucket: attachmentBucketName,
      Key: todoId
    }, (err, data) => {
      if (err) {
        createHttpError(500, "Attachment for todoId: " + todoId + " not deleted!");
        throw err;
      } else if (data) {
        logger.info("Deleted S3 object", data);
      }
    })
  }
}
