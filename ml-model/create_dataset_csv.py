"""
Create Dataset Metadata CSV
This creates a CSV file with information about all images in the dataset
"""

import os
import csv
from pathlib import Path
from PIL import Image
import hashlib

def get_image_info(image_path):
    """Get information about an image"""
    try:
        with Image.open(image_path) as img:
            width, height = img.size
            format_type = img.format
            mode = img.mode
        
        # Get file size
        file_size = os.path.getsize(image_path) / 1024  # KB
        
        # Get file hash for uniqueness check
        with open(image_path, 'rb') as f:
            file_hash = hashlib.md5(f.read()).hexdigest()
        
        return {
            'width': width,
            'height': height,
            'format': format_type,
            'mode': mode,
            'size_kb': round(file_size, 2),
            'hash': file_hash
        }
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return None

def create_dataset_csv():
    """Create CSV file with dataset metadata"""
    print("="*70)
    print("CREATING DATASET METADATA CSV")
    print("="*70)
    
    base_path = Path('../datasets')
    csv_path = base_path / 'dataset_metadata.csv'
    
    categories = {
        'fruits/fresh': ('fruit', 'fresh'),
        'fruits/rotten': ('fruit', 'rotten'),
        'vegetables/fresh': ('vegetable', 'fresh'),
        'vegetables/rotten': ('vegetable', 'rotten')
    }
    
    # Prepare CSV data
    rows = []
    
    print("\nScanning images...")
    total = 0
    
    for category, (type_label, condition_label) in categories.items():
        category_path = base_path / category
        
        if not category_path.exists():
            print(f"⚠️  Category not found: {category}")
            continue
        
        # Get all image files
        extensions = ['*.jpg', '*.jpeg', '*.png', '*.bmp', '*.JPG', '*.JPEG', '*.PNG']
        images = []
        for ext in extensions:
            images.extend(list(category_path.glob(ext)))
        
        print(f"\nProcessing {category}: {len(images)} images")
        
        for idx, img_path in enumerate(images):
            info = get_image_info(img_path)
            
            if info:
                row = {
                    'filename': img_path.name,
                    'relative_path': str(img_path.relative_to(base_path)),
                    'absolute_path': str(img_path.absolute()),
                    'type': type_label,
                    'condition': condition_label,
                    'category': category,
                    'width': info['width'],
                    'height': info['height'],
                    'format': info['format'],
                    'mode': info['mode'],
                    'size_kb': info['size_kb'],
                    'file_hash': info['hash']
                }
                rows.append(row)
                total += 1
            
            if (idx + 1) % 100 == 0:
                print(f"  Processed {idx + 1}/{len(images)} images...")
    
    # Write to CSV
    if rows:
        fieldnames = ['filename', 'relative_path', 'absolute_path', 'type', 'condition', 
                     'category', 'width', 'height', 'format', 'mode', 'size_kb', 'file_hash']
        
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        
        print(f"\n✓ Created CSV with {total} images")
        print(f"✓ Saved to: {csv_path}")
    else:
        print("\n❌ No images found!")
    
    return csv_path, total

def create_summary_csv():
    """Create summary statistics CSV"""
    print("\n" + "="*70)
    print("CREATING SUMMARY STATISTICS CSV")
    print("="*70)
    
    base_path = Path('../datasets')
    csv_path = base_path / 'dataset_summary.csv'
    
    categories = ['fruits/fresh', 'fruits/rotten', 'vegetables/fresh', 'vegetables/rotten']
    
    rows = []
    
    for category in categories:
        category_path = base_path / category
        
        if not category_path.exists():
            continue
        
        # Count images
        extensions = ['*.jpg', '*.jpeg', '*.png', '*.bmp', '*.JPG', '*.JPEG', '*.PNG']
        images = []
        for ext in extensions:
            images.extend(list(category_path.glob(ext)))
        
        count = len(images)
        
        # Calculate average size
        total_size = 0
        total_width = 0
        total_height = 0
        
        for img_path in images[:100]:  # Sample first 100 for speed
            try:
                with Image.open(img_path) as img:
                    total_width += img.size[0]
                    total_height += img.size[1]
                total_size += os.path.getsize(img_path) / 1024
            except:
                continue
        
        sample_count = min(100, count)
        avg_size = total_size / sample_count if sample_count > 0 else 0
        avg_width = total_width / sample_count if sample_count > 0 else 0
        avg_height = total_height / sample_count if sample_count > 0 else 0
        
        row = {
            'category': category,
            'image_count': count,
            'avg_size_kb': round(avg_size, 2),
            'avg_width': round(avg_width),
            'avg_height': round(avg_height),
            'meets_target': 'Yes' if count >= 500 else 'No',
            'augmentation_needed': 'No' if count >= 500 else 'Yes'
        }
        rows.append(row)
    
    # Write to CSV
    if rows:
        fieldnames = ['category', 'image_count', 'avg_size_kb', 'avg_width', 
                     'avg_height', 'meets_target', 'augmentation_needed']
        
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        
        print(f"✓ Created summary CSV")
        print(f"✓ Saved to: {csv_path}")
        
        # Display summary
        print("\n" + "="*70)
        print("DATASET SUMMARY")
        print("="*70)
        
        for row in rows:
            print(f"\n{row['category']}")
            print(f"  Images: {row['image_count']}")
            print(f"  Avg Size: {row['avg_size_kb']} KB")
            print(f"  Avg Dimensions: {row['avg_width']}x{row['avg_height']}")
            print(f"  Meets Target (500+): {row['meets_target']}")
            print(f"  Augmentation Needed: {row['augmentation_needed']}")
    
    return csv_path

def main():
    print("="*70)
    print("DATASET METADATA GENERATOR")
    print("="*70)
    
    # Check if dataset exists
    base_path = Path('../datasets')
    if not base_path.exists():
        print("\n❌ Dataset folder not found!")
        print("Please run download_kaggle_dataset.py first")
        return
    
    # Create detailed metadata CSV
    metadata_csv, total = create_dataset_csv()
    
    # Create summary CSV
    summary_csv = create_summary_csv()
    
    print("\n" + "="*70)
    print("✓ METADATA GENERATION COMPLETE!")
    print("="*70)
    print(f"\nCreated files:")
    print(f"1. {metadata_csv} - Detailed metadata ({total} images)")
    print(f"2. {summary_csv} - Summary statistics")
    
    print("\nYou can now:")
    print("1. View the CSV files in Excel or any spreadsheet software")
    print("2. Run data_augmentation.py if needed")
    print("3. Run train_model.py to train the model")

if __name__ == "__main__":
    main()
