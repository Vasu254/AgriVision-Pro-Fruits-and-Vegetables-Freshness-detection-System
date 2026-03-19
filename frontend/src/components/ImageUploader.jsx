import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FaCloudUploadAlt, FaImage } from "react-icons/fa";
import "./ImageUploader.css";

const ImageUploader = ({ onImageUpload }) => {
  const [preview, setPreview] = useState(null);

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        onImageUpload(file);
      }
    },
    [onImageUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".bmp", ".webp"],
    },
    multiple: false,
  });

  return (
    <div className="uploader-container">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? "drag-active" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="upload-content">
          <FaCloudUploadAlt className="upload-icon" />
          {isDragActive ? (
            <p className="upload-text">Drop the image here...</p>
          ) : (
            <>
              <p className="upload-text">
                Drag & drop an image here, or click to select
              </p>
              <p className="upload-hint">
                Supported formats: JPG, PNG, GIF, BMP, WEBP
              </p>
            </>
          )}
          <button className="upload-button" type="button">
            <FaImage /> Choose Image
          </button>
        </div>
      </div>

      <div className="features">
        <div className="feature">
          <div className="feature-icon">🍎</div>
          <h3>Fruits</h3>
          <p>Detect freshness of various fruits</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🥕</div>
          <h3>Vegetables</h3>
          <p>Check quality of vegetables</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🤖</div>
          <h3>AI Powered</h3>
          <p>Advanced deep learning model</p>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
