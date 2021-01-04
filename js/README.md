Core contains the browser side databases, and the operations on that databases.

There are 2 databases: `SimDB` and `WaveformDB`. These databases are static (only one instance exists)

 - SimDB is the simulation database. This contains all simulation objects (modules, registers) with their hierarchical position.
 - WaveformDB contains all object which is wisible on the waveform. (It may contains the same object multiple times.)

The `SimDB` contains references to (multiple) `SimObject`-s, which represents one particular
simulation object (a module or a register). The most general `SimObject` is a signalObject, which
contains a reference to an instance of a `Signal` class. The `Signal` contains the `wave` property,
which is the value-change-list of the given signal. Note that multiple `SimObject` can point the
same `Signal` instance. (The same clock signal can occure in all modules with different name)

The `WaveformDB` contains references to (multiple) `WaveformRow`-s. Each `WaveformRow` describes one
row in the Waveform window. The most general `WaveformRow` points to a `SimObject` (a signalObject),
which contains the value-change-list to be plot.
