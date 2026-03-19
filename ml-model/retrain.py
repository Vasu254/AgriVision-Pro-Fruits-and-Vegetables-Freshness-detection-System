"""
Automated Model Retraining Script for Freshness Detection
Reorganizes dataset into fresh/rotten, trains MobileNetV2, then fine-tunes.
Non-interactive - runs fully automated.
"""

import shutil
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from pathlib import Path
import json

# Configuration
DATASET_PATH = Path('../datasets')
MODEL_DIR = Path('models')
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
INITIAL_EPOCHS = 15
FINE_TUNE_EPOCHS = 10
IMG_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'}


def copy_images(src_dir, dest_dir, prefix):
    """Copy images from src to dest with a filename prefix. Returns count."""
    copied = 0
    if not src_dir.exists():
        print(f"  Warning: {src_dir} not found, skipping")
        return copied
    for img_file in src_dir.iterdir():
        if img_file.suffix.lower() in IMG_EXTENSIONS:
            dest_file = dest_dir / f"{prefix}_{img_file.name}"
            if not dest_file.exists():
                shutil.copy2(img_file, dest_file)
            copied += 1
    return copied


def reorganize_dataset():
    """Merge fruits/fresh + vegetables/fresh into reorganized/fresh, etc."""
    reorg = DATASET_PATH / 'reorganized'

    if reorg.exists() and (reorg / 'fresh').exists() and (reorg / 'rotten').exists():
        fc = len(list((reorg / 'fresh').glob('*')))
        rc = len(list((reorg / 'rotten').glob('*')))
        if fc > 0 and rc > 0:
            print(f"Existing reorganized dataset found ({fc} fresh, {rc} rotten)")
            return reorg

    print("Reorganizing dataset into fresh/rotten ...")
    (reorg / 'fresh').mkdir(parents=True, exist_ok=True)
    (reorg / 'rotten').mkdir(parents=True, exist_ok=True)

    for category in ['fruits', 'vegetables']:
        for label in ['fresh', 'rotten']:
            n = copy_images(DATASET_PATH / category / label, reorg / label, category)
            print(f"  Copied {n} images from {category}/{label}")

    fc = len(list((reorg / 'fresh').glob('*')))
    rc = len(list((reorg / 'rotten').glob('*')))
    print(f"Total: {fc} fresh, {rc} rotten\n")
    return reorg


def create_generators(data_path):
    """Create training and validation data generators."""
    train_gen = ImageDataGenerator(
        rescale=1.0/255,
        rotation_range=30,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.15,
        zoom_range=0.25,
        horizontal_flip=True,
        brightness_range=[0.8, 1.2],
        fill_mode='nearest',
        validation_split=0.2
    )
    val_gen = ImageDataGenerator(rescale=1.0/255, validation_split=0.2)

    train = train_gen.flow_from_directory(
        data_path, target_size=IMG_SIZE, batch_size=BATCH_SIZE,
        class_mode='categorical', subset='training', shuffle=True
    )
    val = val_gen.flow_from_directory(
        data_path, target_size=IMG_SIZE, batch_size=BATCH_SIZE,
        class_mode='categorical', subset='validation', shuffle=False
    )
    print(f"Train: {train.samples}  Val: {val.samples}")
    print(f"Classes: {train.class_indices}\n")
    return train, val


def build_model(num_classes):
    """Build MobileNetV2 transfer learning model."""
    base = MobileNetV2(input_shape=(*IMG_SIZE, 3), include_top=False, weights='imagenet')
    base.trainable = False

    inputs = keras.Input(shape=(*IMG_SIZE, 3))
    x = base(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(256, activation='relu')(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(128, activation='relu')(x)
    outputs = layers.Dense(num_classes, activation='softmax')(x)

    model = keras.Model(inputs, outputs)
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    return model, base


def train_model(model, base, train, val):
    """Train the model in two phases: frozen base, then fine-tuned."""
    print("=" * 50)
    print("PHASE 1: Training with frozen base model")
    print("=" * 50)

    callbacks_p1 = [
        keras.callbacks.EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-7),
    ]

    model.fit(train, validation_data=val, epochs=INITIAL_EPOCHS, callbacks=callbacks_p1, verbose=1)

    # Phase 2: Fine-tune
    print("\n" + "=" * 50)
    print("PHASE 2: Fine-tuning (unfreezing top layers)")
    print("=" * 50)

    base.trainable = True
    for layer in base.layers[:100]:
        layer.trainable = False

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.0001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    callbacks_p2 = [
        keras.callbacks.EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-7),
    ]

    model.fit(train, validation_data=val, epochs=FINE_TUNE_EPOCHS, callbacks=callbacks_p2, verbose=1)
    return model


def save_model(model, class_indices):
    """Save model and class indices to disk."""
    MODEL_DIR.mkdir(exist_ok=True)

    model_path = MODEL_DIR / 'freshness_detector.h5'
    model.save(str(model_path))
    print(f"\nModel saved to {model_path}")

    ci_path = MODEL_DIR / 'class_indices.json'
    with open(ci_path, 'w') as f:
        json.dump(class_indices, f, indent=2)
    print(f"Class indices saved to {ci_path}")
    print(f"  Classes: {class_indices}")


if __name__ == '__main__':
    print("=" * 60)
    print("  FRESHNESS DETECTION MODEL - AUTOMATED RETRAINING")
    print("=" * 60 + "\n")

    data_path = reorganize_dataset()
    train_data, val_data = create_generators(data_path)
    fresh_model, base_model = build_model(num_classes=len(train_data.class_indices))
    fresh_model = train_model(fresh_model, base_model, train_data, val_data)
    save_model(fresh_model, train_data.class_indices)

    # Quick evaluation
    loss, acc = fresh_model.evaluate(val_data, verbose=0)
    print(f"\n{'=' * 60}")
    print(f"  FINAL VALIDATION ACCURACY: {acc * 100:.2f}%")
    print(f"  FINAL VALIDATION LOSS:     {loss:.4f}")
    print(f"{'=' * 60}")
    print("\nRetraining complete! Restart the backend to use the new model.")
