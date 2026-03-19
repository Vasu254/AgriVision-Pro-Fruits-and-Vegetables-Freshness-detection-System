"""
Quick Dataset Status Checker
Shows current status of dataset and what to do next
"""

from pathlib import Path
import os

def check_dataset_status():
    """Check current status of dataset"""
    print("="*70)
    print("DATASET STATUS CHECK")
    print("="*70)
    
    base_path = Path('../datasets')
    
    if not base_path.exists():
        print("\n❌ Dataset folder does not exist!")
        print("\nAction: Run setup_dataset.py to create folder structure")
        return False
    
    categories = ['fruits/fresh', 'fruits/rotten', 'vegetables/fresh', 'vegetables/rotten']
    
    stats = {}
    total = 0
    ready = True
    
    print("\n📊 Current Status:\n")
    
    for category in categories:
        path = base_path / category
        
        if not path.exists():
            print(f"❌ {category:25} : NOT FOUND")
            stats[category] = 0
            ready = False
        else:
            # Count images
            extensions = ['*.jpg', '*.jpeg', '*.png', '*.bmp', '*.JPG', '*.JPEG', '*.PNG']
            images = []
            for ext in extensions:
                images.extend(list(path.glob(ext)))
            
            count = len(images)
            stats[category] = count
            total += count
            
            # Status indicator
            if count >= 500:
                status = "✅"
            elif count >= 200:
                status = "⚠️ "
            elif count > 0:
                status = "❌"
            else:
                status = "❌"
                ready = False
            
            print(f"{status} {category:25} : {count:4} images")
    
    print("\n" + "-"*70)
    print(f"   {'TOTAL':25} : {total:4} images")
    print("="*70)
    
    # Recommendations
    print("\n📋 RECOMMENDATIONS:\n")
    
    if total == 0:
        print("❌ No images found!")
        print("\n🎯 Next Steps:")
        print("   1. Run: python download_kaggle_dataset.py")
        print("      (This will download 4.77GB dataset from Kaggle)")
        print("\n   OR")
        print("\n   2. Manually add images to the folders:")
        for cat in categories:
            print(f"      - datasets/{cat}/")
        return False
    
    elif total < 2000:
        needs_aug = [cat for cat, count in stats.items() if count < 500]
        
        if needs_aug:
            print("⚠️  Some categories need more images:\n")
            for cat in needs_aug:
                needed = 500 - stats[cat]
                print(f"   {cat}: needs {needed} more images")
            
            print("\n🎯 Next Steps:")
            print("   1. Run data augmentation:")
            print("      python data_augmentation.py")
            print("\n   2. Or add more images manually")
    
    else:
        print("✅ Dataset is ready for training!")
        print("\n🎯 Next Steps:")
        print("   1. Create metadata CSV (optional):")
        print("      python create_dataset_csv.py")
        print("\n   2. Train the model:")
        print("      python train_model.py")
        ready = True
    
    # Check if model exists
    print("\n" + "="*70)
    print("MODEL STATUS")
    print("="*70)
    
    model_path = Path('models/freshness_detector.h5')
    
    if model_path.exists():
        size_mb = os.path.getsize(model_path) / (1024 * 1024)
        print(f"\n✅ Model exists: {model_path}")
        print(f"   Size: {size_mb:.2f} MB")
        print("\n🎯 Next Steps:")
        print("   1. Start backend: cd ../backend && python app.py")
        print("   2. Frontend is already running at http://localhost:5173")
        print("   3. Test the application!")
    else:
        print("\n❌ Model not found")
        if total >= 1000:
            print("\n🎯 Next Step:")
            print("   Train the model: python train_model.py")
    
    print("\n" + "="*70)
    
    return ready

def main():
    check_dataset_status()

if __name__ == "__main__":
    main()
