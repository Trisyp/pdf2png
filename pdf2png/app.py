#!/user/bin/env python3
# -*- coding: utf-8 -*-
import os
import uuid
import shutil
import zipfile
import io
from flask import Flask, render_template, request, jsonify, send_file
from pdf2image import convert_from_path
from PIL import Image
import numpy as np
from werkzeug.utils import secure_filename
import tarfile
import rarfile

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'outputs'

ALLOWED_EXTENSIONS = {'pdf', 'zip', 'rar', '7z', 'tar', 'gz'}
ALLOWED_PDF = {'pdf'}

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)


def allowed_file(filename):
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    return ext in ALLOWED_EXTENSIONS


def crop_white_border(image):
    gray_image = image.convert("L")
    gray_array = np.array(gray_image)
    threshold = 240
    mask = gray_array < threshold
    if mask.any():
        coords = np.column_stack(np.where(mask))
        y0, x0 = coords.min(axis=0)
        y1, x1 = coords.max(axis=0)
        return image.crop((x0, y0, x1 + 1, y1 + 1))
    return image


def extract_archive(file_path, extract_to):
    ext = file_path.rsplit('.', 1)[-1].lower()
    
    try:
        if ext == 'zip':
            with zipfile.ZipFile(file_path, 'r') as zf:
                zf.extractall(extract_to)
        elif ext == 'tar':
            with tarfile.open(file_path, 'r') as tf:
                tf.extractall(extract_to)
        elif ext == 'gz':
            with tarfile.open(file_path, 'r:gz') as tf:
                tf.extractall(extract_to)
        elif ext == 'rar':
            with rarfile.RarFile(file_path, 'r') as rf:
                rf.extractall(extract_to)
        elif ext == '7z':
            import py7zr
            with py7zr.SevenZipFile(file_path, 'r') as szf:
                szf.extractall(extract_to)
        else:
            return False
        return True
    except Exception as e:
        print(f"Extract error: {e}")
        return False


def find_pdf_files(directory):
    pdf_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith('.pdf'):
                pdf_files.append(os.path.join(root, file))
    return pdf_files


def convert_pdf_to_png(pdf_path, output_dir, dpi=600, crop=True):
    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    
    try:
        images = convert_from_path(pdf_path, dpi=dpi)
        output_files = []
        
        for i, image in enumerate(images):
            if crop:
                image = crop_white_border(image)
            
            if len(images) > 1:
                output_name = f"{base_name}_page_{i + 1}.png"
            else:
                output_name = f"{base_name}.png"
            
            output_path = os.path.join(output_dir, output_name)
            image.save(output_path, 'PNG')
            output_files.append({
                'name': output_name,
                'path': output_path,
                'page': i + 1,
                'source': os.path.basename(pdf_path)
            })
        
        return output_files
    except Exception as e:
        print(f"Convert error for {pdf_path}: {e}")
        return []


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/convert', methods=['POST'])
def convert():
    files = request.files.getlist('files')
    
    if not files or all(f.filename == '' for f in files):
        return jsonify({'error': 'No files provided'}), 400
    
    session_id = str(uuid.uuid4())
    upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
    output_dir = os.path.join(app.config['OUTPUT_FOLDER'], session_id)
    temp_dir = os.path.join(upload_dir, 'temp')
    
    os.makedirs(upload_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(temp_dir, exist_ok=True)
    
    dpi = int(request.form.get('dpi', 600))
    crop = request.form.get('crop', 'true').lower() == 'true'
    
    all_pdf_files = []
    
    try:
        for file in files:
            if file.filename == '':
                continue
            
            filename = secure_filename(file.filename)
            ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
            file_path = os.path.join(upload_dir, filename)
            file.save(file_path)
            
            if ext == 'pdf':
                all_pdf_files.append(file_path)
            elif ext in {'zip', 'rar', '7z', 'tar', 'gz'}:
                extract_dir = os.path.join(temp_dir, os.path.splitext(filename)[0])
                os.makedirs(extract_dir, exist_ok=True)
                if extract_archive(file_path, extract_dir):
                    pdfs = find_pdf_files(extract_dir)
                    all_pdf_files.extend(pdfs)
        
        if not all_pdf_files:
            return jsonify({'error': 'No PDF files found'}), 400
        
        all_output_files = []
        total_pages = 0
        
        for pdf_path in all_pdf_files:
            output_files = convert_pdf_to_png(pdf_path, output_dir, dpi, crop)
            all_output_files.extend(output_files)
            total_pages += len(output_files)
        
        shutil.rmtree(temp_dir, ignore_errors=True)
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'files': all_output_files,
            'total_pages': total_pages,
            'total_pdfs': len(all_pdf_files)
        })
    
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        return jsonify({'error': str(e)}), 500


@app.route('/download/<session_id>/<filename>')
def download_file(session_id, filename):
    output_dir = os.path.join(app.config['OUTPUT_FOLDER'], session_id)
    return send_file(os.path.join(output_dir, filename), as_attachment=True)


@app.route('/download_all/<session_id>')
def download_all(session_id):
    output_dir = os.path.join(app.config['OUTPUT_FOLDER'], session_id)
    
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for filename in os.listdir(output_dir):
            if filename.endswith('.png'):
                file_path = os.path.join(output_dir, filename)
                zip_file.write(file_path, filename)
    
    zip_buffer.seek(0)
    return send_file(
        zip_buffer,
        mimetype='application/zip',
        as_attachment=True,
        download_name='converted_images.zip'
    )


@app.route('/preview/<session_id>/<filename>')
def preview(session_id, filename):
    output_dir = os.path.join(app.config['OUTPUT_FOLDER'], session_id)
    return send_file(os.path.join(output_dir, filename))


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=2603)