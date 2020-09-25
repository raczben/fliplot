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
    print(request.json)

    fname = request.json['fname']
    logging.info(f'open file to parse: {fname}')

    try:
        data = parseFile(fname)
        return jsonify(data)  
    except Exception as e:
        logging.info(f'Error: {e}')
        # self.send_error(500, f'Error: {e}')



    # d = {'a':123}
    # return jsonify(d)   
     
    
@app.route('/<path:path>')
def send_f(path):
    return send_file(path)

    
if __name__ == "__main__":
    app.run()
