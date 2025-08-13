import os
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()

def setup_db(app):
    database_path = os.environ.get('DATABASE_URL', "postgresql://postgres:MilanxSithu@@db.jgbeylkokitzowmmpdjw.supabase.co:5432/postgres/programming_dashboard")
    app.config['SQLALCHEMY_DATABASE_URI'] = database_path
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.app = app
    db.init_app(app)
    migrate.init_app(app, db)
    return db

def rollback():
    db.session.rollback()