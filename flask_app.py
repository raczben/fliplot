#!/usr/bin/env python3

import os
import logging

from flask import Flask, jsonify, send_file, request

from app import parseFile

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

@app.route('/')
def static_file():
    return send_file('index.html')

@app.route('/parse-vcd', methods = ['POST'])
def parse_vcd():
    content = None
    fname = None

    try:
        content = request.json['content']
    except:
        fname = request.json['fname']

    logging.info(f'open file to parse: {fname}')

    try:
        data = parseFile(fname, content)
        return jsonify(data)  
    except Exception as e:
        logging.info(f'Error: {e}')
    
@app.route('/<path:path>')
def send_f(path):
    return send_file(path)

    
if __name__ == "__main__":
    app.run()
