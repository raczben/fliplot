#!/usr/bin/env python3

import os
import sys

vcdParsers = []
try:
    from pyDigitalWaveTools.vcd.parser import VcdParser
    vcdParsers.append('pyDigitalWaveTools')
except ModuleNotFoundError:
    pass
try:
    from .vcdvcd import VCDVCD
    vcdParsers.append('vcdvcd')
except ModuleNotFoundError:
    pass

if not vcdParsers:
    print('Error no VCD parser has been found...')
    sys.exit(-1)

print(f'Available VCD parsers: {vcdParsers}')
here = os.path.dirname(os.path.realpath(__file__))


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

def parseWith_vcdvcd(fname=None, content=None):
    vcd = VCDVCD(fname, content)
    data = vcd.get_data()
    return format_vcdvcd(data)

def parseFile(fname=None, content=None):
    try:
        print('Parse with parseWith_vcdvcd...')
        ret = parseWith_vcdvcd(fname, content)
        print('Parse with parseWith_vcdvcd... OK')
    except Exception as ex:
        print(ex)
        print('Parse with parseWith_pyDigitalWaveTools...')
        ret = parseWith_pyDigitalWaveTools(fname)
        print('Parse with parseWith_pyDigitalWaveTools... OK')

    return ret
