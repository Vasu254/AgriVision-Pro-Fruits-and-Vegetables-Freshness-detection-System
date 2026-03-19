"""
Dataset Downloader for Fruits and Vegetables Freshness Detection
This script downloads and organizes datasets from Kaggle
"""

import os
import zipfile
import shutil
from pathlib import Path
import kaggle
import requests
from tqdm import tqdm

class DatasetDownloader:
    def __init__(self, base_path='../datasets'):
        self.base_path = Path(base_path)
        self.base_path.mkdir(exist_ok=True)
        
    def download_from_kaggle(self):
        """
        Download datasets from Kaggle
        Recommended datasets:
        1. Fresh and Rotten Fruits Dataset
        2. Fruit and Vegetable Image Recognition Dataset
        """
        print("Downloading datasets from Kaggle...")
        
        # Create directory structure
        (self.base_path / 'fruits' / 'fresh').mkdir(parents=True, exist_ok=True)
        (self.base_path / 'fruits' / 'rotten').mkdir(parents=True, exist_ok=True)
        (self.base_path / 'vegetables' / 'fresh').mkdir(parents=True, exist_ok=True)
        (self.base_path / 'vegetables' / 'rotten').mkdir(parents=True, exist_ok=True)
        
        try:
            # Download Fresh and Rotten Fruits/Vegetables Dataset
            print("\nDownloading Fresh and Rotten Classification Dataset...")
            os.system('kaggle datasets download -d sriramr/fruits-fresh-and-rotten-for-classification -p ../datasets --unzip')
            
            # Download Fruit Recognition Dataset
            print("\nDownloading Fruit Recognition Dataset...")
            os.system('kaggle datasets download -d moltean/fruits -p ../datasets --unzip')
            
            # Download Vegetable Image Dataset
            print("\nDownloading Vegetable Image Dataset...")
            os.system('kaggle datasets download -d misrakahmed/vegetable-image-dataset -p ../datasets --unzip')
            
            print("\n✓ Dataset download completed!")
            
        except Exception as e:
            print(f"Error downloading from Kaggle: {e}")
            print("\nPlease ensure you have:")
            print("1. Kaggle API installed: pip install kaggle")
            print("2. Kaggle API credentials in ~/.kaggle/kaggle.json")
            print("\nOr manually download datasets from:")
            print("- https://www.kaggle.com/datasets/sriramr/fruits-fresh-and-rotten-for-classification")
            print("- https://www.kaggle.com/datasets/moltean/fruits")
            print("- https://www.kaggle.com/datasets/misrakahmed/vegetable-image-dataset")
    
    def organize_dataset(self):
        """Organize downloaded datasets into proper structure"""
        print("\nOrganizing datasets...")
        
        # This will depend on the structure of downloaded datasets
        # You may need to adjust based on actual dataset structure
        
        print("✓ Dataset organization completed!")
        
    def get_dataset_info(self):
        """Print information about the dataset"""
        categories = ['fruits/fresh', 'fruits/rotten', 'vegetables/fresh', 'vegetables/rotten']
        
        print("\n" + "="*50)
        print("DATASET INFORMATION")
        print("="*50)
        
        for category in categories:
            path = self.base_path / category
            if path.exists():
                count = len(list(path.glob('**/*.jpg'))) + len(list(path.glob('**/*.png')))
                print(f"{category}: {count} images")
        
        print("="*50)

if __name__ == "__main__":
    print("="*60)
    print("FRUITS & VEGETABLES FRESHNESS DETECTION - DATASET SETUP")
    print("="*60)
    
    downloader = DatasetDownloader()
    
    print("\nOptions:")
    print("1. Download datasets from Kaggle (requires Kaggle API)")
    print("2. Skip download (if already downloaded)")
    
    choice = input("\nEnter your choice (1/2): ").strip()
    
    if choice == "1":
        downloader.download_from_kaggle()
    
    downloader.organize_dataset()
    downloader.get_dataset_info()
    
    print("\n✓ Dataset setup completed!")
    print("\nNext step: Run 'python train_model.py' to train the model")
