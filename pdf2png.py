#!/user/bin/env python3
# -*- coding: utf-8 -*-
import os
from pdf2image import convert_from_path
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
import numpy as np


def pdf_to_png(folder_path, output_path, dpi=600, crop_white=True):
    for root, dirs, files in os.walk(folder_path):
        if not os.path.exists(output_path):
            os.makedirs(output_path)
        
        for file in files:
            if not file.endswith(".pdf"):
                continue
            
            pdf_file_path = os.path.join(root, file)
            file_name = os.path.splitext(file)[0]
            
            try:
                images = convert_from_path(pdf_file_path, dpi=dpi)
            except Exception as e:
                print(f"Error converting {file}: {e}")
                continue
            
            for i, image in enumerate(images):
                if crop_white:
                    gray_image = image.convert("L")
                    gray_array = np.array(gray_image)
                    threshold = 240
                    mask = gray_array < threshold
                    if mask.any():
                        coords = np.column_stack(np.where(mask))
                        y0, x0 = coords.min(axis=0)
                        y1, x1 = coords.max(axis=0)
                        image = image.crop((x0, y0, x1 + 1, y1 + 1))
                
                if len(images) > 1:
                    png_file = os.path.join(output_path, f"{file_name}_page_{i + 1}.png")
                else:
                    png_file = os.path.join(output_path, f"{file_name}.png")
                
                image.save(png_file, 'PNG')
                print(f"Saved: {png_file}")


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Convert PDF files to PNG images')
    parser.add_argument('input', help='Input folder path containing PDF files')
    parser.add_argument('output', help='Output folder path for PNG images')
    parser.add_argument('--dpi', type=int, default=600, help='DPI for conversion (default: 600)')
    parser.add_argument('--no-crop', action='store_true', help='Disable white border cropping')
    
    args = parser.parse_args()
    
    pdf_to_png(args.input, args.output, dpi=args.dpi, crop_white=not args.no_crop)