from backend.database import db

class Language(db.Model):
    __tablename__ = 'languages'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False, unique=True)
    icon = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    progress = db.relationship('Progress', backref='language', lazy=True)
    sections = db.relationship('Section', backref='language', lazy=True)

class Section(db.Model):
    __tablename__ = 'sections'
    
    id = db.Column(db.Integer, primary_key=True)
    language_id = db.Column(db.Integer, db.ForeignKey('languages.id'), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    order = db.Column(db.Integer)
    
    subsections = db.relationship('Subsection', backref='section', lazy=True)

class Subsection(db.Model):
    __tablename__ = 'subsections'
    
    id = db.Column(db.Integer, primary_key=True)
    section_id = db.Column(db.Integer, db.ForeignKey('sections.id'), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    content = db.Column(db.Text)
    is_completed = db.Column(db.Boolean, default=False)
    order = db.Column(db.Integer)

class Progress(db.Model):
    __tablename__ = 'progress'
    
    id = db.Column(db.Integer, primary_key=True)
    language_id = db.Column(db.Integer, db.ForeignKey('languages.id'), nullable=False)
    overall_percentage = db.Column(db.Float, default=0)
    last_updated = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
    
    @classmethod
    def update_progress(cls, language_id):
        language = Language.query.get(language_id)
        if not language:
            return None
        
        total_subsections = 0
        completed_subsections = 0
        
        for section in language.sections:
            for subsection in section.subsections:
                total_subsections += 1
                if subsection.is_completed:
                    completed_subsections += 1
        
        progress = cls.query.filter_by(language_id=language_id).first()
        if not progress:
            progress = cls(language_id=language_id)
            db.session.add(progress)
        
        if total_subsections > 0:
            progress.overall_percentage = (completed_subsections / total_subsections) * 100
        else:
            progress.overall_percentage = 0
        
        db.session.commit()
        return progress
