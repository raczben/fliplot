#!/usr/bin/env python3

import os
import sys
import logging
import argparse
import json
import http.server
from io import BytesIO
import socketserver

here = os.path.dirname(os.path.realpath(__file__))
sys.path.append(os.path.join(here, '..'))

from fliplot.core import parseFile, parseWith_vcdvcd

logging.basicConfig(format='%(asctime)s,%(msecs)d %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s',
    datefmt='%Y-%m-%d:%H:%M:%S',
    level=logging.DEBUG)

class MyHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def address_string(self):
        logging.info(f'address_string: {self.path}')
        host, _ = self.client_address[:2]
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
            fname = os.path.join(here, fname)
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
    parser.add_argument('--test', action='store_true', help='Test and exit')
    parser.add_argument('--ignore-test', action='store_true', help='Do not exit on failed test')
    parser.add_argument('--export-vcd', type=str, help='Export VCD file to parsed JSON')
    parser.add_argument('--port', nargs='?',
                        help='port of the server', type=int, default=7771)
    parser.add_argument('fname', nargs='?', default='wiki.vcd')

    args = parser.parse_args()

    if args.export_vcd:
        data = parseWith_vcdvcd(args.export_vcd)
        fname_no_ext = os.path.splitext(args.export_vcd)[0]
        with open(f'{fname_no_ext}_parsed.json', 'w') as outfile:
            json.dump(data, fp=outfile, indent=2, sort_keys=True)
        sys.exit(0)

    # Do test
    fname_no_ext = 'test/AxiRegTC_test_write'
    with open(f'{fname_no_ext}_parsed.json') as parsed_json_file:
        reference_data = json.load(parsed_json_file)
        data = parseWith_vcdvcd(f'{fname_no_ext}.vcd')
        reference_data = json.dumps(reference_data, sort_keys=True)
        data = json.dumps(data, sort_keys=True)
        if reference_data == data:
            print('Test Passed, reference matches')
        else:
            print('Test FAILED. Reference mismatches')
            if not args.ignore_test:
                sys.exit(-1)
    
    # Start the server
    if not args.test:
        PORT = args.port
        my_server = socketserver.TCPServer(("localhost", PORT), MyHttpRequestHandler)

        logging.info(f'start app server at port {PORT}')

        # Star the server
        my_server.serve_forever()
