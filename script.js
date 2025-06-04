// script.js
// Molecule structure data
let atomId = 0;
let atoms = [];
let bonds = [];
let selectedAtom = null;
let selectedBond = null;
let currentTool = 'atom';
let currentBondType = 1;
let bondId = 0;

// DOM elements
const canvas = document.getElementById('canvas');
const statusBar = document.getElementById('status');
const validationContainer = document.getElementById('validation-container');

// Initialize the application
function init() {
  // Set up tool buttons
  document.getElementById('btn-atom').addEventListener('click', () => {
    currentTool = 'atom';
    updateToolUI();
    clearSelection();
    statusBar.textContent = "Atom tool: Click and drag to move atoms";
  });
  
  document.getElementById('btn-bond').addEventListener('click', () => {
    currentTool = 'bond';
    updateToolUI();
    clearSelection();
    statusBar.textContent = "Bond tool: Select two atoms to create a bond";
  });
  
  document.getElementById('btn-delete').addEventListener('click', () => {
    deleteSelected();
  });
  
  document.getElementById('btn-add-hydrogens').addEventListener('click', () => {
    addHydrogens();
  });
  
  // Set up bond type buttons
  document.querySelectorAll('.bond-type').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bond-type').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      currentBondType = parseInt(btn.dataset.type);
      statusBar.textContent = `Bond type set to ${getBondTypeName(currentBondType)}`;
    });
  });
  
  // Set up element drag events
  document.querySelectorAll(".element").forEach(elem => {
    elem.addEventListener("dragstart", ev => {
      ev.dataTransfer.setData("text", ev.target.dataset.symbol);
      statusBar.textContent = `Dragging ${ev.target.dataset.symbol} atom`;
    });
  });
  
  // Set up template click events
  document.querySelectorAll(".template").forEach(template => {
    template.addEventListener("click", () => {
      const smiles = template.dataset.smiles;
      loadTemplate(smiles);
    });
  });
  
  // Initial UI update
  updateToolUI();
}

function updateToolUI() {
  document.getElementById('btn-atom').classList.toggle('active', currentTool === 'atom');
  document.getElementById('btn-bond').classList.toggle('active', currentTool === 'bond');
  
  const bondControls = document.getElementById('bond-controls');
  bondControls.style.display = currentTool === 'bond' ? 'flex' : 'none';
}

function getBondTypeName(type) {
  switch(type) {
    case 1: return 'Single';
    case 2: return 'Double';
    case 3: return 'Triple';
    default: return 'Single';
  }
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drop(ev) {
  ev.preventDefault();
  if (currentTool !== 'atom') return;
  
  const symbol = ev.dataTransfer.getData("text");
  createAtom(symbol, ev.offsetX, ev.offsetY);
  
  // Automatically create bonds for H and O
  if (symbol === 'H' || symbol === 'O') {
    setTimeout(() => autoCreateBonds(), 10);
  }
}

function autoCreateBonds() {
  if (atoms.length < 2) return;
  
  const lastAtom = atoms[atoms.length - 1];
  let closestAtom = null;
  let minDistance = Infinity;
  
  // Find the closest atom that isn't hydrogen
  for (const atom of atoms) {
    if (atom.id === lastAtom.id) continue;
    if (atom.symbol === 'H') continue; // Don't connect to hydrogen
    
    const dx = atom.x - lastAtom.x;
    const dy = atom.y - lastAtom.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Only consider atoms within 100 pixels
    if (distance < 100 && distance < minDistance) {
      minDistance = distance;
      closestAtom = atom;
    }
  }
  
  if (!closestAtom) return;
  
  // Create bond based on atom type
  let bondType = 1;
  if (lastAtom.symbol === 'O' && closestAtom.symbol === 'C') {
    bondType = 2; // Double bond for oxygen-carbon
  } else if (lastAtom.symbol === 'H') {
    bondType = 1; // Always single for hydrogen
  }
  
  createBond(lastAtom.id, closestAtom.id, bondType);
  statusBar.textContent = `Automatically created ${getBondTypeName(bondType)} bond between ${lastAtom.symbol} and ${closestAtom.symbol}`;
}

function createAtom(symbol, x, y) {
  const atom = document.createElement("div");
  atom.className = `atom ${symbol}`;
  atom.innerText = symbol;
  atom.dataset.id = atomId;
  atom.dataset.symbol = symbol;
  atom.style.left = (x - 25) + "px";
  atom.style.top = (y - 25) + "px";
  
  // Add interaction handlers
  atom.addEventListener("mousedown", startAtomDrag);
  atom.addEventListener("click", handleAtomClick);
  
  canvas.appendChild(atom);
  
  // Store atom data
  atoms.push({
    id: atomId,
    symbol: symbol,
    x: x,
    y: y,
    element: atom
  });
  
  atomId++;
  updateAtomCount();
}

function handleAtomClick(ev) {
  ev.stopPropagation();
  const atomId = parseInt(ev.target.dataset.id);
  
  if (currentTool === 'bond') {
    if (selectedAtom === null) {
      // First atom selected
      selectedAtom = atomId;
      ev.target.classList.add('selected');
      statusBar.textContent = "Select second atom for bond";
    } else if (selectedAtom === atomId) {
      // Clicked on same atom - deselect
      ev.target.classList.remove('selected');
      selectedAtom = null;
      statusBar.textContent = "Bond creation canceled";
    } else {
      // Create bond between selectedAtom and this atom
      createBond(selectedAtom, atomId, currentBondType);
      
      // Reset selection
      document.querySelector(`.atom[data-id="${selectedAtom}"]`).classList.remove('selected');
      selectedAtom = null;
    }
  } else if (currentTool === 'atom') {
    // Atom tool - select/deselect
    clearSelection();
    selectedAtom = atomId;
    selectedBond = null;
    ev.target.classList.add('selected');
    statusBar.textContent = `${ev.target.dataset.symbol} atom selected. Drag to move.`;
  }
}

function createBond(atomId1, atomId2, bondType) {
  // Check if bond already exists
  const existingBond = bonds.find(b => 
    (b.atom1 === atomId1 && b.atom2 === atomId2) || 
    (b.atom1 === atomId2 && b.atom2 === atomId1)
  );
  
  if (existingBond) {
    statusBar.textContent = "Bond already exists between these atoms";
    return;
  }
  
  const atom1 = atoms.find(a => a.id === atomId1);
  const atom2 = atoms.find(a => a.id === atomId2);
  
  if (!atom1 || !atom2) return;
  
  // Create bond element
  const bond = createBondElement(atom1, atom2, bondType);
  canvas.appendChild(bond);
  
  // Store bond data
  bonds.push({
    id: bondId,
    atom1: atomId1,
    atom2: atomId2,
    type: bondType,
    element: bond
  });
  
  bondId++;
  
  statusBar.textContent = `${getBondTypeName(bondType)} bond created between ${atom1.symbol} and ${atom2.symbol}`;
  updateBondCount();
}

function createBondElement(atom1, atom2, bondType) {
  const dx = atom2.x - atom1.x;
  const dy = atom2.y - atom1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  
  const bond = document.createElement("div");
  bond.className = "bond";
  bond.dataset.id = bondId;
  bond.style.width = length + "px";
  bond.style.left = atom1.x + "px";
  bond.style.top = (atom1.y - 3) + "px";
  bond.style.transform = `rotate(${angle}deg)`;
  
  // Add click handler for bond
  bond.addEventListener("click", handleBondClick);
  
  // Create bond lines based on bond type
  bond.innerHTML = '';
  const lines = bondType;
  
  for (let i = 0; i < lines; i++) {
    const line = document.createElement("div");
    line.className = "bond-line";
    bond.appendChild(line);
  }
  
  return bond;
}

function handleBondClick(ev) {
  ev.stopPropagation();
  
  if (currentTool !== 'bond') return;
  
  // Clear atom selection
  clearSelection();
  
  // Select this bond
  const bondId = parseInt(ev.currentTarget.dataset.id);
  const bond = bonds.find(b => b.id === bondId);
  
  if (!bond) return;
  
  // Remove selection from other bonds
  document.querySelectorAll('.bond.selected').forEach(b => {
    b.classList.remove('selected');
  });
  
  // Select this bond
  ev.currentTarget.classList.add('selected');
  selectedBond = bondId;
  
  // Cycle bond type
  const newType = bond.type % 3 + 1;
  bond.type = newType;
  
  // Update bond visualization
  bond.element.innerHTML = '';
  for (let i = 0; i < newType; i++) {
    const line = document.createElement("div");
    line.className = "bond-line";
    bond.element.appendChild(line);
  }
  
  statusBar.textContent = `Changed bond to ${getBondTypeName(newType)}`;
}

// Atom dragging functionality
let dragAtom = null;
let dragOffsetX, dragOffsetY;

function startAtomDrag(ev) {
  if (currentTool !== 'atom') return;
  
  dragAtom = ev.target;
  const rect = dragAtom.getBoundingClientRect();
  dragOffsetX = ev.clientX - rect.left;
  dragOffsetY = ev.clientY - rect.top;
  
  document.addEventListener("mousemove", dragAtomMove);
  document.addEventListener("mouseup", stopAtomDrag);
  
  // Select this atom
  clearSelection();
  selectedAtom = parseInt(dragAtom.dataset.id);
  dragAtom.classList.add('selected');
}

function dragAtomMove(ev) {
  if (!dragAtom) return;
  
  const canvasRect = canvas.getBoundingClientRect();
  
  // Calculate new position
  let x = ev.clientX - canvasRect.left - dragOffsetX;
  let y = ev.clientY - canvasRect.top - dragOffsetY;
  
  // Boundary checks
  x = Math.max(0, Math.min(canvasRect.width - 50, x));
  y = Math.max(0, Math.min(canvasRect.height - 50, y));
  
  // Update position
  dragAtom.style.left = x + "px";
  dragAtom.style.top = y + "px";
  
  // Update atom data
  const atomId = parseInt(dragAtom.dataset.id);
  const atom = atoms.find(a => a.id === atomId);
  if (atom) {
    atom.x = x + 25;
    atom.y = y + 25;
    
    // Update connected bonds
    updateConnectedBonds(atomId);
  }
}

function updateConnectedBonds(atomId) {
  bonds.forEach(bond => {
    if (bond.atom1 === atomId || bond.atom2 === atomId) {
      // Remove old bond element
      bond.element.remove();
      
      // Get atom references
      const atom1 = atoms.find(a => a.id === bond.atom1);
      const atom2 = atoms.find(a => a.id === bond.atom2);
      
      // Create new bond element
      const newBond = createBondElement(atom1, atom2, bond.type);
      canvas.appendChild(newBond);
      
      // Update reference
      bond.element = newBond;
    }
  });
}

function stopAtomDrag() {
  if (dragAtom) {
    statusBar.textContent = `Moved ${dragAtom.dataset.symbol} atom`;
  }
  dragAtom = null;
  document.removeEventListener("mousemove", dragAtomMove);
  document.removeEventListener("mouseup", stopAtomDrag);
}

function clearSelection() {
  selectedAtom = null;
  selectedBond = null;
  document.querySelectorAll('.atom.selected').forEach(a => {
    a.classList.remove('selected');
  });
  document.querySelectorAll('.bond.selected').forEach(b => {
    b.classList.remove('selected');
  });
}

function deleteSelected() {
  if (selectedAtom === null && selectedBond === null) {
    statusBar.textContent = "No atom or bond selected to delete";
    return;
  }
  
  if (selectedAtom !== null) {
    // Find the atom
    const atomIndex = atoms.findIndex(a => a.id === selectedAtom);
    if (atomIndex === -1) return;
    
    const atom = atoms[atomIndex];
    
    // Remove the atom element
    atom.element.remove();
    
    // Remove connected bonds
    const bondsToRemove = bonds.filter(b => 
      b.atom1 === selectedAtom || b.atom2 === selectedAtom
    );
    
    bondsToRemove.forEach(bond => {
      bond.element.remove();
      bonds.splice(bonds.indexOf(bond), 1);
    });
    
    // Remove the atom
    atoms.splice(atomIndex, 1);
    
    statusBar.textContent = `Deleted ${atom.symbol} atom and ${bondsToRemove.length} connected bonds`;
    selectedAtom = null;
    
    updateAtomCount();
    updateBondCount();
  } else if (selectedBond !== null) {
    // Find the bond
    const bondIndex = bonds.findIndex(b => b.id === selectedBond);
    if (bondIndex === -1) return;
    
    const bond = bonds[bondIndex];
    
    // Remove the bond element
    bond.element.remove();
    
    // Remove the bond
    bonds.splice(bondIndex, 1);
    
    statusBar.textContent = "Deleted bond";
    selectedBond = null;
    
    updateBondCount();
  }
}

function updateAtomCount() {
  document.getElementById('atom-count').textContent = atoms.length;
}

function updateBondCount() {
  document.getElementById('bond-count').textContent = bonds.length;
}

function validateMolecule(molecule) {
  const errors = [];
  
  // Check for disconnected atoms
  const atomConnections = new Array(molecule.getAllAtoms()).fill(0);
  
  for (let i = 0; i < molecule.getAllBonds(); i++) {
    const bond = molecule.getBond(i);
    atomConnections[bond.atom1]++;
    atomConnections[bond.atom2]++;
  }
  
  for (let i = 0; i < atomConnections.length; i++) {
    const symbol = molecule.getAtomLabel(i);
    const connections = atomConnections[i];
    
    // Hydrogen must have exactly one connection
    if (symbol === 'H' && connections !== 1) {
      errors.push(`Hydrogen atom must have exactly one bond (atom ${i+1} has ${connections})`);
    }
    
    // Other atoms must have at least one connection
    if (symbol !== 'H' && connections === 0) {
      errors.push(`${symbol} atom has no bonds (atom ${i+1})`);
    }
  }
  
  // Check for maximum valence
  for (let i = 0; i < molecule.getAllAtoms(); i++) {
    const valence = molecule.getAtomValence(i);
    const maxValence = molecule.getAtomMaxValence(i);
    
    if (valence > maxValence) {
      errors.push(`${molecule.getAtomLabel(i)} atom exceeds maximum valence (${valence} > ${maxValence})`);
    }
  }
  
  return errors;
}

function analyze() {
  // Clear previous validation errors
  validationContainer.innerHTML = '';
  
  if (atoms.length === 0) {
    document.getElementById('formula').textContent = "-";
    document.getElementById('weight').textContent = "-";
    document.getElementById('smiles').textContent = "No molecule created";
    document.getElementById('molecule-structure').textContent = "H₂O";
    statusBar.textContent = "Cannot analyze - no atoms on canvas";
    return;
  }
  
  // Create molecule using OpenChemLib
  const molecule = new OCL.Molecule();
  
  // Add atoms
  atoms.forEach(atom => {
    const atomIdx = molecule.addAtom(atom.symbol);
    // Set coordinates for visualization
    molecule.setAtomX(atomIdx, atom.x / 30);
    molecule.setAtomY(atomIdx, atom.y / 30);
  });
  
  // Add bonds
  bonds.forEach(bond => {
    const atom1Index = atoms.findIndex(a => a.id === bond.atom1);
    const atom2Index = atoms.findIndex(a => a.id === bond.atom2);
    
    if (atom1Index !== -1 && atom2Index !== -1) {
      molecule.addBond(atom1Index, atom2Index, bond.type);
    }
  });
  
  // Validate the molecule
  const errors = validateMolecule(molecule);
  
  if (errors.length > 0) {
    // Show validation errors
    let errorHtml = '<div class="validation-error"><strong>Validation Errors:</strong><ul>';
    errors.forEach(error => {
      errorHtml += `<li>${error}</li>`;
    });
    errorHtml += '</ul></div>';
    validationContainer.innerHTML = errorHtml;
    
    // Clear results
    document.getElementById('formula').textContent = "-";
    document.getElementById('weight').textContent = "-";
    document.getElementById('smiles').textContent = "Fix validation errors";
    
    statusBar.textContent = `Molecule contains ${errors.length} validation errors`;
    return;
  }
  
  try {
    // Get molecular properties
    const formula = molecule.getMolecularFormula().formula;
    const weight = molecule.getMolecularFormula().weight;
    const smiles = molecule.toSmiles();
    
    // Update UI
    document.getElementById('formula').textContent = formula;
    document.getElementById('weight').textContent = weight.toFixed(2) + " g/mol";
    document.getElementById('smiles').textContent = smiles;
    
    // Check for multiple molecules
    const fragments = molecule.getFragments();
    if (fragments.length > 1) {
      const warning = `<div class="multi-molecule-warning">
        <strong>Multiple Molecules Detected:</strong> 
        Your structure contains ${fragments.length} disconnected fragments.
      </div>`;
      validationContainer.innerHTML = warning;
    }
    
    // Update molecule visualization
    const moleculeStructure = document.getElementById('molecule-structure');
    moleculeStructure.textContent = getSimpleFormula(formula);
    
    statusBar.textContent = `Analyzed molecule: ${formula}, ${weight.toFixed(2)} g/mol`;
  } catch (e) {
    statusBar.textContent = `Analysis error: ${e.message}`;
    console.error(e);
  }
}

function getSimpleFormula(formula) {
  // Simple representation for common molecules
  const commonMolecules = {
    'H2O': 'H₂O',
    'CH4': 'CH₄',
    'C2H6': 'C₂H₆',
    'C2H4': 'C₂H₄',
    'C2H2': 'C₂H₂',
    'C6H6': 'C₆H₆',
    'NH3': 'NH₃',
    'CO2': 'CO₂',
    'O2': 'O₂',
    'N2': 'N₂'
  };
  
  return commonMolecules[formula] || formula;
}

function clearCanvas() {
  canvas.innerHTML = '';
  atoms = [];
  bonds = [];
  selectedAtom = null;
  selectedBond = null;
  atomId = 0;
  bondId = 0;
  validationContainer.innerHTML = '';
  
  document.getElementById('formula').textContent = "-";
  document.getElementById('weight').textContent = "-";
  document.getElementById('atom-count').textContent = "0";
  document.getElementById('bond-count').textContent = "0";
  document.getElementById('smiles').textContent = "No molecule created";
  document.getElementById('molecule-structure').textContent = "H₂O";
  
  statusBar.textContent = "Canvas cleared";
}

function addHydrogens() {
  if (atoms.length === 0) {
    statusBar.textContent = "No atoms to add hydrogens to";
    return;
  }
  
  const typicalValence = {
    'C': 4,
    'N': 3,
    'O': 2,
    'S': 2,
    'Cl': 1,
    'F': 1,
    'Br': 1,
    'I': 1
  };
  
  let hydrogensAdded = 0;
  
  atoms.forEach(atom => {
    if (atom.symbol === 'H') return; // Skip hydrogens
    
    // Count existing bonds for this atom
    let bondCount = 0;
    bonds.forEach(bond => {
      if (bond.atom1 === atom.id || bond.atom2 === atom.id) {
        bondCount += bond.type;
      }
    });
    
    // Calculate needed hydrogens
    const maxValence = typicalValence[atom.symbol] || 4;
    const neededHydrogens = Math.max(0, maxValence - bondCount);
    
    // Add hydrogens
    for (let i = 0; i < neededHydrogens; i++) {
      // Position hydrogen around the atom
      const angle = (i / neededHydrogens) * 2 * Math.PI;
      const distance = 70; // Distance from atom
      const hX = atom.x + Math.cos(angle) * distance;
      const hY = atom.y + Math.sin(angle) * distance;
      
      // Create hydrogen atom
      createAtom('H', hX, hY);
      
      // Create bond to hydrogen
      createBond(atom.id, atomId - 1, 1);
      
      hydrogensAdded++;
    }
  });
  
  statusBar.textContent = `Added ${hydrogensAdded} hydrogen atoms to complete bonds`;
}

function loadTemplate(smiles) {
  try {
    // Clear existing canvas
    clearCanvas();
    
    // Create molecule from SMILES
    const molecule = OCL.Molecule.fromSmiles(smiles);
    
    // Get atom coordinates
    const idcode = molecule.getIDCode();
    const moleculeWithCoords = OCL.Molecule.fromIDCode(idcode);
    
    // Add atoms with coordinates
    const atomPositions = [];
    for (let i = 0; i < moleculeWithCoords.getAllAtoms(); i++) {
      const symbol = moleculeWithCoords.getAtomLabel(i);
      const x = moleculeWithCoords.getAtomX(i) * 30 + 200;
      const y = moleculeWithCoords.getAtomY(i) * 30 + 200;
      createAtom(symbol, x, y);
      atomPositions.push({id: atomId - 1, x, y});
    }
    
    // Add bonds
    for (let i = 0; i < moleculeWithCoords.getAllBonds(); i++) {
      const bond = moleculeWithCoords.getBond(i);
      const atom1 = bond.atom1;
      const atom2 = bond.atom2;
      const bondType = bond.type;
      
      createBond(
        atomPositions[atom1].id,
        atomPositions[atom2].id,
        bondType
      );
    }
    
    statusBar.textContent = `Loaded template: ${smiles}`;
  } catch (e) {
    statusBar.textContent = `Error loading template: ${e.message}`;
  }
}

// Initialize the app when the page loads
window.onload = init;