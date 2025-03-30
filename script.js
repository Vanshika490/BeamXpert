let beamLength = 0;
let loads = [];
let sfdChartInstance, bmdChartInstance;

function convertLength(value, unit) {
  return unit === "cm" ? value / 100 : value;
}

function convertForce(value, unit) {
  return unit === "kN" ? value * 1000 : value;
}

function addLoad() {
  const value = parseFloat(document.getElementById("loadValue").value);
  const forceUnit = document.getElementById("forceUnit").value;
  const position = parseFloat(document.getElementById("loadPosition").value);
  const positionUnit = document.getElementById("positionUnit").value;

  if (isNaN(value) || isNaN(position) || value <= 0 || position < 0) {
    alert("Enter valid values!");
    return;
  }

  let convertedValue = convertForce(value, forceUnit);
  let convertedPosition = convertLength(position, positionUnit);

  loads.push({ value: convertedValue, position: convertedPosition });

  updateBeamDiagram();
}

// ✅ Moved resetCalculator() OUTSIDE calculateDiagrams()
function resetCalculator() {
  // Reset global variables
  beamLength = 0;
  loads = [];

  // Clear input fields
  document.getElementById("beamLength").value = "";
  document.getElementById("loadValue").value = "";
  document.getElementById("loadPosition").value = "";

  // Reset reaction values
  document.getElementById("reactionAy").innerText = "Reaction at A (Ay): 0 N";
  document.getElementById("reactionMA").innerText = "Moment at A (MA): 0 Nm";

  // Clear beam diagram
  document.getElementById("beamDiagram").innerHTML =
    '<div class="reaction-marker"></div>';

  // Reset Charts
  if (sfdChartInstance) sfdChartInstance.destroy();
  if (bmdChartInstance) bmdChartInstance.destroy();
}

function calculateDiagrams() {
  beamLength = convertLength(
    parseFloat(document.getElementById("beamLength").value),
    document.getElementById("lengthUnit").value
  );

  if (isNaN(beamLength) || beamLength <= 0) {
    alert("Please enter a valid beam length.");
    return;
  }

  // Reset previous data to prevent accumulation
  document.getElementById("reactionAy").innerText = "";
  document.getElementById("reactionMA").innerText = "";

  // Reset beam diagram
  document.getElementById("beamDiagram").innerHTML =
    '<div class="reaction-marker"></div>';

  // Reset Charts
  if (sfdChartInstance instanceof Chart) sfdChartInstance.destroy();
  if (bmdChartInstance instanceof Chart) bmdChartInstance.destroy();

  // Compute Reactions
  let Ay = 0,
    MA = 0;
  loads.forEach((load) => {
    Ay += load.value;
    MA += load.value * load.position;
  });

  document.getElementById(
    "reactionAy"
  ).innerText = `Reaction at A (Ay): ${Ay.toFixed(2)} N`;
  document.getElementById(
    "reactionMA"
  ).innerText = `Moment at A (MA): ${MA.toFixed(2)} Nm`;

  // Compute and display new diagrams
  computeSFD_BMD();
}

function computeSFD_BMD() {
  const step = 0.1; // Small increments along the beam
  const points = Math.round(beamLength / step) + 1;

  let shearForce = new Array(points).fill(0);
  let bendingMoment = new Array(points).fill(0);

  // Compute Reactions
  let Ay = 0,
    MA = 0;
  loads.forEach((load) => {
    Ay += load.value;
    MA += load.value * load.position;
  });

  // Compute Shear Force and Bending Moment
  for (let i = 0; i < points; i++) {
    let x = i * step;
    let SF = Ay; // Initial shear force at fixed end
    let BM = 0; // Bending moment at section x

    // Adjust SF for each point load encountered
    for (let j = 0; j < loads.length; j++) {
      if (x >= loads[j].position) {
        SF -= loads[j].value;
      }
    }

    // Calculate BM due to all loads
    for (let j = 0; j < loads.length; j++) {
      if (x >= loads[j].position) {
        BM += loads[j].value * (x - loads[j].position);
      }
    }

    shearForce[i] = SF;
    bendingMoment[i] = MA - BM; // Adjusting for fixed-end moment
  }

  // Update charts
  sfdChartInstance = drawChart(
    shearForce,
    "sfdChart",
    "Shear Force Diagram (N)",
    "red",
    sfdChartInstance,
    points,
    step
  );
  bmdChartInstance = drawChart(
    bendingMoment,
    "bmdChart",
    "Bending Moment Diagram (Nm)",
    "blue",
    bmdChartInstance,
    points,
    step
  );
}

function drawChart(data, canvasId, label, color, chartInstance, points, step) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  if (chartInstance) chartInstance.destroy(); // Remove old chart if exists

  return new Chart(ctx, {
    type: "line",
    data: {
      labels: Array.from({ length: points }, (_, i) => (i * step).toFixed(2)),
      datasets: [
        {
          label: label,
          data: data,
          borderColor: color,
          backgroundColor: "rgba(255, 255, 255, 0.3)",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: "Beam Length (m)", color: "white" },
        },
        y: { title: { display: true, text: "Force / Moment", color: "white" } },
      },
      plugins: {
        legend: { labels: { color: "white" } },
      },
    },
  });
}

function updateBeamDiagram() {
  beamLength = convertLength(
    parseFloat(document.getElementById("beamLength").value),
    document.getElementById("lengthUnit").value
  );
  const beam = document.getElementById("beamDiagram");
  beam.innerHTML = '<div class="reaction-marker"></div>';

  loads.forEach((load) => {
    const marker = document.createElement("div");
    marker.className = "load-marker";
    marker.style.left = `${(load.position / beamLength) * 100}%`;
    beam.appendChild(marker);
  });
}