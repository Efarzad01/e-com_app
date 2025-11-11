import { hashPassword, comparePassword, generateSecureToken, encrypt, decrypt } from '../encryption';

describe('Encryption Utils', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hashed = await hashPassword(password);
      const isValid = await comparePassword(password, hashed);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashed = await hashPassword(password);
      const isValid = await comparePassword(wrongPassword, hashed);

      expect(isValid).toBe(false);
    });
  });

  describe('Secure Token Generation', () => {
    it('should generate a secure token', () => {
      const token = generateSecureToken();

      expect(token).toBeDefined();
      expect(token.length).toBe(64); // 32 bytes = 64 hex characters
    });

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();

      expect(token1).not.toBe(token2);
    });

    it('should generate hexadecimal tokens', () => {
      const token = generateSecureToken();
      const hexRegex = /^[0-9a-f]+$/i;

      expect(hexRegex.test(token)).toBe(true);
    });
  });

  describe('AES-256-GCM Encryption', () => {
    // Mock encryption key for testing
    beforeAll(() => {
      process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    });

    it('should encrypt and decrypt data correctly', () => {
      const plaintext = 'sensitive-data-12345';
      const { encrypted, iv, tag } = encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(iv).toBeDefined();
      expect(tag).toBeDefined();

      const decrypted = decrypt(encrypted, iv, tag);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different encrypted output for same input', () => {
      const plaintext = 'sensitive-data-12345';
      const result1 = encrypt(plaintext);
      const result2 = encrypt(plaintext);

      // Different IVs should produce different encrypted output
      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.iv).not.toBe(result2.iv);
    });

    it('should fail decryption with wrong IV', () => {
      const plaintext = 'sensitive-data-12345';
      const { encrypted, iv, tag } = encrypt(plaintext);
      const wrongIv = generateSecureToken().substring(0, 32);

      expect(() => {
        decrypt(encrypted, wrongIv, tag);
      }).toThrow();
    });

    it('should fail decryption with wrong tag', () => {
      const plaintext = 'sensitive-data-12345';
      const { encrypted, iv, tag } = encrypt(plaintext);
      const wrongTag = generateSecureToken().substring(0, 32);

      expect(() => {
        decrypt(encrypted, iv, wrongTag);
      }).toThrow();
    });

    it('should encrypt and decrypt long strings', () => {
      const plaintext = 'a'.repeat(1000);
      const { encrypted, iv, tag } = encrypt(plaintext);
      const decrypted = decrypt(encrypted, iv, tag);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt special characters', () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;:",.<>?/~`';
      const { encrypted, iv, tag } = encrypt(plaintext);
      const decrypted = decrypt(encrypted, iv, tag);

      expect(decrypted).toBe(plaintext);
    });
  });
});
