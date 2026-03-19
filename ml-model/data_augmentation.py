"""
Data Augmentation Script
Generates additional images to reach 500+ fruits and 500+ vegetables
"""

import os
import cv2
import numpy as np
from pathlib import Path
from tqdm import tqdm
import albumentations as A
from PIL import Image

class DataAugmenter:
    def __init__(self, base_path='../datasets'):
        self.base_path = Path(base_path)
        
        # Define augmentation pipeline
        self.transform = A.Compose([
            A.OneOf([
                A.HorizontalFlip(p=0.5),
                A.VerticalFlip(p=0.3),
                A.Rotate(limit=30, p=0.5),
            ], p=0.8),
            A.OneOf([
                A.RandomBrightnessContrast(p=0.5),
                A.HueSaturationValue(p=0.5),
                A.ColorJitter(p=0.5),
            ], p=0.7),
            A.OneOf([
                A.GaussianBlur(blur_limit=(3, 7), p=0.3),
                A.GaussNoise(var_limit=(10.0, 50.0), p=0.3),
            ], p=0.5),
            A.ShiftScaleRotate(shift_limit=0.0625, scale_limit=0.1, rotate_limit=15, p=0.5),
        ])
    
    def augment_image(self, image_path, output_dir, num_augmentations=5):
        """Generate augmented versions of an image"""
        try:
            # Read image
            image = cv2.imread(str(image_path))
            if image is None:
                return 0
            
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Get base name
            base_name = image_path.stem
            extension = image_path.suffix
            
            count = 0
            for i in range(num_augmentations):
                # Apply augmentation
                augmented = self.transform(image=image)['image']
                
                # Save augmented image
                output_path = output_dir / f"{base_name}_aug_{i}{extension}"
                augmented_bgr = cv2.cvtColor(augmented, cv2.COLOR_RGB2BGR)
                cv2.imwrite(str(output_path), augmented_bgr)
                count += 1
            
            return count
        except Exception as e:
            print(f"Error augmenting {image_path}: {e}")
            return 0
    
    def augment_category(self, category_path, target_count=500):
        """Augment images in a category to reach target count"""
        if not category_path.exists():
            print(f"Category path does not exist: {category_path}")
            return
        
        # Get all images
        image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']
        images = []
        for ext in image_extensions:
            images.extend(list(category_path.glob(f'**/{ext}')))
        
        current_count = len(images)
        print(f"\n{category_path.name}: Current count = {current_count}")
        
        if current_count >= target_count:
            print(f"✓ Already has {current_count} images (target: {target_count})")
            return
        
        # Calculate how many augmentations per image
        needed = target_count - current_count
        augmentations_per_image = max(1, needed // current_count)
        
        print(f"Generating {augmentations_per_image} augmentations per image...")
        
        total_generated = 0
        for image_path in tqdm(images, desc=f"Augmenting {category_path.name}"):
            generated = self.augment_image(image_path, category_path, augmentations_per_image)
            total_generated += generated
        
        final_count = current_count + total_generated
        print(f"✓ Generated {total_generated} images. Total: {final_count}")
    
    def augment_all(self):
        """Augment all categories"""
        categories = [
            ('fruits/fresh', 500),
            ('fruits/rotten', 500),
            ('vegetables/fresh', 500),
            ('vegetables/rotten', 500),
        ]
        
        print("="*60)
        print("DATA AUGMENTATION")
        print("="*60)
        
        for category, target in categories:
            category_path = self.base_path / category
            self.augment_category(category_path, target)
        
        print("\n" + "="*60)
        print("AUGMENTATION COMPLETED!")
        print("="*60)

if __name__ == "__main__":
    augmenter = DataAugmenter()
    augmenter.augment_all()
