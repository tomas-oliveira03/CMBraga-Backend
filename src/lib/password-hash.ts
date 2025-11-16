import bcrypt from 'bcryptjs';

class SecurePasswordHash {
    private readonly saltRounds = 12; 

    /**
     * Hash a plain text password
     */
    async hash(password: string): Promise<string> {
        return bcrypt.hash(password, this.saltRounds);
    }

    /**
     * Verify a plain text password against a hash
     */
    async verify(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

}

export default new SecurePasswordHash();
