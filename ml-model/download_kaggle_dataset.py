"""
Download and Organize Fruit and Vegetable Dataset
Dataset: Fruit Quality (Fresh vs Rotten) by zlatan599
"""

import kagglehub
import os
import shutil
from pathlib import Path
from tqdm import tqdm

def download_dataset():
    """Download dataset using kagglehub"""
    print("="*70)
    print("DOWNLOADING FRUIT AND VEGETABLE DATASET")
    print("Dataset: Fruit Quality (Fresh vs Rotten)")
    print("="*70)
    
    try:
        # Download latest version
        print("\nDownloading from Kaggle...")
        path = kagglehub.dataset_download("zlatan599/fruitquality1")
        print(f"\n✓ Dataset downloaded to: {path}")
        return path
    except Exception as e:
        print(f"\n❌ Error downloading dataset: {e}")
        print("\nPlease ensure:")
        print("1. You have kagglehub installed: pip install kagglehub")
        print("2. You are logged into Kaggle")
        return None

def organize_dataset(source_path):
    """Organize downloaded dataset into proper structure"""
    print("\n" + "="*70)
    print("ORGANIZING DATASET")
    print("="*70)
    
    if not source_path:
        print("❌ No source path provided")
        return False
    
    source = Path(source_path)
    target = Path('../datasets')
    
    # Create target directories
    categories = {
        'fruits/fresh': target / 'fruits' / 'fresh',
        'fruits/rotten': target / 'fruits' / 'rotten',
        'vegetables/fresh': target / 'vegetables' / 'fresh',
        'vegetables/rotten': target / 'vegetables' / 'rotten'
    }
    
    for cat_path in categories.values():
        cat_path.mkdir(parents=True, exist_ok=True)
    
    # Map downloaded folders to our structure
    # Adjust these mappings based on the actual downloaded structure
    folder_mappings = {
        # Fruits
        'fresh_apple': 'fruits/fresh',
        'fresh_banana': 'fruits/fresh',
        'fresh_orange': 'fruits/fresh',
        'fresh_strawberry': 'fruits/fresh',
        'fresh_grape': 'fruits/fresh',
        'fresh_mango': 'fruits/fresh',
        'fresh_pear': 'fruits/fresh',
        'fresh_peach': 'fruits/fresh',
        'fresh_watermelon': 'fruits/fresh',
        'fresh_guava': 'fruits/fresh',
        'fresh_pomegranate': 'fruits/fresh',
        
        'rotten_apple': 'fruits/rotten',
        'rotten_banana': 'fruits/rotten',
        'rotten_orange': 'fruits/rotten',
        'rotten_strawberry': 'fruits/rotten',
        'rotten_grape': 'fruits/rotten',
        'rotten_mango': 'fruits/rotten',
        'rotten_pear': 'fruits/rotten',
        'rotten_peach': 'fruits/rotten',
        'rotten_watermelon': 'fruits/rotten',
        'rotten_guava': 'fruits/rotten',
        'rotten_pomegranate': 'fruits/rotten',
        
        # Vegetables
        'fresh_tomato': 'vegetables/fresh',
        'fresh_potato': 'vegetables/fresh',
        'fresh_carrot': 'vegetables/fresh',
        'fresh_cucumber': 'vegetables/fresh',
        'fresh_capsicum': 'vegetables/fresh',
        'fresh_bell_pepper': 'vegetables/fresh',
        'fresh_cabbage': 'vegetables/fresh',
        'fresh_lettuce': 'vegetables/fresh',
        'fresh_broccoli': 'vegetables/fresh',
        'fresh_cauliflower': 'vegetables/fresh',
        
        'rotten_tomato': 'vegetables/rotten',
        'rotten_potato': 'vegetables/rotten',
        'rotten_carrot': 'vegetables/rotten',
        'rotten_cucumber': 'vegetables/rotten',
        'rotten_capsicum': 'vegetables/rotten',
        'rotten_bell_pepper': 'vegetables/rotten',
        'rotten_cabbage': 'vegetables/rotten',
        'rotten_lettuce': 'vegetables/rotten',
        'rotten_broccoli': 'vegetables/rotten',
        'rotten_cauliflower': 'vegetables/rotten',
    }
    
    # Also check for generic folder names
    generic_mappings = {
        'fresh': None,  # Will check subfolders
        'rotten': None,
        'Fresh': None,
        'Rotten': None,
    }
    
    print("\nScanning downloaded dataset structure...")
    
    # List all items in source directory
    if not source.exists():
        print(f"❌ Source path does not exist: {source}")
        return False
    
    all_items = list(source.rglob('*'))
    print(f"Found {len(all_items)} items in downloaded dataset")
    
    # Copy files
    copied_count = 0
    
    # First, try to find and copy files based on folder structure
    for item in all_items:
        if item.is_file() and item.suffix.lower() in ['.jpg', '.jpeg', '.png', '.bmp']:
            # Get relative path from source
            rel_path = item.relative_to(source)
            
            # Try to determine category from path
            path_str = str(rel_path).lower()
            
            target_category = None
            
            # Check folder mappings
            for folder_key, category in folder_mappings.items():
                if folder_key.lower() in path_str:
                    target_category = category
                    break
            
            # If no specific mapping, try generic detection
            if not target_category:
                is_fresh = any(x in path_str for x in ['fresh', 'good', 'healthy'])
                is_rotten = any(x in path_str for x in ['rotten', 'bad', 'spoiled', 'rott'])
                is_fruit = any(x in path_str for x in ['apple', 'banana', 'orange', 'strawberry', 
                                                         'grape', 'mango', 'pear', 'peach', 
                                                         'watermelon', 'guava', 'pomegranate', 'fruit'])
                is_vegetable = any(x in path_str for x in ['tomato', 'potato', 'carrot', 'cucumber',
                                                             'capsicum', 'pepper', 'cabbage', 'lettuce',
                                                             'broccoli', 'cauliflower', 'vegetable'])
                
                if is_fruit and is_fresh:
                    target_category = 'fruits/fresh'
                elif is_fruit and is_rotten:
                    target_category = 'fruits/rotten'
                elif is_vegetable and is_fresh:
                    target_category = 'vegetables/fresh'
                elif is_vegetable and is_rotten:
                    target_category = 'vegetables/rotten'
            
            # Copy file if category determined
            if target_category:
                target_dir = categories[target_category]
                target_file = target_dir / f"{item.stem}_{copied_count}{item.suffix}"
                
                try:
                    shutil.copy2(item, target_file)
                    copied_count += 1
                    
                    if copied_count % 100 == 0:
                        print(f"Copied {copied_count} images...")
                except Exception as e:
                    print(f"Error copying {item}: {e}")
    
    print(f"\n✓ Copied {copied_count} images")
    
    return True

def verify_dataset():
    """Verify dataset organization and count images"""
    print("\n" + "="*70)
    print("DATASET VERIFICATION")
    print("="*70)
    
    base_path = Path('../datasets')
    categories = ['fruits/fresh', 'fruits/rotten', 'vegetables/fresh', 'vegetables/rotten']
    
    total = 0
    stats = {}
    
    for category in categories:
        path = base_path / category
        if path.exists():
            # Count image files
            images = list(path.glob('*.jpg')) + list(path.glob('*.jpeg')) + \
                     list(path.glob('*.png')) + list(path.glob('*.bmp'))
            count = len(images)
            stats[category] = count
            total += count
            print(f"\n{category:25} : {count:4} images")
        else:
            print(f"\n{category:25} : Directory not found")
            stats[category] = 0
    
    print("\n" + "-"*70)
    print(f"{'TOTAL':25} : {total:4} images")
    print("="*70)
    
    # Check if we need augmentation
    need_augmentation = []
    for category, count in stats.items():
        if count < 500:
            need_augmentation.append(category)
    
    if need_augmentation:
        print("\n⚠️  Some categories have less than 500 images:")
        for cat in need_augmentation:
            print(f"   - {cat}: {stats[cat]} images")
        print("\nRecommendation: Run data augmentation")
        print("Command: python data_augmentation.py")
    else:
        print("\n✓ All categories have 500+ images!")
        print("You can proceed to training: python train_model.py")
    
    return stats

def main():
    print("="*70)
    print("FRUIT AND VEGETABLE DATASET SETUP")
    print("Dataset: zlatan599/fruitquality1")
    print("="*70)
    
    # Step 1: Download dataset
    dataset_path = download_dataset()
    
    if not dataset_path:
        print("\n❌ Dataset download failed!")
        print("\nAlternative: Manual download")
        print("1. Go to: https://www.kaggle.com/datasets/zlatan599/fruitquality1")
        print("2. Download the dataset")
        print("3. Extract to a folder")
        print("4. Run this script again and provide the path")
        return
    
    # Step 2: Organize dataset
    success = organize_dataset(dataset_path)
    
    if not success:
        print("\n❌ Dataset organization failed!")
        return
    
    # Step 3: Verify dataset
    stats = verify_dataset()
    
    # Step 4: Next steps
    print("\n" + "="*70)
    print("NEXT STEPS")
    print("="*70)
    
    total_images = sum(stats.values())
    
    if total_images < 2000:
        print("\n1. Run data augmentation to reach 500+ images per category:")
        print("   python data_augmentation.py")
        print("\n2. Then train the model:")
        print("   python train_model.py")
    else:
        print("\n1. Start training the model:")
        print("   python train_model.py")
    
    print("\n" + "="*70)
    print("✓ DATASET SETUP COMPLETE!")
    print("="*70)

if __name__ == "__main__":
    main()
