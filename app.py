#!/usr/bin/env python

from flask import Flask, redirect, url_for, render_template, flash


# Flask app should start in global layout
app = Flask(__name__, static_url_path='')




@app.route('/')
def index():
    return render_template('index.html')



if __name__ == '__main__':
    port = 5000
    print('Starting app on port %d' % port)
    db.create_all()
    app.run(debug=True, port=port, host='0.0.0.0')
    url_for('static', filename='app.js')
    url_for('static', filename='app.css')
