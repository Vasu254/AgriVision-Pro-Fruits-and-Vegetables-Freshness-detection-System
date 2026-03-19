"""
Model Training Script for Fruits and Vegetables Freshness Detection
Uses TensorFlow/Keras with Transfer Learning (MobileNetV2)
"""

import os
import shutil
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from pathlib import Path
import matplotlib.pyplot as plt
import json
from datetime import datetime

class FreshnessDetector:
    def __init__(self, dataset_path='../datasets', img_size=(224, 224), batch_size=32):
        self.dataset_path = Path(dataset_path)
        self.img_size = img_size
        self.batch_size = batch_size
        self.model = None
        self.history = None
        
        # Class names
        self.class_names = ['fresh', 'rotten']

    def reorganize_dataset(self):
        """Reorganize nested dataset (fruits/fresh, vegetables/fresh, etc.) into flat fresh/rotten structure"""
        reorganized_path = self.dataset_path / 'reorganized'
        
        # Skip if already reorganized
        if reorganized_path.exists() and (reorganized_path / 'fresh').exists() and (reorganized_path / 'rotten').exists():
            fresh_count = len(list((reorganized_path / 'fresh').glob('*')))
            rotten_count = len(list((reorganized_path / 'rotten').glob('*')))
            if fresh_count > 0 and rotten_count > 0:
                print(f"✓ Using existing reorganized dataset ({fresh_count} fresh, {rotten_count} rotten)")
                return reorganized_path
        
        print("Reorganizing dataset into fresh/rotten structure...")
        
        # Create fresh and rotten directories
        (reorganized_path / 'fresh').mkdir(parents=True, exist_ok=True)
        (reorganized_path / 'rotten').mkdir(parents=True, exist_ok=True)
        
        categories = ['fruits', 'vegetables']
        labels = ['fresh', 'rotten']
        img_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'}
        
        for category in categories:
            for label in labels:
                source_dir = self.dataset_path / category / label
                if not source_dir.exists():
                    print(f"  Warning: {source_dir} not found, skipping...")
                    continue
                
                dest_dir = reorganized_path / label
                count = 0
                for img_file in source_dir.iterdir():
                    if img_file.suffix.lower() in img_extensions:
                        # Prefix with category to avoid filename collisions
                        dest_file = dest_dir / f"{category}_{img_file.name}"
                        if not dest_file.exists():
                            shutil.copy2(img_file, dest_file)
                        count += 1
                print(f"  ✓ Copied {count} images from {category}/{label}")
        
        fresh_count = len(list((reorganized_path / 'fresh').glob('*')))
        rotten_count = len(list((reorganized_path / 'rotten').glob('*')))
        print(f"✓ Dataset reorganized: {fresh_count} fresh, {rotten_count} rotten")
        
        return reorganized_path
        
    def prepare_data(self):
        """Prepare training and validation data"""
        print("Preparing data...")
        
        # Reorganize dataset into flat fresh/rotten structure
        data_path = self.reorganize_dataset()
        
        # Data augmentation for training
        train_datagen = ImageDataGenerator(
            rescale=1./255,
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            fill_mode='nearest',
            validation_split=0.2
        )
        
        # Only rescaling for validation
        val_datagen = ImageDataGenerator(
            rescale=1./255,
            validation_split=0.2
        )
        
        # Training data
        self.train_generator = train_datagen.flow_from_directory(
            data_path,
            target_size=self.img_size,
            batch_size=self.batch_size,
            class_mode='categorical',
            subset='training',
            shuffle=True
        )
        
        # Validation data
        self.val_generator = val_datagen.flow_from_directory(
            data_path,
            target_size=self.img_size,
            batch_size=self.batch_size,
            class_mode='categorical',
            subset='validation',
            shuffle=False
        )
        
        print(f"Training samples: {self.train_generator.samples}")
        print(f"Validation samples: {self.val_generator.samples}")
        print(f"Classes: {self.train_generator.class_indices}")
        
    def build_model(self):
        """Build the model using transfer learning"""
        print("\nBuilding model...")
        
        # Load pre-trained MobileNetV2
        base_model = MobileNetV2(
            input_shape=(*self.img_size, 3),
            include_top=False,
            weights='imagenet'
        )
        
        # Freeze base model
        base_model.trainable = False
        
        # Add custom layers
        inputs = keras.Input(shape=(*self.img_size, 3))
        x = base_model(inputs, training=False)
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.Dropout(0.3)(x)
        x = layers.Dense(256, activation='relu')(x)
        x = layers.Dropout(0.3)(x)
        x = layers.Dense(128, activation='relu')(x)
        outputs = layers.Dense(len(self.train_generator.class_indices), activation='softmax')(x)
        
        self.model = keras.Model(inputs, outputs)
        
        # Compile model
        self.model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy', keras.metrics.Precision(), keras.metrics.Recall()]
        )
        
        print(f"✓ Model built successfully!")
        self.model.summary()
        
    def train(self, epochs=20):
        """Train the model"""
        print("\nStarting training...")
        
        # Callbacks
        callbacks = [
            keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=5,
                restore_best_weights=True
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=3,
                min_lr=1e-7
            ),
            keras.callbacks.ModelCheckpoint(
                'best_model.h5',
                monitor='val_accuracy',
                save_best_only=True,
                verbose=1
            )
        ]
        
        # Train
        self.history = self.model.fit(
            self.train_generator,
            validation_data=self.val_generator,
            epochs=epochs,
            callbacks=callbacks,
            verbose=1
        )
        
        print("\n✓ Training completed!")
        
    def fine_tune(self, epochs=10):
        """Fine-tune the model by unfreezing some layers"""
        print("\nFine-tuning model...")
        
        # Unfreeze the base model
        self.model.layers[1].trainable = True
        
        # Freeze first 100 layers
        for layer in self.model.layers[1].layers[:100]:
            layer.trainable = False
        
        # Recompile with lower learning rate
        self.model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.0001),
            loss='categorical_crossentropy',
            metrics=['accuracy', keras.metrics.Precision(), keras.metrics.Recall()]
        )
        
        # Continue training
        history_fine = self.model.fit(
            self.train_generator,
            validation_data=self.val_generator,
            epochs=epochs,
            verbose=1
        )
        
        print("✓ Fine-tuning completed!")
        
    def save_model(self, model_path='models'):
        """Save the trained model"""
        Path(model_path).mkdir(exist_ok=True)
        
        # Save as .h5
        model_file = f"{model_path}/freshness_detector.h5"
        self.model.save(model_file)
        print(f"✓ Model saved to {model_file}")
        
        # Save as TensorFlow SavedModel format (for serving)
        saved_model_dir = f"{model_path}/freshness_detector_saved_model"
        self.model.save(saved_model_dir)
        print(f"✓ SavedModel format saved to {saved_model_dir}")
        
        # Save class indices
        class_indices = self.train_generator.class_indices
        with open(f"{model_path}/class_indices.json", 'w') as f:
            json.dump(class_indices, f, indent=2)
        print(f"✓ Class indices saved")
        
    def plot_training_history(self):
        """Plot training history"""
        if self.history is None:
            print("No training history available")
            return
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        
        # Accuracy
        axes[0, 0].plot(self.history.history['accuracy'], label='Train')
        axes[0, 0].plot(self.history.history['val_accuracy'], label='Validation')
        axes[0, 0].set_title('Model Accuracy')
        axes[0, 0].set_xlabel('Epoch')
        axes[0, 0].set_ylabel('Accuracy')
        axes[0, 0].legend()
        axes[0, 0].grid(True)
        
        # Loss
        axes[0, 1].plot(self.history.history['loss'], label='Train')
        axes[0, 1].plot(self.history.history['val_loss'], label='Validation')
        axes[0, 1].set_title('Model Loss')
        axes[0, 1].set_xlabel('Epoch')
        axes[0, 1].set_ylabel('Loss')
        axes[0, 1].legend()
        axes[0, 1].grid(True)
        
        # Precision
        axes[1, 0].plot(self.history.history['precision'], label='Train')
        axes[1, 0].plot(self.history.history['val_precision'], label='Validation')
        axes[1, 0].set_title('Model Precision')
        axes[1, 0].set_xlabel('Epoch')
        axes[1, 0].set_ylabel('Precision')
        axes[1, 0].legend()
        axes[1, 0].grid(True)
        
        # Recall
        axes[1, 1].plot(self.history.history['recall'], label='Train')
        axes[1, 1].plot(self.history.history['val_recall'], label='Validation')
        axes[1, 1].set_title('Model Recall')
        axes[1, 1].set_xlabel('Epoch')
        axes[1, 1].set_ylabel('Recall')
        axes[1, 1].legend()
        axes[1, 1].grid(True)
        
        plt.tight_layout()
        plt.savefig('training_history.png', dpi=300, bbox_inches='tight')
        print("✓ Training history plot saved to training_history.png")
        plt.show()

def main():
    print("="*70)
    print("FRUITS & VEGETABLES FRESHNESS DETECTION - MODEL TRAINING")
    print("="*70)
    
    # Initialize detector
    detector = FreshnessDetector(
        dataset_path='../datasets',
        img_size=(224, 224),
        batch_size=32
    )
    
    # Prepare data
    detector.prepare_data()
    
    # Build model
    detector.build_model()
    
    # Train model
    print("\nTraining with frozen base model...")
    detector.train(epochs=20)
    
    # Fine-tune (optional)
    print("\nDo you want to fine-tune the model? (y/n): ", end='')
    choice = input().strip().lower()
    if choice == 'y':
        detector.fine_tune(epochs=10)
    
    # Save model
    detector.save_model()
    
    # Plot training history
    detector.plot_training_history()
    
    print("\n" + "="*70)
    print("TRAINING COMPLETED SUCCESSFULLY!")
    print("="*70)
    print("\nNext step: Run the backend server and frontend application")

if __name__ == "__main__":
    main()
