import CryptoJS from "crypto-js"

const SECRET_KEY = "hataoo_admin_secret_key";

if (!SECRET_KEY) {
  console.error("❌ SECRET_KEY is missing! Add VITE_SECRET_KEY in .env file.")
}

export const encryptData = (data: any): string => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString()
}

export const decryptData = (cipher: string): any => {
  const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY)
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
}