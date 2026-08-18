import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './index.css';

// Set this to your deployed backend URL (or http://localhost:5000 for local dev)
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AuroraField() {
  return (
    <div className="aurora-field" aria-hidden="true">
      <div className="aurora-blob one" />
      <div className="aurora-blob two" />
      <div className="aurora-blob three" />
    </div>
  );
}

function App() {
  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);

  const fetchImages = async () => {
    try {
      const res = await axios.get(`${API_BASE}/images`);
      setImages(res.data.images);
      setError('');
    } catch (err) {
      setError('Could not reach the API. Is the backend running on port 5000?');
    } finally {
      setLoadingImages(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const doUpload = async (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      setError('Only image files are supported.');
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);

    setUploading(true);
    setError('');
    try {
      await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFile(null);
      fetchImages();
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      doUpload(dropped);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current += 1;
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) setDragging(false);
  };

  const handleDelete = async (key) => {
    const filename = key.replace('uploads/', '');
    try {
      await axios.delete(`${API_BASE}/images/${filename}`);
      setImages((prev) => prev.filter((img) => img.key !== key));
    } catch (err) {
      setError('Delete failed.');
    }
  };

  return (
    <>
      <AuroraField />
      <div className="page">
        <header className="masthead">
          <div className="eyebrow">
            <span className="dot" />
            React &middot; Node.js &middot; AWS S3
          </div>
          <h1>Cloud Gallery</h1>
          <p className="subtitle">
            Drop an image in below — it streams straight to an S3 bucket and
            shows up in the grid the moment it lands.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className={`portal ${dragging ? 'dragging' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="portal-inner">
            <div className="portal-icon">☁️</div>
            <div className="portal-text">
              <strong>{dragging ? 'Drop it here' : 'Drag an image in, or browse'}</strong>
              <span>PNG, JPG, or GIF — up to 5MB</span>
              {file && <span className="file-chip">Selected: {file.name}</span>}
            </div>
            <label className="file-input-label">
              Choose file
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </label>
            <button type="submit" className="btn-upload" disabled={!file || uploading}>
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>

        {error && <p className="error-banner">{error}</p>}

        <h2 className="section-label">
          {images.length > 0 ? `${images.length} image${images.length === 1 ? '' : 's'} in the bucket` : 'Gallery'}
        </h2>

        {loadingImages ? (
          <div className="gallery">
            {[...Array(4)].map((_, i) => (
              <div className="skeleton" key={i} />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="empty-state">
            <span>🌤️</span>
            Nothing uploaded yet — drop an image above to get started.
          </div>
        ) : (
          <div className="gallery">
            {images.map((img, i) => (
              <div className="card" style={{ animationDelay: `${i * 40}ms` }} key={img.key}>
                <div className="card-media">
                  <img src={img.url} alt="Uploaded to gallery" loading="lazy" />
                  <div className="card-overlay">
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(img.key)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default App;
