const { 
    Engine, 
    Render, 
    Runner, 
    World, 
    Bodies,
    Body,
    Events 
} = Matter;

const cells = 6;
const width = 600;
const height = 600;

const unitLength = width / cells;

const engine = Engine.create();
engine.world.gravity.y = 0; // disables gravity
const { world } = engine;
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: true,
    width,
    height
  }
});
Render.run(render);
Runner.run(Runner.create(), engine);

//Walls
const border = 2;
const walls = [
    Bodies.rectangle(width / 2, 0, width, border, { isStatic: true } ),
    Bodies.rectangle(width / 2, height, width, border, { isStatic: true } ),
    Bodies.rectangle(0, height / 2, border, height, { isStatic: true } ),
    Bodies.rectangle(width, height / 2, border, height, { isStatic: true } )
];

World.add(world, walls);

// maze generation

const shuffle = (arr) => {
    let counter = arr.length;
    while (counter > 0) {
        const index = Math.floor(Math.random() * counter);
        counter--;
        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }
    return arr;    
};


const grid = Array(cells)
    .fill(null)
    .map(() => Array(cells).fill(false));

const verticals = Array(cells)
    .fill(null)
    .map(() => Array(cells - 1).fill(false));

const horizontals = Array(cells - 1)
    .fill(null)
    .map(() => Array(cells).fill(false));

const startRow = Math.floor(Math.random() * cells);
const startColumn = Math.floor(Math.random() * cells);

const stepThroughCell = (row, column) => {
    if (grid[row][column]) {
        return;
    }

// mark this cell as having been visited
grid[row][column] = true;

// determine randomly ordered neighbours
const neighbours = shuffle([
    [row - 1, column, 'up'],
    [row, column + 1, 'right'],
    [row + 1, column, 'down'],
    [row, column - 1, 'left']
]);

// for each neighbour
for (let neighbour of neighbours) {
    const [nextRow, nextCol, direction] = neighbour;
        // see if that neighbour is out of bounds
    if (
        nextRow < 0 || 
        nextRow >= cells || 
        nextCol < 0 || 
        nextCol >= cells 
        ) {
        continue;
    }
    // if we have visited that neighbour continue to the next
    if (grid[nextRow][nextCol]){
        continue;
    }
    // remove a wall from either horizontal or vertical
    if (direction === 'left') {
        verticals[row][column - 1] = true;
    } else if (direction === 'right') {
        verticals[row][column] = true;
    } else if (direction === 'up') {
        horizontals[row - 1][column] = true;
    } else if (direction === 'down') {
        horizontals[row][column] = true;
    }
    stepThroughCell(nextRow, nextCol);
}
};
// visit the next cell

stepThroughCell(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }
        const wall = Bodies.rectangle(
            columnIndex * unitLength + (unitLength / 2),
            rowIndex * unitLength + unitLength,
            unitLength,
            10,
            {
                label: 'wall',
                isStatic: true
            }
        );
        World.add(world, wall);
    });
});

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }
        const wall = Bodies.rectangle(
            columnIndex * unitLength + unitLength,
            rowIndex * unitLength + unitLength / 2,
            10,
            unitLength,
            {
                isStatic: true
            }
        );
        World.add(world, wall);
    });
});

// added the goal
const goal = Bodies.rectangle(
    width - unitLength / 2,
    height - unitLength / 2,
    unitLength * .7,
    unitLength * .7,
    {
        label: 'goal',
        isStatic: true
    }
);
World.add(world, goal);

// add the ball
const ball = Bodies.circle(unitLength / 2, unitLength / 2, unitLength / 4, {
    label: 'ball'
  });
  World.add(world, ball);

// keys to move the ball
document.addEventListener(`keydown`, event => {
    const {x, y} = ball.velocity;
    if (event.keyCode === 87) {
        Body.setVelocity(ball, {x, y: y - 5});
    }
    if (event.keyCode === 68) {
        Body.setVelocity(ball, {x: x + 5, y });
    }
    if (event.keyCode === 83) {
        Body.setVelocity(ball, {x, y: y + 5 });   
    }
    if (event.keyCode === 65) {
        Body.setVelocity(ball, {x: x - 5, y });    
    }
});

// win condition

Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(collision => {
      const labels = ['ball', 'goal'];
  
      if (
        labels.includes(collision.bodyA.label) &&
        labels.includes(collision.bodyB.label)
      ) {
        world.gravity.y = 1;
        world.bodies.forEach(body => {
          if (body.label === 'wall') {
            Body.setStatic(body, false);
          }
        });
      }
    });
  });