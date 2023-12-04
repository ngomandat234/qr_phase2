require('dotenv').config()
const QRCode = require('qrcode')

module.exports = {
    generateTracking: async (user_id) =>{
        const APP_URL = process.env.URL || 'http://127.0.0.1'
        const text = `${APP_URL}/tracking/${user_id}`;
        return await QRCode.toDataURL(text)
    }
}