const UploadClient = require('@uploadcare/upload-client').default
const axios = require('axios').default

module.exports = {
  init(config) {
    const client = new UploadClient({publicKey: config.public_key})
    const publicKey = config.public_key
    const secretKey = config.secret_key
    const baseCDN = config.base_cdn || 'https://ucarecdn.com'

    return {
      upload: async (file, customConfig = {}) => {
        try {
          const image = await client.uploadFile(file.buffer, {fileName: file.name, baseCDN: baseCDN,})

          file.url = image.cdnUrl

          file.provider_metadata = {
            uuid: image.uuid,
            original_filename: image.originalFilename,
            image_info: image.imageInfo,
          }
          return file
        } catch (err) {
          if (err.message.includes('File size too large')) {
            throw strapi.errors.entityTooLarge()
          }
          throw strapi.errors.unknownError(`Error uploading to uploadcare: ${err.message}`)
        }
      },
      delete: async (file) => {
        const uuid = file.provider_metadata.uuid
        if (uuid && secretKey) {
          try {
            await axios.delete(`https://api.uploadcare.com/files/${uuid}/`, {
              headers: {
                'Authorization': `Uploadcare.Simple ${publicKey}:${secretKey}`
              }
            })
            return file
          } catch (err) {
            throw strapi.errors.unknownError(`Error delete file : ${err.message}`)
          }
        } else {
          throw strapi.errors.unknownError(`Error delete file`)
        }
      },
    }
  },
}
