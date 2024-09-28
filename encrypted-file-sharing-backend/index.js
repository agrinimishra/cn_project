const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });
const port = 5000;

app.use(cors());
app.use(express.json());

// Encryption settings
const algorithm = 'aes-256-ctr';
const secretKey = crypto.randomBytes(32); // Use a secure random key
const iv = crypto.randomBytes(16); // Initialization vector

// Encrypt function using createCipheriv
function encrypt(text) {
    try {
        const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return { encryptedData: encrypted, iv: iv.toString('hex') };
    } catch (err) {
        console.error('Encryption error:', err);
        throw new Error('Encryption failed');
    }
}

// Decrypt function using createDecipheriv
function decrypt(encryptedData, iv) {
    try {
        const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(iv, 'hex'));
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        console.error('Decryption error:', err);
        throw new Error('Decryption failed');
    }
}

// Serve static files from the "uploads" folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload endpoint (Encrypt the file)
app.post('/upload', upload.single('file'), (req, res) => {
    const filePath = req.file.path;

    // Read the file
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('File reading error:', err);
            return res.status(500).send('File reading error');
        }

        console.log('File data before encryption:', data);

        // Encrypt the file data
        try {
            const { encryptedData, iv } = encrypt(data);
            console.log('Encrypted data:', encryptedData);

            // Save encrypted data to a new file
            const encryptedFilePath = path.join(__dirname, 'uploads', `${req.file.filename}.enc`);
            fs.writeFile(encryptedFilePath, encryptedData, (err) => {
                if (err) {
                    console.error('Error writing encrypted file:', err);
                    return res.status(500).send('Error saving encrypted file');
                }

                // Return the URL of the encrypted file
                const fileUrl = `http://localhost:5000/uploads/${req.file.filename}.enc`;
                res.json({ encryptedData, iv, fileUrl });
            });
        } catch (encryptionError) {
            console.error('Encryption process failed:', encryptionError);
            res.status(500).send('Encryption error');
        }
    });
});

// Decrypt an encrypted file
app.post('/decrypt-file', upload.single('file'), (req, res) => {
    const filePath = req.file.path;

    // Read the encrypted file
    fs.readFile(filePath, 'utf8', (err, encryptedData) => {
        if (err) {
            console.error('File reading error:', err);
            return res.status(500).send('File reading error');
        }

        const iv = req.body.iv; // The IV should be sent with the file

        // Decrypt the file data
        try {
            const decryptedData = decrypt(encryptedData, iv);
            console.log('Decrypted data:', decryptedData);

            res.json({ decryptedData });
        } catch (err) {
            console.error('Decryption process failed:', err);
            res.status(500).send('Decryption error');
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
