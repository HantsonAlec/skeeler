import eventlet
eventlet.monkey_patch()
import os
from functools import wraps
import json
from os import environ as env
from werkzeug.exceptions import HTTPException
import time
from dotenv import load_dotenv, find_dotenv
from flask import Flask
from flask import jsonify
from flask import redirect
from flask import render_template
from flask import session
from flask import url_for
from flask_socketio import SocketIO
from authlib.integrations.flask_client import OAuth
from six.moves.urllib.parse import urlencode
from flask_cors import CORS
import constants
import random
import requests
ENV_FILE = find_dotenv()
if ENV_FILE:
    load_dotenv(ENV_FILE)

AUTH0_CALLBACK_URL = env.get(constants.AUTH0_CALLBACK_URL)
AUTH0_CLIENT_ID = env.get(constants.AUTH0_CLIENT_ID)
AUTH0_CLIENT_SECRET = env.get(constants.AUTH0_CLIENT_SECRET)
AUTH0_DOMAIN = env.get(constants.AUTH0_DOMAIN)
AUTH0_BASE_URL = 'https://' + str(AUTH0_DOMAIN)
AUTH0_AUDIENCE = env.get(constants.AUTH0_AUDIENCE)

template_dir = os.path.dirname(os.path.dirname(os.path.abspath(os.path.dirname(__file__))))
template_dir = os.path.join(template_dir, 'Frontend')
template_dir = os.path.join(template_dir, 'templates')
print(template_dir)
style_dir = os.path.dirname(os.path.dirname(os.path.abspath(os.path.dirname(__file__))))
style_dir = os.path.join(style_dir, 'Frontend')
print(style_dir)
app = Flask(__name__, static_url_path='', static_folder=style_dir,template_folder=template_dir)
app.secret_key = constants.SECRET_KEY
app.debug = True

active_user=''
acces_allowed=True
@app.errorhandler(Exception)
def handle_auth_error(ex):
    response = jsonify(message=str(ex))
    response.status_code = (ex.code if isinstance(ex, HTTPException) else 500)
    return response

app.config['SECRET_KEY'] = 'the random string'
socketio = SocketIO(app, cors_allowed_origins="*",async_mode="eventlet")
CORS(app)
oauth = OAuth(app)

auth0 = oauth.register(
    'auth0',
    client_id=AUTH0_CLIENT_ID,
    client_secret=AUTH0_CLIENT_SECRET,
    api_base_url=AUTH0_BASE_URL,
    access_token_url=AUTH0_BASE_URL + '/oauth/token',
    authorize_url=AUTH0_BASE_URL + '/authorize',
    client_kwargs={
        'scope': 'openid profile email',
    },
)


def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if constants.PROFILE_KEY not in session:
            return redirect('/login')
        return f(*args, **kwargs)

    return decorated


# Controllers API
@app.route('/')
@requires_auth
def home():
    return render_template('index.html',
                           userinfo=session[constants.PROFILE_KEY],
                           userinfo_pretty=json.dumps(session[constants.JWT_PAYLOAD], indent=4))


@app.route('/callback')
def callback_handling():
    auth0.authorize_access_token()
    resp = auth0.get('userinfo')
    userinfo = resp.json()

    session[constants.JWT_PAYLOAD] = userinfo
    session[constants.PROFILE_KEY] = {
        'user_id': userinfo['sub'],
        'name': userinfo['name'],
        'email': userinfo['email'],
        'picture': userinfo['picture'],
        'nickname': userinfo['nickname'],
    }
    return redirect('/')


@app.route('/login')
def login():
    return auth0.authorize_redirect(redirect_uri=AUTH0_CALLBACK_URL, audience=AUTH0_AUDIENCE)


@app.route('/logout')
def logout():
    session.clear()
    params = {'returnTo': url_for('home', _external=True), 'client_id': AUTH0_CLIENT_ID}
    return redirect(auth0.api_base_url + '/v2/logout?' + urlencode(params))

@app.route('/play')
@requires_auth
def play():
    return render_template('play.html',
                           userinfo=session[constants.PROFILE_KEY],
                           userinfo_pretty=json.dumps(session[constants.JWT_PAYLOAD], indent=4))

@socketio.on('F2B_on_play')
def on_play(value):
    global active_user,acces_allowed
    
    if (active_user == ''):
        active_user = value
        acces_allowed=True
    elif (active_user == value):
        acces_allowed = True
    else:
        acces_allowed=False
    print(acces_allowed)
    print(active_user)
    socketio.emit('B2F_acces_to_play',json.dumps({"user":active_user,"acces":acces_allowed}))
    
@socketio.on('F2B_on_index')
def on_index(value):
    global active_user, acces_allowed
    if (active_user == value):
        active_user = ''
        acces_allowed = True
    print(acces_allowed)
    print(active_user)
        
if __name__ == "__main__":
    try:
        socketio.run(app,debug=True,host='0.0.0.0',use_reloader=False, port=env.get('PORT', 8000))
    finally:
        pass
