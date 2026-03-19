# 🍎🥕 Fruits & Vegetables Freshness Detection System

## 🔷 Architecture (at a glance)

This project is a simple, fast three-layer web app:

- Frontend: React + Vite SPA running on http://localhost:5173. Users upload an image and see prediction results with confidence and recommendations.
- Backend API: Flask server on http://localhost:5000. It receives image files, preprocesses them, calls the ML model, and returns JSON.
- ML Model: A TensorFlow/Keras MobileNetV2-based classifier saved as `ml-model/models/freshness_detector.h5`. The backend loads this model in memory for inference.

Request flow:

1. User uploads an image in the browser → 2) Frontend sends multipart/form-data to POST /predict → 3) Flask preprocesses the image (RGB, 224×224, normalize) → 4) TensorFlow model outputs probabilities → 5) API returns JSON with class, confidence, and a recommendation.

## 🧰 Tools and libraries

### Backend (Flask API)

- Framework: Flask 3.0.0 with flask-cors 4.0.0
- Inference stack: TensorFlow 2.15.0, NumPy 1.24.x, Pillow 10.x
- Endpoints: `/` (info), `/health` (status), `/predict` (single image), `/batch-predict` (multiple images)
- Model assets: `ml-model/models/freshness_detector.h5`, `class_indices.json`
- Notes: Training scripts in `ml-model` target TensorFlow >= 2.20.0; backend pins TF 2.15.0 for portability on more systems.

### Frontend (React app)

- Framework: React 19 with Vite (rolldown-vite 7.1.x)
- UI helpers: react-dropzone (drag & drop), react-icons
- Networking: axios for API calls
- Dev tooling: ESLint 9, @vitejs/plugin-react
- Dev server: http://localhost:5173 (configured in `frontend/vite.config.js`)

### ML & data (training scripts)

- TensorFlow/Keras (>= 2.20), scikit-learn, OpenCV, albumentations, matplotlib, tqdm
- Dataset tools: kaggle/kagglehub (optional), custom scripts: `dataset_downloader.py`, `data_augmentation.py`, `train_model.py`/`train_model_fast.py`

---

# Fruits & Vegetables Freshness Detection System

[![Python](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/)A complete AI-powered web application for detecting the freshness of fruits and vegetables using deep learning.

[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.20-orange.svg)](https://www.tensorflow.org/)

[![React](https://img.shields.io/badge/React-19.1.1-61dafb.svg)](https://reactjs.org/)## 🌟 Features

[![Flask](https://img.shields.io/badge/Flask-3.0.0-000000.svg)](https://flask.palletsprojects.com/)

[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)- **AI-Powered Detection**: Uses MobileNetV2 transfer learning model

- **500+ Images Dataset**: Trained on extensive fruit and vegetable images

## 📋 Table of Contents- **Real-time Predictions**: Instant freshness analysis

- [About the Project](#about-the-project)- **Beautiful UI**: Modern React interface with Vite

- [Key Features](#key-features)- **High Accuracy**: Transfer learning with fine-tuning

- [Use Cases](#use-cases)- **Confidence Scores**: Detailed prediction confidence levels

- [Tech Stack](#tech-stack)- **Responsive Design**: Works on desktop and mobile devices

- [Dataset Information](#dataset-information)

- [Project Architecture](#project-architecture)## 📁 Project Structure

- [Installation & Setup](#installation--setup)

- [How to Run](#how-to-run)```

- [Model Performance](#model-performance)two/

- [Project Structure](#project-structure)├── ml-model/ # Machine Learning Model

- [API Documentation](#api-documentation)│ ├── dataset_downloader.py # Download datasets from Kaggle

- [Future Enhancements](#future-enhancements)│ ├── data_augmentation.py # Augment data to 500+ images

- [Contributing](#contributing)│ ├── train_model.py # Train the CNN model

- [License](#license)│ ├── requirements.txt # Python dependencies

│ └── models/ # Saved trained models

---│

├── datasets/ # Training Data

## 🎯 About the Project│ ├── fruits/

│ │ ├── fresh/

The **Fruits & Vegetables Freshness Detection System** is an AI-powered web application that automatically classifies fruits and vegetables as **fresh** or **rotten** using deep learning. This system helps reduce food waste, improve quality control, and assist in making informed purchasing decisions.│ │ └── rotten/

│ └── vegetables/

### 🌟 Key Features│ ├── fresh/

│ └── rotten/

✅ **High Accuracy Classification** - 95.83% validation accuracy using MobileNetV2 architecture │

✅ **Large-Scale Dataset** - Trained on 57,754 images (far exceeding initial 1000+ target) ├── backend/ # Flask API Server

✅ **Real-Time Predictions** - Instant classification with confidence scores │ ├── app.py # Main Flask application

✅ **User-Friendly Interface** - Drag-and-drop image upload with beautiful React UI │ └── requirements.txt # Backend dependencies

✅ **RESTful API** - Flask backend for easy integration with other systems │

✅ **Batch Processing** - Support for multiple image predictions └── frontend/ # React Frontend

✅ **Storage Recommendations** - Provides actionable advice based on freshness level ├── src/

✅ **Cross-Platform** - Works on Windows, Mac, and Linux │ ├── components/ # React components

    │   ├── App.jsx       # Main app component

### 💡 Use Cases │ └── index.css # Global styles

    ├── package.json

🏪 **Retail & Grocery Stores** └── vite.config.js

- Automated quality control during receiving and stocking```

- Reduce spoilage and improve inventory management

- Customer self-service freshness checking## 🚀 Setup Instructions

🍽️ **Restaurants & Food Service**### Prerequisites

- Ingredient quality verification before cooking

- Reduce food waste and cost- Python 3.8 or higher

- Maintain consistent food quality standards- Node.js 16 or higher

- npm or yarn

🏭 **Agriculture & Supply Chain**- Git (optional, for version control)

- Post-harvest quality assessment

- Optimize storage and transportation### Step 1: Setup Python Environment

- Reduce losses in the supply chain

````bash

🏠 **Home & Personal Use**# Navigate to ml-model directory

- Check produce freshness before purchasecd ml-model

- Reduce household food waste

- Make informed storage decisions# Create virtual environment (recommended)

python -m venv venv

📊 **Research & Education**

- Food science research# Activate virtual environment

- Computer vision learning projects# On Windows:

- Agricultural technology demonstrationsvenv\Scripts\activate

# On Linux/Mac:

---source venv/bin/activate



## 🛠️ Tech Stack# Install dependencies

pip install -r requirements.txt

### **Machine Learning & AI**```

- **TensorFlow 2.20.0** - Deep learning framework

- **Keras** - High-level neural networks API### Step 2: Download and Prepare Dataset

- **MobileNetV2** - Transfer learning base model (ImageNet pre-trained)

- **OpenCV** - Image processing```bash

- **NumPy** - Numerical computations# Still in ml-model directory

- **scikit-learn** - Model evaluation metrics

# Option 1: Download from Kaggle (requires Kaggle API)

### **Backend**# First, set up Kaggle API credentials:

- **Flask 3.0.0** - RESTful API server# 1. Go to https://www.kaggle.com/account

- **Flask-CORS** - Cross-origin resource sharing# 2. Click "Create New API Token"

- **Pillow (PIL)** - Image handling# 3. Save kaggle.json to ~/.kaggle/ directory

- **Python 3.13** - Core programming languagepython dataset_downloader.py



### **Frontend**# Option 2: Use your own dataset

- **React 19.1.1** - UI framework# Organize images in this structure:

- **Vite 7.1.14** - Build tool and dev server# datasets/

- **Axios** - HTTP client for API calls#   ├── fruits/fresh/

- **React Dropzone** - Drag-and-drop file upload#   ├── fruits/rotten/

- **React Icons** - Icon library#   ├── vegetables/fresh/

- **CSS3** - Modern styling with gradients and animations#   └── vegetables/rotten/



### **Data & Tools**# Augment data to reach 500+ images per category

- **Kagglehub** - Dataset download and managementpython data_augmentation.py

- **Matplotlib** - Data visualization```

- **tqdm** - Progress bars for training

### Step 3: Train the Model

---

```bash

## 📊 Dataset Information# Train the model (this may take 30-60 minutes)

python train_model.py

### **Source**

- **Kaggle Dataset**: [Fruit Quality Classification Dataset](https://www.kaggle.com/datasets/zlatan599/fruitquality1)# The model will be saved in ml-model/models/

- **Dataset ID**: `zlatan599/fruitquality1`# - freshness_detector.h5

- **Size**: 4.77 GB# - class_indices.json

- **Total Images**: 57,754```



### **Dataset Distribution**### Step 4: Setup Backend Server



| Category | Subcategory | Images | Percentage |```bash

|----------|-------------|--------|------------|# Navigate to backend directory

| 🍎 Fruits | Fresh | 21,056 | 36.5% |cd ../backend

| 🍎 Fruits | Rotten | 24,702 | 42.8% |

| 🥕 Vegetables | Fresh | 6,112 | 10.6% |# Install dependencies

| 🥕 Vegetables | Rotten | 5,884 | 10.2% |pip install -r requirements.txt

| **Total** | - | **57,754** | **100%** |

# Start the Flask server

### **Data Split**python app.py

- **Training Set**: 23,103 images (80%)

- **Validation Set**: 5,774 images (20%)# Server will run on http://localhost:5000

- **Test Set**: Reserved from validation for final evaluation```



### **Included Produce Types**### Step 5: Setup Frontend

**Fruits**: Apples, Bananas, Oranges, Strawberries, Grapes, Mangoes, Watermelons, etc.

**Vegetables**: Tomatoes, Cucumbers, Peppers, Carrots, Potatoes, Onions, etc.```bash

# Open a new terminal

---# Navigate to frontend directory

cd frontend

## 🏗️ Project Architecture

# Install dependencies

```npm install

┌─────────────────┐

│   React UI      │  ← User uploads image# Start development server

│  (Port 5173)    │npm run dev

└────────┬────────┘

         │ HTTP Request (image file)# Frontend will run on http://localhost:3000

         ↓```

┌─────────────────┐

│  Flask API      │  ← Receives image## 🎯 Usage

│  (Port 5000)    │

└────────┬────────┘1. **Start Backend Server**:

         │ Load & Preprocess

         ↓   ```bash

┌─────────────────┐   cd backend

│  MobileNetV2    │  ← Deep Learning Model   python app.py

│  CNN Model      │     (freshness_detector.h5)   ```

└────────┬────────┘

         │ Prediction (Fresh/Rotten + Confidence)2. **Start Frontend** (in a new terminal):

         ↓

┌─────────────────┐   ```bash

│  JSON Response  │  ← Returns classification   cd frontend

│  to Frontend    │   npm run dev

└─────────────────┘   ```

````

3. **Open Browser**:

### **Model Architecture** - Navigate to `http://localhost:3000`

- Upload an image of a fruit or vegetable

````- Get instant freshness prediction!

Input Image (224x224x3)

         ↓## 📊 Model Details

MobileNetV2 Base (Pre-trained on ImageNet)

         ↓### Architecture

Global Average Pooling 2D

         ↓- **Base Model**: MobileNetV2 (pre-trained on ImageNet)

Dropout (0.2)- **Input Size**: 224x224x3

         ↓- **Custom Layers**:

Dense Layer (128 neurons, ReLU)  - GlobalAveragePooling2D

         ↓  - Dense(256, relu) + Dropout(0.3)

Output Layer (2 classes, Softmax)  - Dense(128, relu) + Dropout(0.3)

         ↓  - Dense(classes, softmax)

[Fresh, Rotten] Probabilities

```### Training Strategy



---1. **Initial Training**: Frozen base model (20 epochs)

2. **Fine-tuning**: Unfroze top layers (10 epochs)

## 📥 Installation & Setup3. **Optimization**: Adam optimizer with learning rate scheduling

4. **Data Augmentation**: Rotation, flip, brightness, contrast

### **Prerequisites**

- Python 3.13 or higher### Dataset

- Node.js 16+ and npm

- Git- **Fruits Fresh**: 500+ images

- 8GB+ RAM recommended- **Fruits Rotten**: 500+ images

- GPU (optional, for faster training)- **Vegetables Fresh**: 500+ images

- **Vegetables Rotten**: 500+ images

### **Step 1: Clone the Repository**- **Total**: 2000+ images



```bash## 🔧 Configuration

git clone <your-repository-url>

cd two### Backend Configuration (backend/app.py)

````

````python

### **Step 2: Set Up Python Environment**# Model path

MODEL_PATH = '../ml-model/models/freshness_detector.h5'

```bash

# Create virtual environment (optional but recommended)# Server settings

python -m venv venvHOST = '0.0.0.0'

source venv/bin/activate  # On Windows: venv\Scripts\activatePORT = 5000

````

# Install Python dependencies

pip install tensorflow numpy matplotlib Pillow opencv-python tqdm scikit-learn flask flask-cors kagglehub### Frontend Configuration (frontend/vite.config.js)

````

```javascript

### **Step 3: Download Dataset**server: {

  port: 3000,

```bash  proxy: {

cd ml-model    '/api': 'http://localhost:5000'

python download_kaggle_dataset.py  }

```}

````

This will automatically:

- Download the Kaggle dataset (4.77 GB)## 📡 API Endpoints

- Organize 57,754 images into proper folder structure

- Verify data integrity### GET /

### **Step 4: Train the Model** (Optional - Pre-trained model included)- Home endpoint

- Returns API information

```bash

python train_model_fast.py### GET /health

```

- Health check endpoint

Training details:- Returns model loading status

- **Duration**: ~15-20 minutes

- **Epochs**: 5### POST /predict

- **Batch Size**: 64

- **Output**: `models/freshness_detector.h5` (trained model)- Main prediction endpoint

- **Input**: Image file (multipart/form-data)

### **Step 5: Set Up Frontend**- **Output**: JSON with prediction results

`bash`json

cd ../frontend{

npm install "prediction": "fresh",

````"confidence": 0.95,

  "is_fresh": true,

---  "recommendation": "The produce is fresh and good to consume!",

  "all_predictions": {

## 🚀 How to Run    "fresh": 0.95,

    "rotten": 0.05

### **Complete Application Setup**  }

}

**Terminal 1 - Start Backend Server:**```

```bash

cd backend### POST /batch-predict

python app.py

```- Batch prediction endpoint

✅ Server runs at: `http://localhost:5000`- **Input**: Multiple image files

- **Output**: Array of prediction results

**Terminal 2 - Start Frontend:**

```bash## 🛠️ Troubleshooting

cd frontend

npm run dev### Model Not Loading

````

✅ Application runs at: `http://localhost:5173`- Ensure model is trained and saved in `ml-model/models/`

- Check file paths in `backend/app.py`

**Terminal 3 - Check Dataset Status (Optional):**

````bash### Backend Connection Error

cd ml-model

python check_status.py- Verify backend server is running on port 5000

```- Check CORS settings if accessing from different origin



### **Using the Application**### Dataset Download Issues



1. **Open your browser** → `http://localhost:5173`- Ensure Kaggle API credentials are properly configured

2. **Upload an image**:- Manually download datasets if Kaggle API fails

   - Click "Browse" or drag & drop

   - Select a fruit/vegetable image (JPG, PNG, JPEG)### Memory Issues During Training

3. **View Results**:

   - Classification (Fresh/Rotten)- Reduce batch size in `train_model.py`

   - Confidence score (%)- Use smaller image size (e.g., 128x128)

   - Storage recommendations

## 🎨 Customization

### **API Testing with cURL**

### Adding New Categories

```bash

# Health check1. Update dataset structure

curl http://localhost:5000/health2. Retrain model with new categories

3. Update frontend UI to reflect new categories

# Predict single image

curl -X POST -F "image=@path/to/your/image.jpg" http://localhost:5000/predict### Changing Model Architecture



# Batch prediction- Edit `build_model()` in `train_model.py`

curl -X POST -F "images=@image1.jpg" -F "images=@image2.jpg" http://localhost:5000/batch-predict- Try different pre-trained models (ResNet, EfficientNet, etc.)

````

### UI Customization

---

- Modify CSS files in `frontend/src/components/`

## 📈 Model Performance- Update color schemes in CSS variables

### **Training Results**## 📈 Performance Optimization

| Metric | Training | Validation |### Model Optimization

|--------|----------|------------|

| **Accuracy** | 99.03% | **95.83%** |- Use TensorFlow Lite for mobile deployment

| **Loss** | 0.0247 | 0.1972 |- Quantize model for faster inference

| **Precision** | 99.03% | ~95% |- Use model pruning to reduce size

| **Recall** | 99.03% | ~95% |

### Backend Optimization

### **Training Progress**

- Use Gunicorn for production deployment

````- Implement caching for frequent predictions

Epoch 1/5 - Accuracy: 95.23% | Val Accuracy: 91.83%- Add request queuing for high traffic

Epoch 2/5 - Accuracy: 98.04% | Val Accuracy: 92.73%

Epoch 3/5 - Accuracy: 98.61% | Val Accuracy: 94.87%### Frontend Optimization

Epoch 4/5 - Accuracy: 99.03% | Val Accuracy: 95.51%

Epoch 5/5 - Accuracy: 99.03% | Val Accuracy: 95.83% ✓- Implement image compression before upload

```- Add Progressive Web App (PWA) features

- Use lazy loading for components

### **Model Specifications**

- **Architecture**: MobileNetV2 + Custom Classifier## 🚢 Deployment

- **Input Size**: 224x224x3 RGB

- **Parameters**: ~2.5M trainable parameters### Deploy Backend (Heroku Example)

- **Model Size**: ~25 MB

- **Inference Time**: ~100-200ms per image (CPU)```bash

- **Framework**: TensorFlow/Keras# Create Procfile

echo "web: gunicorn app:app" > backend/Procfile

---

# Deploy

## 📁 Project Structurecd backend

git init

```heroku create your-app-name

two/git push heroku main

├── backend/                    # Flask REST API Server```

│   ├── app.py                 # Main Flask application

│   └── requirements.txt       # Python dependencies### Deploy Frontend (Vercel Example)

│

├── frontend/                   # React Web Application```bash

│   ├── src/cd frontend

│   │   ├── components/        # React componentsnpm run build

│   │   │   ├── Header.jsxvercel --prod

│   │   │   ├── ImageUploader.jsx```

│   │   │   ├── PredictionResult.jsx

│   │   │   └── LoadingSpinner.jsx## 📝 License

│   │   ├── App.jsx            # Main React app

│   │   ├── App.css            # StylesThis project is open source and available under the MIT License.

│   │   └── main.jsx           # Entry point

│   ├── index.html## 🤝 Contributing

│   ├── package.json

│   └── vite.config.jsContributions are welcome! Please feel free to submit a Pull Request.

│

├── ml-model/                   # Machine Learning Components## 📧 Contact

│   ├── models/                # Trained models

│   │   ├── freshness_detector.h5For questions or support, please open an issue in the repository.

│   │   └── class_indices.json

│   ├── train_model.py         # Original training script## 🙏 Acknowledgments

│   ├── train_model_fast.py    # Optimized training script

│   ├── download_kaggle_dataset.py  # Dataset downloader- TensorFlow team for the amazing framework

│   ├── check_status.py        # Dataset status checker- Kaggle for providing datasets

│   ├── create_dataset_csv.py  # CSV metadata generator- React and Vite communities for excellent tools

│   └── requirements.txt       # ML dependencies

│---

├── datasets/                   # Image dataset (57,754 images)

│   ├── fruits/**Made with ❤️ for Final Year Project**

│   │   ├── fresh/            # 21,056 fresh fruit images
│   │   └── rotten/           # 24,702 rotten fruit images
│   └── vegetables/
│       ├── fresh/            # 6,112 fresh vegetable images
│       └── rotten/           # 5,884 rotten vegetable images
│
└── README.md                  # This file
````

---

## 🔌 API Documentation

### **Base URL**: `http://localhost:5000`

### **Endpoints**

#### 1. Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "healthy",
  "model_loaded": true,
  "timestamp": "2025-10-31T06:45:00Z"
}
```

#### 2. Single Image Prediction

```http
POST /predict
Content-Type: multipart/form-data
```

**Request:**

```
Form Data:
  image: <file> (JPG, PNG, JPEG)
```

**Response:**

```json
{
  "success": true,
  "prediction": {
    "class": "fruits",
    "subclass": "fresh",
    "confidence": 0.9583,
    "probabilities": {
      "fruits": 0.9583,
      "vegetables": 0.0417
    }
  },
  "recommendations": {
    "storage": "Store in refrigerator",
    "shelf_life": "3-5 days",
    "quality": "Excellent"
  }
}
```

#### 3. Batch Prediction

```http
POST /batch-predict
Content-Type: multipart/form-data
```

**Request:**

```
Form Data:
  images: <file[]> (multiple files)
```

**Response:**

```json
{
  "success": true,
  "results": [
    {
      "filename": "apple.jpg",
      "prediction": { ... }
    },
    {
      "filename": "tomato.jpg",
      "prediction": { ... }
    }
  ],
  "total_processed": 2
}
```

### **Error Responses**

```json
{
  "success": false,
  "error": "No image provided",
  "code": 400
}
```

---

## 🚀 Future Enhancements

### **Phase 1 - Model Improvements**

- [ ] Multi-class classification (specific fruit/vegetable types)
- [ ] Ripeness level prediction (unripe, ripe, overripe)
- [ ] Defect detection (bruises, mold, discoloration)
- [ ] Nutritional value estimation

### **Phase 2 - Features**

- [ ] Mobile application (React Native)
- [ ] Real-time video stream processing
- [ ] Barcode/QR code integration
- [ ] Historical tracking and analytics
- [ ] Export reports (PDF, CSV)

### **Phase 3 - Integration**

- [ ] Cloud deployment (AWS, Azure, GCP)
- [ ] Database integration (PostgreSQL, MongoDB)
- [ ] User authentication & authorization
- [ ] Multi-language support
- [ ] API rate limiting & caching

### **Phase 4 - Advanced AI**

- [ ] Object detection for multiple items
- [ ] Shelf-life prediction using time-series
- [ ] Price estimation based on quality
- [ ] Recommendation system for recipes

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### **Development Guidelines**

- Follow PEP 8 for Python code
- Use ESLint for JavaScript/React code
- Write meaningful commit messages
- Add tests for new features
- Update documentation

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Kaggle** - For providing the comprehensive fruit quality dataset ([zlatan599/fruitquality1](https://www.kaggle.com/datasets/zlatan599/fruitquality1))
- **TensorFlow Team** - For the amazing deep learning framework
- **MobileNetV2** - For the efficient architecture design
- **React Community** - For the excellent UI library
- **Open Source Community** - For all the incredible tools and libraries

---

## 🎓 For Presentation

### **Key Points to Highlight**

1. **Problem Statement**: Food waste due to inability to assess freshness accurately
2. **Solution**: AI-powered automated classification system with 95.83% accuracy
3. **Technology**: Deep Learning (MobileNetV2) with transfer learning
4. **Dataset**: 57,754 images from Kaggle (professional quality dataset)
5. **Impact**: Reduces waste, improves quality control, saves money
6. **Scalability**: RESTful API for easy integration with existing systems
7. **User Experience**: Modern, intuitive web interface with drag-and-drop
8. **Performance**: Real-time predictions in milliseconds

### **Demo Flow**

1. Show the web interface running on `http://localhost:5173`
2. Upload a fresh fruit image → Get "Fresh" prediction with high confidence
3. Upload a rotten fruit image → Get "Rotten" prediction with recommendations
4. Explain confidence scores and storage recommendations
5. Show API response in browser console (Developer Tools)
6. Discuss model accuracy (95.83%) and training process
7. Highlight use cases (retail, restaurants, agriculture, home use)
8. Discuss future enhancements and scalability

### **Technical Highlights**

- **57,754 training images** (28× the initial requirement)
- **95.83% validation accuracy** (production-ready)
- **MobileNetV2 architecture** (efficient and accurate)
- **Full-stack implementation** (ML + Backend + Frontend)
- **RESTful API** (industry-standard integration)
- **Modern tech stack** (TensorFlow 2.20, React 19, Python 3.13)

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Made with ❤️ using TensorFlow, React, and Flask**

**Dataset Source**: [Kaggle - Fruit Quality Classification](https://www.kaggle.com/datasets/zlatan599/fruitquality1)

</div>
