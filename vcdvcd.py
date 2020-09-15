from __future__ import print_function

import math

class VCDVCD(object):

    # Verilog standard terminology.
    _VALUE = set(('0', '1', 'x', 'X', 'z', 'Z'))
    _VECTOR_VALUE_CHANGE = set(('b', 'B', 'r', 'R'))

    def __init__(
        self,
        vcd_path,
        only_sigs=False,
        print_deltas=False,
        print_dumps=False,
        print_dumps_deltas=True,
        # TODO: make the default None, and return empty in that case.
        signals=[],
        store_tvs=True,
    ):
        """
        Parse a VCD file, and store information about it in this object.

        The bulk of the parsed data can be obtained with :func:`parse_data`.

        :type vcd_path: str
        :param store_tv: if False, don't store time values in the data
                         Still parse them sequentially however, which may
                         make them be printed if printing is enabled.
                         This makes huge files more manageable, but prevents
                         fast random access.
        :type  store_tv: bool
        :param only_sigs: only parse the signal names under $scope and exit.
                        The return value will only contain the signals section.
                        This speeds up parsing if you only want the list of signals.
        :type  only_sigs: bool
        :type print_deltas: print the value of each signal change as hey are parsed
        :type print_deltas: bool
        :type print_dumps: print the value of all signals for each time
                           in which any tracked signal changes
        :type print_dumps: bool
        :type print_dumps_deltas: only dump selected signals if one of them just changed
        :type print_dumps_deltas: bool
        :param signals: only consider signals in this list.
                        If empty, all signals are considered.
                        Printing commands however will only print every wire
                        once with the first reference name found.
                        Any printing done uses this signal order.
                        If repeated signals are given, they are printed twice.
        :type  signals: List[str]
        :rtype: Dict[str,Any]
        """
        self._data = {}
        self._endtime = 0
        self._signals = []
        self._store_tvs = store_tvs
        self._signal_changed = False

        all_sigs = not signals
        cur_sig_vals = {}
        hier = []
        num_sigs = 0
        references_to_ids = {}
        references_to_widths = {}
        time = 0
        with open(vcd_path, 'r') as f:
            while True:
                line = f.readline()
                if line == '':
                    break
                line0 = line[0]
                line = line.strip()
                if line == '':
                    continue
                if line0 in self._VECTOR_VALUE_CHANGE:
                    value, identifier_code = line[1:].split()
                    self._add_value_identifier_code(
                        time, value, identifier_code,
                        print_deltas, print_dumps, cur_sig_vals
                    )
                elif line0 in self._VALUE:
                    value = line0
                    identifier_code = line[1:]
                    self._add_value_identifier_code(
                        time, value, identifier_code,
                        print_deltas, print_dumps, cur_sig_vals
                    )
                elif line0 == '#':
                    if print_dumps and (not print_dumps_deltas or self._signal_changed):
                        ss = []
                        ss.append('{}'.format(time))
                        for i, ref in enumerate(print_dumps_refs):
                            identifier_code = references_to_ids[ref]
                            value = cur_sig_vals[identifier_code]
                            ss.append('{0:>{1}s}'.format(self._to_hex(value), references_to_widths[ref]))
                        print(' '.join(ss))
                    time = int(line[1:])
                    self._endtime = time
                    self._signal_changed = False
                elif '$enddefinitions' in line:
                    if only_sigs:
                        break
                    if print_dumps:
                        print('0 time')
                        if signals:
                            print_dumps_refs = signals
                        else:
                            print_dumps_refs = sorted(self._data[i]['references'][0] for i in cur_sig_vals.keys())
                        for i, ref in enumerate(print_dumps_refs, 1):
                            print('{} {}'.format(i, ref))
                            if i == 0:
                                i = 1
                            identifier_code = references_to_ids[ref]
                            size = int(self._data[identifier_code]['size'])
                            width = max(((size // 4)), int(math.floor(math.log10(i))) + 1)
                            references_to_widths[ref] = width
                        print()
                        print('0 '.format(i, ), end='')
                        for i, ref in enumerate(print_dumps_refs, 1):
                            print('{0:>{1}d} '.format(i, references_to_widths[ref]), end='')
                        print()
                        print('=' * (sum(references_to_widths.values()) + len(references_to_widths) + 1))
                elif '$scope' in line:
                    hier.append(line.split()[2])
                elif '$upscope' in line:
                    hier.pop()
                elif '$var' in line:
                    ls = line.split()
                    type = ls[1]
                    size = ls[2]
                    identifier_code = ls[3]
                    name = ''.join(ls[4:-1])
                    path = '.'.join(hier)
                    reference = path + '.' + name
                    if (reference in signals) or all_sigs:
                        self._signals.append(reference)
                        if identifier_code not in self._data:
                            self._data[identifier_code] = {
                                'references': [],
                                'size': size,
                                'var_type': type,
                            }
                        self._data[identifier_code]['references'].append(reference)
                        references_to_ids[reference] = identifier_code
                        if print_dumps:
                            cur_sig_vals[identifier_code] = 'x'

    def get_data(self):
        """
        Get the main parsed VCD data.
        """
        return self._data

    def get_endtime(self):
        """
        Last timestamp present in the last parsed VCD.

        This can be extracted from the data, but we also cache while parsing.

        :rtype: int
        """
        return self._endtime

    def get_signals(self):
        """
        Get the set of unique signal names from the parsed VCD,
        in the order they are defined in the file.

        This can be extracted from the data, but we also cache while parsing.

        :rtype: List[str]
        """
        return self._signals

    def _add_value_identifier_code(
        self, time, value, identifier_code,
        print_deltas, print_dumps, cur_sig_vals
    ):
        if identifier_code in self._data:
            entry = self._data[identifier_code]
            self._signal_changed = True
            if self._store_tvs:
                if 'tv' not in entry:
                    entry['tv'] = []
                entry['tv'].append((time, value))
            if print_deltas:
                print("{} {} {}".format(time, self._to_hex(value), entry['references'][0]))
            if print_dumps:
                cur_sig_vals[identifier_code] = value

    @staticmethod
    def _to_hex(s):
        for c in s:
            if not c in '01':
                return c
        return hex(int(s, 2))[2:]
