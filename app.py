#!/usr/bin/env python

from flask import Flask, redirect, url_for, render_template, jsonify, g, request
from pyproj import Proj, transform
import sqlite3, csv, requests

# Flask app should start in global layout
app = Flask(__name__, static_url_path='')
wgs84 = Proj(init='EPSG:4326')

# db stuff

DATABASE = 'spaceapps.db'

def init_db():
    with app.app_context():
        db = get_db()
        with app.open_resource('init.sql', mode='r') as f:
            db.cursor().executescript(f.read())

        with open('test_aggregated_crops.csv','rb') as fin:
            # csv.DictReader uses first line in file for column headings by default
            datarow = csv.DictReader(fin) # comma is default delimiter
            to_db = [(i['lat'], i['lng'], i['type'], i['ct']) for i in datarow]

        db.cursor().executemany('INSERT INTO CropData (lat, lng, type, ct) VALUES (?, ?, ?, ?);', to_db)

        with open('test_aggregated_crops_predicted.csv', 'rb') as fin:
            datarow = csv.DictReader(fin) # comma is default delimiter
            to_db = [(i['lat'], i['lng'], i['type'], i['ct_use_normed']) for i in datarow]

        db.cursor().executemany('INSERT INTO PredictedCropData (lat, lng, type, ct) VALUES (?, ?, ?, ?);', to_db)

        db.commit()

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv

# routes

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/points', methods=['GET'])
def getPoints():
    lat_1 = request.args.get('lat_1')
    lat_2 = request.args.get('lat_2')
    lon_1 = request.args.get('lon_1')
    lon_2 = request.args.get('lon_2')
    query = 'SELECT * FROM CropData WHERE lat > ? AND lat < ? AND lng > ? AND lng < ?'
    results = query_db(query, [lat_1, lat_2, lon_1, lon_2])
    curr_points = []
    for point in results:
        curr_points.append({ 'id': point[0], 'lat': point[1], 'lng': point[2], 'type': point[3], 'ct': point[4] })

    query = 'SELECT * FROM PredictedCropData where lat > ? AND lat < ? AND lng > ? AND lng < ?'
    results = query_db(query, [lat_1, lat_2, lon_1, lon_2])
    pred_points = []
    for point in results:
        pred_points.append({ 'id': point[0], 'lat': point[1], 'lng': point[2], 'type': point[3], 'ct': point[4] })

    ret_dict = dict()
    ret_dict['current'] = curr_points
    ret_dict['predicted'] = pred_points

    return jsonify(ret_dict)

@app.route('/anothertest')
def wheee():
    return jsonify(query_db('SELECT * FROM CropData'))

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
    init_db()
    app.run(debug=True, port=port, host='0.0.0.0')
    url_for('static', filename='app.js')
    url_for('static', filename='app.css')
