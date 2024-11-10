const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const mime = require('mime-types');
const app = express();
const uploadDir = './uploads';

// Ensure the uploads directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const randomString = crypto.randomBytes(8).toString('hex'); // Random string
        const fileExtension = path.extname(file.originalname); // File extension
        cb(null, randomString + fileExtension); // Save with random number in front
    }
});

const upload = multer({ storage: storage });

// Serve static files in the uploads directory
app.use('/uploads', express.static(uploadDir));

// Route to upload files
app.post('/upload', upload.single('file'), (req, res) => {
    if (req.file) {
        const fileData = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            uploadDate: new Date().toLocaleString(),
            category: mime.lookup(req.file.originalname).split('/')[0], // Assign category based on mime type
        };
        // Save the file data (this is a placeholder for a real database)
        fs.appendFileSync('files.json', JSON.stringify(fileData) + '\n');
        res.json({ success: true, file: fileData });
    } else {
        res.status(400).json({ success: false, message: 'No file uploaded' });
    }
});

// Route to get the list of uploaded files
app.get('/files', (req, res) => {
    fs.readFile('files.json', (err, data) => {
        if (err) return res.status(500).json({ success: false, message: 'Error reading files' });
        const files = data.toString().split('\n').map(line => JSON.parse(line)).filter(file => file);
        res.json(files);
    });
});

// Route to get a specific file's details
app.get('/file/:filename', (req, res) => {
    const filename = req.params.filename;
    fs.readFile('files.json', (err, data) => {
        if (err) return res.status(500).json({ success: false, message: 'Error reading file' });
        const files = data.toString().split('\n').map(line => JSON.parse(line)).filter(file => file);
        const file = files.find(f => f.filename === filename);
        if (file) {
            res.json(file);
        } else {
            res.status(404).json({ success: false, message: 'File not found' });
        }
    });
});

// Route to delete a file
app.delete('/delete/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to delete file' });
        }
        fs.readFile('files.json', (err, data) => {
            if (err) return res.status(500).json({ success: false, message: 'Error reading files' });
            let files = data.toString().split('\n').map(line => JSON.parse(line)).filter(file => file);
            files = files.filter(f => f.filename !== filename);
            fs.writeFileSync('files.json', files.map(file => JSON.stringify(file)).join('\n'));
            res.json({ success: true, message: 'File deleted successfully' });
        });
    });
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
