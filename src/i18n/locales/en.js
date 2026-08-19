export default {
  brand: {
    title: 'Flowchart C Interpreter',
    badge: 'C Programming Lab'
  },
  header: {
    sampleSelectDefault: '📂 Load Curriculum Example...',
    autoLayout: '✨ Auto-Layout',
    autoLayoutTitle: 'Auto-align and tidy flowchart blocks',
    save: '💾 Save Flowchart',
    saveTitle: 'Export diagram to JSON file',
    load: '📁 Load Flowchart',
    loadTitle: 'Import diagram from JSON file',
    clear: '🗑️ Clear',
    clearTitle: 'Clear all nodes',
    clearConfirm: 'Are you sure you want to clear the flowchart canvas?',
    langSwitch: 'Language / Dil'
  },
  samples: {
    rectangleArea: '1. Rectangle Area (Sequential Flow)',
    evenOrOdd: '2. Even / Odd (If-Else Decision)',
    maxOfThree: '3. Maximum of 3 Numbers (Nested Decision)',
    sum1ToN: '4. Sum of 1 to N (Accumulator Loop)',
    factorial: '5. Factorial of N (Multiplication Loop)',
    isPrimeCheck: '6. Prime Test (Is N Prime?)',
    allPrimesUpToN: '7. All Primes Up to N (Nested Loops)',
    fibonacci: '8. Fibonacci Sequence (First N Terms)',
    gcdEuclideanSubtraction: "9. Euclid's GCD (Subtraction Method)",
    gcdEuclidean: "10. Euclid's GCD (Modulo Division Method)"
  },
  sampleDescriptions: {
    rectangleArea: 'Calculates the area of a rectangle given width and height using a compact process block.',
    evenOrOdd: 'Checks whether an input number is Even or Odd using modulo arithmetic.',
    maxOfThree: 'Compares three input numbers using a compact multi-variable input node.',
    sum1ToN: 'Computes sum = 1 + 2 + ... + N using a parametric loop.',
    factorial: 'Calculates N! = 1 * 2 * ... * N using iterative multiplication.',
    isPrimeCheck: 'Tests if an input number N is prime by testing divisibility with a loop.',
    allPrimesUpToN: 'Finds and prints all prime numbers from 2 up to N using nested loops.',
    fibonacci: 'Generates the first N numbers in the Fibonacci sequence using compact assignment blocks.',
    gcdEuclideanSubtraction: "Computes GCD(a, b) using original Euclidean repeated subtraction.",
    gcdEuclidean: "Computes GCD(a, b) using Euclidean division remainder algorithm."
  },
  palette: {
    title: 'Flowchart Symbols',
    startTitle: 'Start',
    startDesc: 'Oval (main entry)',
    assignmentTitle: 'Assignment',
    assignmentDesc: 'Rectangle (x = 5)',
    decisionTitle: 'Decision',
    decisionDesc: 'Diamond (if / else)',
    loopTitle: 'Loop',
    loopDesc: 'Hexagon (i = 1, N, 1)',
    inputTitle: 'Input',
    inputDesc: 'Parallelogram (scanf)',
    outputTitle: 'Output',
    outputDesc: 'Document (printf)',
    endTitle: 'End',
    endDesc: 'Oval (return 0;)',
    instructionsTitle: 'Instructions',
    instructionsText: 'Drag flowchart symbols onto the canvas and connect ports. Click <strong>Step</strong> or <strong>Play</strong> to watch memory change live!'
  },
  controls: {
    title: 'Execution Controls',
    play: '▶ Play',
    playTitle: 'Run continuously',
    pause: '⏸ Pause',
    pauseTitle: 'Pause execution',
    step: '⏭ Step',
    stepTitle: 'Execute single node',
    reset: '🔄 Reset',
    resetTitle: 'Reset state',
    delayTitle: '⏱️ Step Delay:',
    delayInstant: '0 ms (Instant)',
    promptTitle: 'Enter value:',
    promptPlaceholder: 'Type value & hit Enter...',
    promptSubmit: 'Submit'
  },
  status: {
    ready: 'Ready',
    running: 'Running...',
    paused: 'Paused',
    stepping: 'Stepping...',
    finished: 'Finished (return 0)',
    error: 'Runtime Error',
    waitingInput: 'Waiting for Input'
  },
  variables: {
    title: 'Variable Watcher (Memory)',
    colVariable: 'Variable',
    colType: 'C Type',
    colValue: 'Value',
    emptyHint: 'No variables declared in memory yet'
  },
  console: {
    title: 'Output Console (printf)',
    clear: 'Clear',
    emptyHint: 'Console output (printf) will appear here...'
  },
  nodes: {
    startTitle: 'START',
    startSubtitle: 'int main()',
    endTitle: 'END',
    endSubtitle: 'return 0;',
    processHeader: 'Process / Assignment',
    processPlaceholder: 'e.g. a = 5\nb = 10',
    decisionHeader: 'Decision (If)',
    decisionPlaceholder: 'e.g. score >= 50',
    portTrue: 'True (← T)',
    portFalse: 'False (F →)',
    loopHeader: 'Loop (Hexagon)',
    loopPlaceholder: 'e.g. i = 1, N, 1',
    portBody: 'Body (→)',
    portIn: 'In (←)',
    portExit: 'Exit (↓)',
    inputHeader: 'Input (scanf)',
    inputPlaceholder: 'e.g. a, b, c',
    outputHeader: 'Output (printf)',
    outputPlaceholder: 'e.g. "Result: " + sum'
  },
  zoom: {
    in: 'Zoom In',
    out: 'Zoom Out',
    reset: 'Reset Zoom'
  }
};
