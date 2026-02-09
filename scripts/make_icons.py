import os
import sys
import argparse
from PIL import Image, ImageOps, ImageDraw

def make_pwa_icons(input_path, output_dir):
    img = Image.open(input_path)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # TRANSPARENCY WORKAROUND:
    # Since the input has a solid black background, we'll treat black as transparent.
    # We use a small threshold to avoid artifacts.
    datas = img.getdata()
    newData = []
    for item in datas:
        # If pixel is very close to black, make it transparent
        if item[0] < 10 and item[1] < 10 and item[2] < 10:
            newData.append((0, 0, 0, 0))
        else:
            newData.append(item)
    img.putdata(newData)

    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Standard Logo (PNG)
    img.save(os.path.join(output_dir, "logo.png"), "PNG")
    
    # 2. Favicon (32x32)
    # Using PNG instead of ICO for simplicity in this script, or just resize
    img.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(output_dir, "favicon.png"), "PNG")
    
    # 3. PWA Icons
    sizes = [192, 512]
    for size in sizes:
        # Standard
        icon = img.resize((size, size), Image.Resampling.LANCZOS)
        icon.save(os.path.join(output_dir, f"manifest-icon-{size}.png"), "PNG")
        
        # Maskable (add padding to ensure safe zone)
        padding = int(size * 0.1)
        inner_size = size - (2 * padding)
        
        maskable = Image.new('RGBA', (size, size), (15, 15, 15, 255)) # Dark gray
        logo_resized = img.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
        
        maskable.paste(logo_resized, (padding, padding), logo_resized)
        maskable.save(os.path.join(output_dir, f"manifest-icon-{size}.maskable.png"), "PNG")

    # 4. Apple Touch Icon
    apple_icon = Image.new('RGB', (180, 180), (15, 15, 15))
    logo_apple = img.resize((160, 160), Image.Resampling.LANCZOS)
    apple_icon.paste(logo_apple, (10, 10), logo_apple)
    apple_icon.save(os.path.join(output_dir, "apple-icon-180.png"), "PNG")

    print(f"Branding updated in {output_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("input", help="Path to input logo image")
    parser.add_argument("--out", default="resources", help="Output directory")
    args = parser.parse_args()
    
    make_pwa_icons(args.input, args.out)
