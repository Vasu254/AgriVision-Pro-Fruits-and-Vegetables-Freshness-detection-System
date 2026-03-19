# Sample Dataset Creation Script
# This creates a minimal dataset structure for testing

import os
from pathlib import Path
import urllib.request
import ssl

# Disable SSL verification for downloads (use with caution)
ssl._create_default_https_context = ssl._create_unverified_context

def create_sample_dataset():
    """Create sample dataset structure"""
    
    base_path = Path('../datasets')
    
    categories = [
        'fruits/fresh',
        'fruits/rotten',
        'vegetables/fresh',
        'vegetables/rotten'
    ]
    
    print("="*60)
    print("CREATING SAMPLE DATASET STRUCTURE")
    print("="*60)
    
    for category in categories:
        path = base_path / category
        path.mkdir(parents=True, exist_ok=True)
        print(f"✓ Created: {path}")
    
    print("\n" + "="*60)
    print("DATASET STRUCTURE READY!")
    print("="*60)
    print("\nNow you can:")
    print("1. Add your own images to these folders")
    print("2. Use dataset_downloader.py to download from Kaggle")
    print("3. Use data_augmentation.py to generate more images")
    
    print("\n" + "="*60)
    print("RECOMMENDED FREE DATASET SOURCES")
    print("="*60)
    print("\n1. Kaggle Datasets:")
    print("   - Fresh and Rotten Fruits/Vegetables")
    print("   - Fruit Recognition Dataset")
    print("   - Vegetable Image Dataset")
    
    print("\n2. Manual Collection:")
    print("   - Take photos with your phone")
    print("   - Use Google Images (check license)")
    print("   - Use stock photo websites")
    
    print("\n3. Public Datasets:")
    print("   - UCI Machine Learning Repository")
    print("   - ImageNet subsets")
    print("   - Open Images Dataset")
    
    # Create a README in datasets folder
    readme_content = """# Datasets Folder

## Structure

Place your images in the following folders:

- `fruits/fresh/` - Fresh fruit images
- `fruits/rotten/` - Rotten fruit images
- `vegetables/fresh/` - Fresh vegetable images
- `vegetables/rotten/` - Rotten vegetable images

## Requirements

- At least 100-200 images per category (will be augmented to 500+)
- Supported formats: JPG, PNG, JPEG
- Recommended resolution: 224x224 or higher

## Data Sources

### Option 1: Kaggle (Recommended)
Run `python ml-model/dataset_downloader.py`

### Option 2: Manual Collection
- Take photos with smartphone
- Use royalty-free image sites
- Ensure proper lighting and clear images

### Option 3: Web Scraping
Use tools like:
- google-images-download
- Beautiful Soup
- Selenium

## Data Augmentation

After collecting initial images:
```bash
python ml-model/data_augmentation.py
```

This will generate augmented versions to reach 500+ images per category.
"""
    
    readme_path = base_path / 'README.md'
    with open(readme_path, 'w') as f:
        f.write(readme_content)
    
    print(f"\n✓ Created README at {readme_path}")
    print("\nRefer to datasets/README.md for more information!")

if __name__ == "__main__":
    create_sample_dataset()
