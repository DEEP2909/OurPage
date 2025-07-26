import os
import logging
from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.middleware.proxy_fix import ProxyFix

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "romantic-dashboard-secret-key")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# In-memory storage for special dates (for now)
SPECIAL_DATES = [
    {"id": 1, "name": "First Talk Anniversary", "month": 9, "day": 22, "year": 2023, "is_custom": False},
    {"id": 2, "name": "Prachi's Birthday", "month": 1, "day": 6, "year": 2004, "is_custom": False},
    {"id": 3, "name": "Deep's Birthday", "month": 9, "day": 29, "year": 2004, "is_custom": False},
    {"id": 4, "name": "Expressed Feelings Anniversary", "month": 11, "day": 8, "year": 2023, "is_custom": False},
    {"id": 5, "name": "Proposal Day Anniversary", "month": 11, "day": 24, "year": 2023, "is_custom": False},
    {"id": 6, "name": "First Met Anniversary", "month": 11, "day": 15, "year": 2023, "is_custom": False},
    {"id": 7, "name": "First Kiss Anniversary", "month": 5, "day": 5, "year": 2024, "is_custom": False}
]

# Counter for new IDs
next_id = 8

@app.route('/')
def dashboard():
    """Serve the main dashboard page"""
    weather_api_key = os.environ.get('OPENWEATHER_API_KEY', '')
    return render_template('index.html', weather_api_key=weather_api_key)

@app.route('/api/special-dates', methods=['GET'])
def get_special_dates():
    """Get all special dates"""
    try:
        return jsonify(SPECIAL_DATES)
    except Exception as e:
        logging.error(f"Error fetching special dates: {str(e)}")
        return jsonify({'error': 'Failed to fetch dates'}), 500

@app.route('/api/special-dates', methods=['POST'])
def add_special_date():
    """Add a new special date"""
    global next_id
    try:
        data = request.get_json()
        
        new_date = {
            "id": next_id,
            "name": data['name'],
            "month": data['month'],
            "day": data['day'],
            "year": data['year'],
            "is_custom": True
        }
        
        SPECIAL_DATES.append(new_date)
        next_id += 1
        
        return jsonify({'success': True, 'date': new_date})
    except Exception as e:
        logging.error(f"Error adding special date: {str(e)}")
        return jsonify({'error': 'Failed to add date'}), 500

@app.route('/api/special-dates/<int:date_id>', methods=['PUT'])
def update_special_date(date_id):
    """Update a special date"""
    try:
        date = next((d for d in SPECIAL_DATES if d['id'] == date_id), None)
        if not date:
            return jsonify({'error': 'Date not found'}), 404
        
        data = request.get_json()
        
        date['name'] = data['name']
        date['month'] = data['month']
        date['day'] = data['day']
        date['year'] = data['year']
        
        return jsonify({'success': True, 'date': date})
    except Exception as e:
        logging.error(f"Error updating special date: {str(e)}")
        return jsonify({'error': 'Failed to update date'}), 500

@app.route('/api/special-dates/<int:date_id>', methods=['DELETE'])
def delete_special_date(date_id):
    """Delete a special date"""
    try:
        date = next((d for d in SPECIAL_DATES if d['id'] == date_id), None)
        if not date:
            return jsonify({'error': 'Date not found'}), 404
        
        # Don't allow deletion of default dates
        if not date['is_custom']:
            return jsonify({'error': 'Cannot delete default dates'}), 400
        
        SPECIAL_DATES.remove(date)
        
        return jsonify({'success': True})
    except Exception as e:
        logging.error(f"Error deleting special date: {str(e)}")
        return jsonify({'error': 'Failed to delete date'}), 500

@app.route('/upload-photo', methods=['POST'])
def upload_photo():
    """Handle photo upload for background"""
    try:
        if 'photo' not in request.files:
            return jsonify({'error': 'No photo file provided'}), 400
        
        file = request.files['photo']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            # For this implementation, we'll return success
            # In a production environment, you'd save the file
            return jsonify({'success': True, 'message': 'Photo uploaded successfully'})
        else:
            return jsonify({'error': 'Invalid file type. Please upload an image.'}), 400
    
    except Exception as e:
        logging.error(f"Error uploading photo: {str(e)}")
        return jsonify({'error': 'Failed to upload photo'}), 500

def allowed_file(filename):
    """Check if uploaded file is an allowed image type"""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory('static', filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
