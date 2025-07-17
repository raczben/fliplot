Core contains the browser side databases, and the operations on that databases.

There are 2 databases: `SimDB` and `waveTable`. These databases are static (only one instance exists)

- SimDB is the simulation database. simDB is mainly the parsed VCD file.
  This contains all data from the simulation or from the VCD file. First of all it stores all
  signals with its values, the _now_ pointer, the VCD file name, etc...

- waveTable contains all object which is wisible on the waveform. (It may contains the same object
  multiple times.) waveTable is mainly the wave.do file. This stores the drawing config. It stores
  entries for each visualized signals (a reference to the simDB) stores the radix, signal type, and
  other plotting related information.

(Note, that if the same signal will be added twice to the wave-view, the simDB will be untouched.
Only a new waveTable-entry will be created with a reference to that signals simDB's entry.)

The `SimDB` contains references to (multiple) `SimObject`-s, which represents one particular
simulation object (a module or a register). The most general `SimObject` is a signalObject, which
contains a reference to an instance of a `Signal` class. The `Signal` contains the `wave` property,
which is the value-change-list of the given signal. Note that multiple `SimObject` can point the
same `Signal` instance. (The same clock signal can occure in all modules with different name)

The `waveTable` contains references to (multiple) `WaveformRow`-s. Each `WaveformRow` describes one
row in the Waveform window. The most general `WaveformRow` points to a `SimObject` (a signalObject),
which contains the value-change-list to be plot.
