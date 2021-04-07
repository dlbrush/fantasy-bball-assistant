from flask import Flask, render_template, redirect
from flask_debugtoolbar import DebugToolbarExtension
from models import db, connect_db

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql:///feedback"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ECHO"] = True
app.config["SECRET_KEY"] = "giannis4MVP"
# app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False

connect_db(app)

toolbar = DebugToolbarExtension(app)