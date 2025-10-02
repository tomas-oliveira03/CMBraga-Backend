import { envs } from '@/config'
import crypto from 'crypto'

class InformationHash {

	private key: string
	private encryptionIV: string

	constructor() {

		this.key = crypto
			.createHash('sha512')
			.update(envs.ENCRYPTION_SECRET_KEY)
			.digest('hex')
			.substring(0, 32)
		this.encryptionIV = crypto
			.createHash('sha512')
			.update(envs.ENCRYPTION_SECRET_IV)
			.digest('hex')
			.substring(0, 16)
	}


	encrypt(data: string) {
		const cipher = crypto.createCipheriv('aes-256-cbc', this.key, this.encryptionIV)
		return Buffer.from(
			cipher.update(data, 'utf8', 'hex') + cipher.final('hex')
		).toString('base64') // Encrypts data and converts to hex and base64
	}

	decrypt(data: string) {
		const buff = Buffer.from(data, 'base64')
		const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, this.encryptionIV)
		return (
			decipher.update(buff.toString('utf8'), 'hex', 'utf8') +
			decipher.final('utf8')
		) // Decrypts data and converts to utf8
	}
}

const informationHash = new InformationHash()
export default informationHash