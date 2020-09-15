#!/usr/bin/env python3

import os
import sys
import logging
import argparse
import json
import http.server
from io import BytesIO
import socketserver

vcdParsers = []
try:
    from pyDigitalWaveTools.vcd.parser import VcdParser
    vcdParsers.append('pyDigitalWaveTools')
except:
    pass
try:
    from vcdvcd import VCDVCD
    vcdParsers.append('vcdvcd')
except:
    pass

if not vcdParsers:
    print('Error no VCD parser has been found...')
    sys.exit(-1)

print(f'Available VCD parsers: {vcdParsers}')


logging.basicConfig(level=logging.INFO)


def renameKey(dictionary, oldkey, newkey):
    if newkey != oldkey:
        dictionary[newkey] = dictionary[oldkey]
        del dictionary[oldkey]


def format_pyDigitalWaveTools(data):
    now = [0]

    def traverse(node, hierlist):
        name = node['type']['name']
        del node['type']['name']
        node.update(node['type'])
        node['type'] = name
        try:
            for c in node['children']:
                traverse(c, hierlist+[node['name']])
        except KeyError:
            # No child:
            node['hierarcy'] = hierlist
            node['wave'] = [{'time': item[0], 'val': item[1]}
                            for item in node['data']]
            del node['data']
            now[0] = max(node['wave'][-1]['time'], now[0])
            
        return node

    ret = traverse(data, [])
    ret['now'] = now[0]
    return ret


def format_vcdvcd(data):
    now = [0]

    for vcdID, signal in data.items():

        try:
            renameKey(signal, 'var_type', 'type')
            renameKey(signal, 'size', 'width')
            
            try:
                signal['wave'] = [{'time': item[0], 'val': item[1]}
                                    for item in signal['tv']]
                del signal['tv']
                now[0] = max(signal['wave'][-1]['time'], now[0])
            except KeyError:
                signal['wave'] = []
                

            signal['vcdid'] = vcdID
            signal['hierarcy'] = signal['references'][0].split('.')
            signal['name'] = signal['hierarcy'][-1]
            del signal['hierarcy'][-1]
        except:
            print(f'Error at: {vcdID}')
            raise

    return {
        'children': list(data.values()),
        "name": "dduummyy",
        "now": now[0],
        "type": "struct"
        }


def parseWith_pyDigitalWaveTools(fname):
    with open(fname) as vcd_file:
        vcd = VcdParser()
        vcd.parse(vcd_file)
        data = vcd.scope.toJson()
        return format_pyDigitalWaveTools(data)

def parseWith_vcdvcd(fname):
    vcd = VCDVCD(fname)
    data = vcd.get_data()
    return format_vcdvcd(data)

def parseFile(fname):
    try:
        print('Parse with parseWith_vcdvcd...')
        ret = parseWith_vcdvcd(fname)
        print('Parse with parseWith_vcdvcd... OK')
    except Exception as ex:
        print(ex)
        print('Parse with parseWith_pyDigitalWaveTools...')
        ret = parseWith_pyDigitalWaveTools(fname)
        print('Parse with parseWith_pyDigitalWaveTools... OK')

    return ret


class MyHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def address_string(self):
        logging.info(f'address_string: {self.path}')
        host, port = self.client_address[:2]
        #return socket.getfqdn(host)
        return host

    def do_GET(self):
        logging.info(f'do_GET: {self.path}')
        if self.path == '/':
            self.path = 'index.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        logging.info(f'self.path: {self.path}')
        if self.path == '/parse-vcd':
            content_length = int(self.headers['Content-Length'])
            content = self.rfile.read(content_length)
            logging.info(f'Content: {content}')
            content_json = json.loads(content)
            fname = content_json['fname']

            logging.info(f'open file to parse: {fname}')

            try:
                data = parseFile(fname)
                self.send_response(200)
                self.send_header("Content-type", "text/html")
                self.end_headers()
                response = BytesIO()
                response.write(json.dumps(data).encode())
                self.wfile.write(response.getvalue())
            except Exception as e:
                logging.info(f'Error: {e}')
                self.send_error(500, f'Error: {e}')

        else:
            logging.info(f'path not found: {self.path}')
            self.send_error(404, f'path not found: {self.path}')


if __name__ == '__main__':

    parser = argparse.ArgumentParser(description='VCD Parser Server')
    parser.add_argument('--test', action='store_true', help='Test mode')
    parser.add_argument('--port', nargs='?',
                        help='port of the server', type=int, default=7771)
    parser.add_argument('fname', nargs='?', default='wiki.vcd')

    args = parser.parse_args()

    if args.test:
        data = parseWith_vcdvcd(args.fname)
        print(json.dumps(data,  indent=2, sort_keys=True))
        print()
        print()
        print()
        print()
        data = parseFile(args.fname)
        # data = parseFile('AxiRegTC_test_write.vcd')
        # data = parseFile('wiki.vcd')
        # print(data)
        print(json.dumps(data,  indent=2, sort_keys=True))

    else:
        

        PORT = args.port
        my_server = socketserver.TCPServer(("localhost", PORT), MyHttpRequestHandler)

        logging.info(f'start app server at port {PORT}')

        # Star the server
        my_server.serve_forever()
