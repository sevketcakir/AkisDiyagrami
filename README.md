# Flowchart C Interpreter (Akış Diyagramı)

An interactive, client-side, web-based flowchart execution application designed specifically to teach first-semester Computer Engineering students the fundamentals of **C programming**.

Students can build algorithms visually using standard paper-compatible flowchart symbols, step through execution one node at a time, inspect memory variables dynamically, and view standard output without relying on dangerous `eval()` calls or complex asynchronous loops.

---

## 🌟 Key Architectural Features

1. **Command Pattern & State Machine Interpreter (`/src/engine`)**
   - Implements a deterministic execution engine using the Command Pattern.
   - Avoids fragile `while` loops with delay timers. Each node is an atomic command object with an `execute(context)` method.
   - Facilitates true step-by-step debugging, pausing, variable inspection, and execution history snapshots.

2. **Safe Expression Evaluator (`/src/evaluator`)**
   - AST-based expression parser powered by `jsep`.
   - Strictly **zero `eval()`** or `new Function()` invocations.
   - Evaluates arithmetic (`+`, `-`, `*`, `/`, `%`), relational (`==`, `!=`, `<`, `<=`, `>`, `>=`), logical (`&&`, `||`, `!`), and assignment expressions (`x = y + 5`, `count += 1`).

3. **Standard Paper-Compatible Flowchart Symbols**
   - **Start / End**: Oval / Capsule
   - **Assignment / Process**: Rectangle (`x = 5`, `sum = sum + i`)
   - **Decision / Conditional**: Diamond (with `True` and `False` branching paths)
   - **Loop / Iteration**: Hexagon (with `Body` and `Exit` paths)
   - **Input**: Parallelogram (`scanf` simulation)
   - **Output**: Parallelogram (`printf` simulation)

4. **Live Execution Controls & Variable Watcher**
   - **Controls**: Play (auto-advance with interval), Pause, Step (execute single node), and Reset.
   - **Variable Watcher**: Dynamic HTML table reflecting active memory state.
   - **Output Console**: Terminal output log for student programs.
   - **Visual Active Node Highlighting**: Highlights active node during execution.

5. **Save & Load Support**
   - Export/Import flowchart diagrams to and from JSON files via the HTML5 File API.

---

## 📐 Flowchart Symbols Reference

| Symbol | Shape | C Programming Equivalent | Purpose |
| :--- | :--- | :--- | :--- |
| **Start / End** | Oval / Capsule | `int main() { ... }` / `return 0;` | Entry and exit points of the flowchart |
| **Assignment** | Rectangle | `x = 10;`, `sum = sum + i;` | Variable mutation and calculations |
| **Decision** | Diamond | `if (x > 0) { ... } else { ... }` | Conditional branching with True / False ports |
| **Loop** | Hexagon | `for (i = 1; i <= N; i++)` (`I = 1, N, 1`) | Iteration header with Body and Exit ports |
| **Input** | Parallelogram | `scanf("%d", &x);` | Interactive user input |
| **Output** | Document (curved bottom) | `printf("Result: %d\n", sum);` | Writes formatted data to output console |

---

## 📂 Directory Structure

```
AkisDiyagrami/
├── index.html                  # Main application HTML
├── vite.config.js              # Vite and Vitest configuration
├── package.json                # Dependencies and scripts
├── src/
│   ├── main.js                 # Application entry point & UI coordinator
│   ├── style.css               # Styling for UI, canvas, and flowchart shapes
│   ├── engine/                 # Core State Machine Execution Engine
│   │   ├── InterpreterContext.js  # Memory, output buffer, and execution state
│   │   ├── FlowchartInterpreter.js# State machine coordinator
│   │   └── nodes/
│   │       ├── FlowchartNode.js   # Abstract base Command class
│   │       ├── StartNode.js       # Entry node
│   │       ├── EndNode.js         # Exit node
│   │       ├── AssignmentNode.js  # Math & variable mutation
│   │       ├── DecisionNode.js    # Boolean condition branching
│   │       ├── LoopNode.js        # Iteration controller
│   │       ├── InputNode.js       # User input (scanf)
│   │       ├── OutputNode.js      # Console output (printf)
│   │       └── index.js           # Barrel export
│   ├── evaluator/
│   │   └── Evaluator.js        # AST expression evaluation via jsep
│   ├── ui/
│   │   ├── CanvasManager.js    # Drag-and-drop flowchart canvas
│   │   ├── SidePanel.js        # Variable watcher table & output console
│   │   └── GraphParser.js      # Canvas graph to Engine AST bridge
│   └── utils/
│       ├── FileHandler.js      # JSON Save & Load utilities
│       └── SamplePrograms.js   # Built-in curriculum examples
└── tests/
    ├── engine.test.js          # Unit tests for interpreter engine
    └── evaluator.test.js       # Unit tests for safe expression parser
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### Installation
```bash
# Clone or navigate to the project directory
cd AkisDiyagrami

# Install dependencies
npm install
```

### Development Server
```bash
npm run dev
```
Starts the local development server (default: `http://localhost:3000`).

### Running Automated Tests
```bash
npm run test
```
Runs the Vitest test suite covering node command execution, state transitions, loops, and expression safety.

### Production Build
```bash
npm run build
```
Creates an optimized static bundle in the `/dist` directory.

---

## 🧪 Testing the Engine (Example Code)

```javascript
import {
  FlowchartInterpreter,
  StartNode,
  AssignmentNode,
  DecisionNode,
  OutputNode,
  EndNode
} from './src/engine/index.js';
import { SafeEvaluator } from './src/evaluator/Evaluator.js';

// Build a simple decision flowchart
const start = new StartNode('start', 'assign');
const assign = new AssignmentNode('assign', {
  expression: 'score = 85',
  nextNodeId: 'check',
  evaluator: SafeEvaluator.hook
});
const check = new DecisionNode('check', {
  condition: 'score >= 50',
  trueNodeId: 'pass',
  falseNodeId: 'fail',
  evaluator: SafeEvaluator.hook
});
const pass = new OutputNode('pass', {
  expression: '"Passed!"',
  nextNodeId: 'end',
  evaluator: SafeEvaluator.hook
});
const fail = new OutputNode('fail', {
  expression: '"Failed!"',
  nextNodeId: 'end',
  evaluator: SafeEvaluator.hook
});
const end = new EndNode('end');

const interpreter = new FlowchartInterpreter({
  nodes: { start, assign, check, pass, fail, end },
  evaluator: SafeEvaluator.hook
});

// Step through execution
while (!interpreter.context.isFinished) {
  const snapshot = interpreter.step();
  console.log('Executed:', snapshot.executedNodeId, 'Variables:', snapshot.variables);
}

console.log('Output:', interpreter.context.output); // ['Passed!']
```

---

## 📜 License
ISC License
