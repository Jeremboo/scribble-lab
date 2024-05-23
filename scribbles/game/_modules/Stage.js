// import EventEmitter from 'eventemitter3';

import Cell from './Cell';
import Grid from './Grid';
import StagePawnLists from './StagePawnLists';
// TODO 2021-07-30 jeremboo: add StageGrid ?

import { TYPE } from './keys';

const PROPS = {
  nbrOfTries: 50,
  sizeMin: 4
};

const DEBUG_UPDATE = false;

export default class Stage {
  constructor() {
    this.isInit = false;

    // The list who manage all pawns injected into the Stage
    this.pawnLists = new StagePawnLists();

    // Build Stage into the Grid
    this.grid = new Grid();

    this.update = this.update.bind(this);
  }

  init(row, column, onCellCreated) {
    if (row < PROPS.sizeMin || column < PROPS.sizeMin) {
      console.log(`The stage can't be less that ${PROPS.sizeMin} row or column. Now it's ${row}x${column}.`);
      return false;
    }

    this.grid.init(row, column, (x, y) => {
      return onCellCreated ? onCellCreated(x, y) : new Cell(x, y);
    });

    return true;
  }

  getProps() {
    const { row, column } = this.grid;
    return { row, column };
  }

  /**
   * * *******************
   * * ADD / REMOVE PAWNS
   * * *******************
   */

  // TODO 2021-07-24 jeremboo: rework name between, add, addNew, remove, kill

  /**
   * Add a pawn into a cell, the pawn is not a new pawn and should be already saved into the PawnLists
   * @param {Pawn} pawn
   * @param {Boolean} forceAdd
   * @returns {Boolean}
   */
  addPawn(
    pawn,
    {
      cell = this.grid.getCell(pawn.x, pawn.y),
      forceAdd = false,
      clearCell = false,
      typesToIgnore = [],
      addToList = false
    } = {}
  ) {
    if (!cell) {
      return false;
    }

    const isAdded = cell.add(pawn, { forceAdd, clearCell, typesToIgnore });

    if (isAdded && addToList) {
      this.pawnLists.addPawn(pawn);
    }

    return isAdded;
  }

  getNewPawn(pawnProps) {
    return this.pawnLists.generatePawn(pawnProps);
  }

  /**
   * Add a brand new pawn to the grid and to the lists
   * @param {Pawn} pawn
   * @param {Boolean} forceAdd
   */
  addNewPawn(pawnProps, addPawnProps) {
    const { type } = pawnProps;
    if (!this.pawnLists.isTypeExists(type)) {
      console.log(`ERROR: Pawn, the pawn type is not reconized. Type: ${type}`);
      return false;
    }

    const pawn = this.getNewPawn(pawnProps);
    if (!pawn) {
      console.log(`ERROR: Can't generate a pawn with those props ${pawnProps}`);
      return false;
    }

    // Add the pawn to the grid and the list
    const isPawnAdded = this.addPawn(pawn, { addToList: true, ...addPawnProps });
    return isPawnAdded && pawn;
  }

  addNewPawnFromRandomCoordinate(pawnProps = {}, { margin = 0, forceAdd = false, noNeighbor = false } = {}) {
    const coord = this.getRandomCellCoordinate(margin, forceAdd, noNeighbor);
    if (coord) {
      return this.addNewPawn(
        {
          ...pawnProps,
          x: coord.x,
          y: coord.y,
          direction: this.getRandomDirection()
        },
        { forceAdd }
      );
    }
    return false;
  }

  /**
   * Remove a pawn without deleting it from the lists
   * @param {Pawn} pawn
   */
  removePawn(pawn) {
    const { x, y } = pawn;
    const cell = this.grid.getCell(x, y);

    if (!cell) {
      return;
    }

    cell.remove(pawn);
  }

  /**
   * Remove the pawn from the Cell and the Lists
   * @param {Pawn} pawn
   */
  killPawn(pawn) {
    this.removePawn(pawn);
    this.pawnLists.removePawn(pawn);
  }

  killPawnTypeFromCell(x, y, type) {
    this.getPawnsTypeFromCell(x, y, type).forEach((pawn) => {
      this.killPawn(pawn);
    });
  }

  killAll(cell) {
    const pawns = [...cell.pawns];
    pawns.forEach((_pawn) => {
      this.killPawn(_pawn);
    });
  }

  /**
   * * *******************
   * * CUSTOM PAWN RULES
   * * *******************
   */

  // addNewRandomHouse(pawnProps) {
  //   return this.addNewPawnFromRandomCoordinate(
  //     { ...pawnProps, type: TYPE.HOUSE },
  //     { margin: 2, noNeighbor: this.noNeighbor }
  //   );
  // }

  // addNewRandomDoor(pawnProps) {
  //   const coord = this.getRandomCellBorderCoordinate(true);
  //   return (
  //     coord &&
  //     this.addNewPawn(
  //       {
  //         ...pawnProps,
  //         type: TYPE.DOOR,
  //         x: coord.x,
  //         y: coord.y
  //       },
  //       { clearCell: true }
  //     )
  //   );
  // }

  // addNewRandomGenerator(pawnProps) {
  //   return this.addNewPawnFromRandomCoordinate({ ...pawnProps, type: TYPE.GENERATOR }, { margin: 3 });
  // }

  // addNewRandomGeneratorOnBorders(pawnProps) {
  //   const coord = this.getRandomCellBorderCoordinate();
  //   if (!coord) {
  //     return false;
  //   }

  //   const { x, y } = coord;
  //   const direction = this.getOppositeDirection(this.getDirectionFromBorderPosition(x, y));

  //   return this.addNewPawn({ ...pawnProps, type: TYPE.GENERATOR, x, y, direction }, { clearCell: true });
  // }

  // addNewRobotFromGenerator(generator) {
  //   return (
  //     generator.canGenerate() &&
  //     this.addNewPawn({ ...generator.generatePawnData(), type: TYPE.ROBOT }, { forceAdd: true })
  //   );
  // }

  // addNewSwitcher(x, y, direction) {
  //   return this.addNewPawn({ x, y, direction, type: TYPE.SWITCHER });
  // }

  // getSwitchersFromCell(x, y) {
  //   return this.getPawnsTypeFromCell(x, y, TYPE.SWITCHER);
  // }

  // isSwitcherExists(x, y) {
  //   return this.getSwitchersFromCell(x, y).length > 0;
  // }

  // updateSwitchers(x, y, direction) {
  //   this.getSwitchersFromCell(x, y).forEach((switcher) => {
  //     switcher.setDirection(direction);
  //   });
  // }

  // killSwitchersFromCell(x, y) {
  //   this.killPawnTypeFromCell(x, y, TYPE.SWITCHER);
  // }

  /**
   * * *******************
   * * UTILS
   * * *******************
   */

  isCellEmpty(x, y, props) {
    const cell = this.grid.getCell(x, y);
    return cell && cell.isEmpty(props) || true;
  }

  isWithNeighbor(x, y) {
    let isWithNeighbor = false;
    const isEmptyProps = { typesToIgnore: [TYPE.ROBOT, TYPE.SWITCHER] };
    this.grid.parseNeighborAndCorners(x, y, (cell) => {
      if (isWithNeighbor === false) {
        isWithNeighbor = !cell.isEmpty(isEmptyProps);
      }
    });
    return isWithNeighbor;
  }

  getRandomCellCoordinate(margin = 0, forceAdd = false, noNeighbor = false, tries = PROPS.nbrOfTries) {
    const { row, column } = this.grid.getRandomPosition(margin);

    if (forceAdd || (this.isCellEmpty(row, column) && (!noNeighbor || !this.isWithNeighbor(row, column)))) {
      return { x: row, y: column };
    } else if (tries > 0) {
      return this.getRandomCellCoordinate(margin, forceAdd, noNeighbor, tries - 1);
    }

    // TODO 2021-06-27 jeremboo: send an event
    console.log("ERROR: getRandomEmtyCellCoordinate doesn't find enought place on the gird. The game is over");
    return false;
  }

  getCell(x, y) {
    return this.grid.getCell(x, y);
  }

  getCellFromId(id) {
    let cell;
    this.grid.parse((_cell) => {
      if (_cell.id === id) {
        cell = _cell;
      }
    });
    return cell;
  }

  getPawnsTypeFromCell(x, y, type) {
    const cell = this.grid.getCell(x, y);
    return cell && cell.getFromType(type) || [];
  }

  getPawnListLength(type) {
    return this.pawnLists.getListLength(type);
  }

  parse(callback) {
    this.grid.parse(callback);
  }

  // TODO 2021-09-14 jeremboo: should be extracted from here as utils.

   // getRandomCellBorderCoordinate(tries = PROPS.nbrOfTries) {
  //   const { row, column } = this.grid.getRandomBorderPosition();
  //   console.log('row, column', row, column);

  //   if (this.isCellEmpty(row, column, { typesToIgnore: [TYPE.WALL] })) {
  //     const direction = this.getOppositeDirection(this.getDirectionFromBorderPosition(row, column));
  //     console.log('row, column, direction', row, column, direction);
  //     return { x: row, y: column, direction };
  //   } else if (tries > 0) {
  //     return this.getRandomCellBorderCoordinate(tries - 1);
  //   }

  //   // TODO 2021-06-27 jeremboo: send an event
  //   console.log("ERROR: getRandomCellBorderCoordinate doesn't find enought place on the gird. The game is over");
  //   return false;
  // }

  // randomizePawnWithBorderCoordinate(pawn) {
  //   const { x, y } = this.getRandomCellBorderCoordinate();
  //   pawn.x = x;
  //   pawn.y = y;
  //   pawn.direction = this.getDirectionFromBorderPosition(x, y);
  //   return pawn;
  // }

  // getRandomDirection() {
  //   const directions = Object.values(DIRECTION);
  //   return directions[Math.floor(Math.random() * (directions.length - 1))];
  // }

  // Return a direction based on the position of the border coordinate given
  // getDirectionFromBorderPosition(x, y) {
  //   if (x === 0) {
  //     return DIRECTION.LEFT;
  //   } else if (x === this.grid.row - 1) {
  //     return DIRECTION.RIGHT;
  //   } else if (y === 0) {
  //     return DIRECTION.TOP;
  //   } else {
  //     return DIRECTION.BOTTOM;
  //   }
  // }

  // getOppositeDirection(direction) {
  //   if (typeof direction === 'object') {
  //     return direction.map((dir) => this.getOppositeDirection(dir));
  //   }

  //   switch (direction) {
  //     case DIRECTION.TOP:
  //       return DIRECTION.BOTTOM;
  //     case DIRECTION.BOTTOM:
  //       return DIRECTION.TOP;
  //     case DIRECTION.LEFT:
  //       return DIRECTION.RIGHT;
  //     case DIRECTION.RIGHT:
  //     default:
  //       return DIRECTION.LEFT;
  //   }
  // }

  // getPawnsFromBorder(direction, type) {
  //   let cells = [];
  //   switch (direction) {
  //     case DIRECTION.TOP:
  //       cells = this.grid.getRow(0);
  //       break;
  //     case DIRECTION.BOTTOM:
  //       cells = this.grid.getRow(this.grid.column - 1);
  //       break;
  //     case DIRECTION.LEFT:
  //       cells = this.grid.getColumn(0);
  //       break;
  //     default:
  //     case DIRECTION.RIGHT:
  //       cells = this.grid.getColumn(this.grid.row - 1);
  //       break;
  //   }
  //   return cells.reduce((accumulator, cell) => {
  //     const pawns = cell?.getFromType(type) || [];
  //     accumulator.push(...pawns);
  //     return accumulator;
  //   }, []);
  // }

  /**
   *
   * @param {number} doorX X coordinate from another stage. Can be bigger than the current stage
   * @param {number} doorY Y coordinate from another stage. Can be bigger than the current stage
   * @param {Direction} doorBorder
   * @returns
   */
  // getOppositeBorderPositionFromExternalDoor({ x: doorX, y: doorY, direction: doorBorder }) {
  //   let x, y;
  //   const oppositeBorder = this.getOppositeDirection(doorBorder);
  //   if (oppositeBorder === DIRECTION.LEFT) {
  //     x = 0;
  //     y = Math.min(doorY, this.grid.column - 1);
  //   } else if (oppositeBorder === DIRECTION.RIGHT) {
  //     x = this.grid.row - 1;
  //     y = Math.min(doorY, this.grid.column - 1);
  //   } else if (oppositeBorder === DIRECTION.TOP) {
  //     x = Math.min(doorX, this.grid.row - 1);
  //     y = 0;
  //   } else if (oppositeBorder === DIRECTION.BOTTOM) {
  //     x = Math.min(doorX, this.grid.row - 1);
  //     y = this.grid.column - 1;
  //   }
  //   return { x, y };
  // }

  /**
   * * *******************
   * * UPDATE
   * * *******************
   **/

  update() {
    // // Reset and Remove the dead robots from the array
    // this.pawnLists.filterPawnsFromType(TYPE.ROBOT, (robot) => {
    //   this.removePawn(robot);
    //   return robot.isAlive;
    // });
    // // Update the robots still alive
    // this.pawnLists.parseFromType(TYPE.ROBOT, (robot) => {
    //   robot.update();
    //   // Add the robot and see if it's ok or not
    //   robot.isAlive = this.addPawn(robot);
    // });

    // // Update the generators
    // this.pawnLists.parseFromType(TYPE.GENERATOR, (generator) => {
    //   generator.update();
    //   this.addNewRobotFromGenerator(generator);
    // });

    // // Update the houses and the doors
    // this.pawnLists.parseFromType(TYPE.HOUSE, (house) => {
    //   house.update();
    // });

    // this.pawnLists.parseFromType(TYPE.DOOR, (door) => {
    //   door.update();
    // });

    // TODO 2021-06-27 jeremboo: add a production condition
    if (DEBUG_UPDATE) {
      this.debugUpdate();
    }
  }

  debugUpdate() {
    let log = ``;
//     this.grid.grid.forEach((row) => {
//       row.forEach((cell) => {
//         if (cell.pawns[0]) {
//           switch (cell.pawns[0].type) {
//             case TYPE.HOUSE:
//               log += 'H';
//               break;
//             case TYPE.DOOR:
//               log += 'D';
//               break;
//             case TYPE.WALL:
//               log += 'W';
//               break;
//             case TYPE.GENERATOR:
//               log += 'G';
//               break;
//             case TYPE.ROBOT:
//               log += 'R';
//               break;
//             case TYPE.SWITCHER:
//               log += 'O';
//               break;
//             default:
//               log += '?';
//               break;
//           }
//         } else {
//           log += '.';
//         }
//         log += ' ';
//       });
//       log += `
// `;
//     });
    console.log(log);
  }
}