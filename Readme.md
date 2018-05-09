
# Documentation
## MapUnit 
MapUnit is the abstraction for units on map(now it is cells and bridges)

```
MapUnit.id - unique id for cell
MapUnit.type - type of cell ('unknown' by default)
MapUnit.color - color of unit
MapUnit.setColor(vec4 newColor) - Sets color to cell 
```

## Cell
### Cell extends MapUnit
Cell is the abstraction for cell on map.
Cell is a hexagon.

```
Cell.type = 'cell'
Cell.connection - array of six connection to cell(undefined by default)
Cell.x - X coordinate of cell center
Cell.y - Y coordinate of cell center
```

## Bridge
### Bridge extends MapUnit
Bridge is abstraction for bridge between two cells.

```
Bridge.type = 'bridge'
Bridge.connect - array of two elements each is id of connected cells
```

## MapContainer
Big abstraction for map with all it functions.  
In some places MapContainer is state machine.

```
MapContainer.data - array of all MapUnits on map
MapContainer.idLength - preferred length for ids for data objects
MapContainer.sideLength - size of cell side
MapContainer.paintColor - current painting color
MapContainer.cellPoints - array with stored coordiantes for cell points
MapContainer.getId() - returns new id for MapUnit(maybe not unique, but it is probably impossible.... very small chance)
MapContainer.addNewCell(x, y) - creates new Cell in ( x, y ) coords with this.paintColor color
```
