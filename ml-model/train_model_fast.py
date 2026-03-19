"""
Simplified Fast Training Script for Freshness Detection
Optimized for large datasets and quick training
"""

import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Reduce TensorFlow logging

import shutil
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from pathlib import Path
import json

print("="*70)
print("FAST TRAINING - FRESHNESS DETECTOR")
print("="*70)

# Configuration
DATASET_PATH = '../datasets'
IMG_SIZE = (224, 224)
BATCH_SIZE = 64  # Increased for faster training
EPOCHS = 5  # Reduced for faster training
MODEL_DIR = 'models'

# Create models directory
Path(MODEL_DIR).mkdir(exist_ok=True)

# ---- Reorganize dataset into flat fresh/rotten structure ----
def reorganize_dataset(dataset_path):
    """Reorganize nested dataset into flat fresh/rotten structure"""
    dataset_path = Path(dataset_path)
    reorganized_path = dataset_path / 'reorganized'
    
    if reorganized_path.exists() and (reorganized_path / 'fresh').exists() and (reorganized_path / 'rotten').exists():
        fresh_count = len(list((reorganized_path / 'fresh').glob('*')))
        rotten_count = len(list((reorganized_path / 'rotten').glob('*')))
        if fresh_count > 0 and rotten_count > 0:
            print(f"Using existing reorganized dataset ({fresh_count} fresh, {rotten_count} rotten)")
            return reorganized_path
    
    print("Reorganizing dataset into fresh/rotten structure...")
    (reorganized_path / 'fresh').mkdir(parents=True, exist_ok=True)
    (reorganized_path / 'rotten').mkdir(parents=True, exist_ok=True)
    
    img_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'}
    for category in ['fruits', 'vegetables']:
        for label in ['fresh', 'rotten']:
            source_dir = dataset_path / category / label
            if not source_dir.exists():
                continue
            dest_dir = reorganized_path / label
            count = 0
            for img_file in source_dir.iterdir():
                if img_file.suffix.lower() in img_extensions:
                    dest_file = dest_dir / f"{category}_{img_file.name}"
                    if not dest_file.exists():
                        shutil.copy2(img_file, dest_file)
                    count += 1
            print(f"  Copied {count} images from {category}/{label}")
    
    return reorganized_path

DATA_PATH = reorganize_dataset(DATASET_PATH)

print("\n1. Preparing Data...")

# Simple data generators (less augmentation for speed)
train_datagen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.2,
    rotation_range=10,
    horizontal_flip=True
)

val_datagen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.2
)

# Load data
train_generator = train_datagen.flow_from_directory(
    DATA_PATH,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training',
    shuffle=True
)

val_generator = val_datagen.flow_from_directory(
    DATA_PATH,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation',
    shuffle=False
)

print(f"\nTraining samples: {train_generator.samples}")
print(f"Validation samples: {val_generator.samples}")
print(f"Classes: {train_generator.class_indices}")

print("\n2. Building Model...")

# Build model
base_model = MobileNetV2(
    input_shape=(*IMG_SIZE, 3),
    include_top=False,
    weights='imagenet'
)

# Freeze base model
base_model.trainable = False

# Create model
inputs = keras.Input(shape=(*IMG_SIZE, 3))
x = base_model(inputs, training=False)
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dropout(0.2)(x)
x = layers.Dense(128, activation='relu')(x)
outputs = layers.Dense(len(train_generator.class_indices), activation='softmax')(x)

model = keras.Model(inputs, outputs)

# Compile
model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

print("✓ Model built successfully!")

print("\n3. Training Model...")

# Callbacks
callbacks = [
    keras.callbacks.ModelCheckpoint(
        f'{MODEL_DIR}/freshness_detector.h5',
        monitor='val_accuracy',
        save_best_only=True,
        verbose=1
    ),
    keras.callbacks.EarlyStopping(
        monitor='val_loss',
        patience=2,
        restore_best_weights=True
    )
]

# Train
history = model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=EPOCHS,
    callbacks=callbacks,
    verbose=1
)

print("\n4. Saving Model...")

# Save model
model.save(f'{MODEL_DIR}/freshness_detector.h5')
print(f"✓ Model saved to {MODEL_DIR}/freshness_detector.h5")

# Save class indices
with open(f'{MODEL_DIR}/class_indices.json', 'w') as f:
    json.dump(train_generator.class_indices, f, indent=2)
print(f"✓ Class indices saved")

# Print results
print("\n" + "="*70)
print("TRAINING COMPLETED!")
print("="*70)

final_train_acc = history.history['accuracy'][-1]
final_val_acc = history.history['val_accuracy'][-1]

print(f"\nFinal Training Accuracy: {final_train_acc*100:.2f}%")
print(f"Final Validation Accuracy: {final_val_acc*100:.2f}%")

print("\n" + "="*70)
print("NEXT STEPS")
print("="*70)
print("\n1. Start backend:")
print("   cd ../backend")
print("   python app.py")
print("\n2. Frontend already running at:")
print("   http://localhost:5173")
print("\n3. Test the application!")
print("="*70)
