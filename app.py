#!/usr/bin/env python

from flask import Flask, redirect, url_for, render_template, jsonify
from pyproj import Proj, transform
import requests

# Flask app should start in global layout
app = Flask(__name__, static_url_path='')
wgs84 = Proj(init='EPSG:4326')



@app.route('/')
def index():
    return render_template('index.html')

@app.route('/test')
def convert():

    url = 'https://nassgeodata.gmu.edu/axis2/services/CDLService/GetCDLValue'

    querystring = {'year':'2010','x':'1551459.363','y':'1909201.537'}

    response = requests.request('GET', url, params=querystring)

    print(response.text)
    return jsonify(wgs84(50, 50)) # lon, lat

if __name__ == '__main__':
    port = 5000
    print('Starting app on port %d' % port)
    app.run(debug=True, port=port, host='0.0.0.0')
    url_for('static', filename='app.js')
    url_for('static', filename='app.css')
