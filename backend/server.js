require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configure AWS S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.S3_BUCKET_NAME;

// Multer stores the file in memory before we push it to S3
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Cloud Gallery API is running' });
});

// Upload an image to S3
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const key = `uploads/${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    const url = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    res.status(201).json({ message: 'Upload successful', url, key });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// List all images in the bucket
app.get('/images', async (req, res) => {
  try {
    const data = await s3.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: 'uploads/' })
    );

    const images = (data.Contents || [])
      .sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified))
      .map((obj) => ({
        key: obj.Key,
        url: `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${obj.Key}`,
        lastModified: obj.LastModified,
      }));

    res.json({ images });
  } catch (err) {
    console.error('List error:', err);
    res.status(500).json({ error: 'Could not fetch images' });
  }
});

// Delete an image from S3
app.delete('/images/:key', async (req, res) => {
  try {
    const key = `uploads/${req.params.key}`;
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
