# Model Downloader for ComfyUI
import os
import urllib.request
import sys

def download_file(url, dest_path):
    if os.path.exists(dest_path):
        print(f"File already exists: {dest_path}. Skipping.")
        return True
    
    print(f"Downloading {url} to {dest_path}...")
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    
    # Progress callback
    def progress_callback(blocks, block_size, total_size):
        downloaded = blocks * block_size
        percent = min(100, (downloaded / total_size) * 100)
        sys.stdout.write(f"\rProgress: {percent:.1f}% ({downloaded / (1024*1024):.1f}MB / {total_size / (1024*1024):.1f}MB)")
        sys.stdout.flush()

    try:
        urllib.request.urlretrieve(url, dest_path, progress_callback)
        print("\nDownload completed successfully!")
        return True
    except Exception as e:
        print(f"\nDownload failed: {e}")
        return False

if __name__ == "__main__":
    checkpoint_url = "https://huggingface.co/ckpt/rev-animated/resolve/main/revAnimated_v11-inpainting.safetensors"
    dest = "C:\\Users\\SE\\ComfyUI\\models\\checkpoints\\revAnimated_v11-inpainting.safetensors"
    download_file(checkpoint_url, dest)
