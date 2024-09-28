import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [encryptedContent, setEncryptedContent] = useState('');
  const [decryptedContent, setDecryptedContent] = useState('');
  const [encryptedFileUrl, setEncryptedFileUrl] = useState('');
  const [uploadedEncryptedFile, setUploadedEncryptedFile] = useState(null);
  const [ivForDecryption, setIvForDecryption] = useState('');

  // Handle normal file upload
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Upload the file and get encrypted data
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Encrypted data:', response.data.encryptedData);
      setEncryptedContent(response.data.encryptedData);
      setEncryptedFileUrl(response.data.fileUrl);

      // Store the IV for future decryption
      setIvForDecryption(response.data.iv);
    } catch (error) {
      console.error('File upload error:', error);
    }
  };

  // Handle encrypted file upload for decryption
  const handleEncryptedFileChange = (event) => {
    setUploadedEncryptedFile(event.target.files[0]);
  };

  const handleEncryptedFileUpload = async () => {
    if (!uploadedEncryptedFile || !ivForDecryption) {
      alert('Please upload an encrypted file and provide the IV');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadedEncryptedFile);
    formData.append('iv', ivForDecryption);

    try {
      // Upload the encrypted file and get decrypted data
      const response = await axios.post('http://localhost:5000/decrypt-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Decrypted data:', response.data.decryptedData);
      setDecryptedContent(response.data.decryptedData);
    } catch (error) {
      console.error('Encrypted file upload error:', error);
    }
  };

  return (
    <div className="App">
      <h1>File Encryption and Decryption</h1>

      <div className="file-upload">
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleFileUpload}>Upload and Encrypt</button>
      </div>

      {encryptedContent && (
        <div className="result">
          <h2>Encrypted Content:</h2>
          <textarea value={encryptedContent} readOnly />
          <br/>
          <a href={encryptedFileUrl} download>Download Encrypted File</a>
        </div>
      )}

      <h2>Upload Encrypted File for Decryption</h2>
      <div className="file-upload">
        <input type="file" onChange={handleEncryptedFileChange} />
        <button onClick={handleEncryptedFileUpload}>Upload and Decrypt</button>
      </div>

      {decryptedContent && (
        <div className="result">
          <h2>Decrypted Content:</h2>
          <textarea value={decryptedContent} readOnly />
        </div>
      )}
    </div>
  );
}

export default App;
