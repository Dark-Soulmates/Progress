from flask import Flask, jsonify, request
from flask_cors import CORS
from backend.database import setup_db
from backend.models import db, Language, Section, Subsection, Progress
import os

app = Flask(__name__)
CORS(app)
setup_db(app)

# Helper method to format errors
def format_error(status, message):
    return jsonify({
        'success': False,
        'error': status,
        'message': message
    }), status

@app.route('/')
def index():
    return "Welcome to Programming Learning Dashboard API"

# Languages endpoints
@app.route('/languages', methods=['GET'])
def get_languages():
    try:
        languages = Language.query.order_by(Language.name).all()
        formatted_languages = [language.short() for language in languages]
        return jsonify({
            'success': True,
            'languages': formatted_languages,
            'total': len(formatted_languages)
        })
    except Exception as e:
        return format_error(500, str(e))

@app.route('/languages/<int:language_id>', methods=['GET'])
def get_language(language_id):
    try:
        language = Language.query.get(language_id)
        if language is None:
            return format_error(404, 'Language not found')
        
        sections = Section.query.filter_by(language_id=language_id).order_by(Section.order).all()
        formatted_sections = []
        
        for section in sections:
            subsections = Subsection.query.filter_by(section_id=section.id).order_by(Subsection.order).all()
            formatted_subsections = [subsection.short() for subsection in subsections]
            
            formatted_sections.append({
                'id': section.id,
                'title': section.title,
                'order': section.order,
                'subsections': formatted_subsections
            })
        
        progress = Progress.query.filter_by(language_id=language_id).first()
        if not progress:
            progress = Progress.update_progress(language_id)
        
        return jsonify({
            'success': True,
            'language': {
                'id': language.id,
                'name': language.name,
                'icon': language.icon,
                'progress': progress.overall_percentage if progress else 0,
                'sections': formatted_sections
            }
        })
    except Exception as e:
        return format_error(500, str(e))

@app.route('/languages', methods=['POST'])
def create_language():
    try:
        body = request.get_json()
        if not body:
            return format_error(400, 'Invalid request body')
        
        name = body.get('name')
        icon = body.get('icon')
        
        if not name:
            return format_error(400, 'Language name is required')
        
        language = Language(name=name, icon=icon)
        language.insert()
        
        return jsonify({
            'success': True,
            'created': language.id
        })
    except Exception as e:
        return format_error(500, str(e))

# Similar endpoints for sections and subsections would follow...

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)