eamLength = 0;
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

function resetCalculator() {
  beamLength = 0;
  loads = [];
  document.getElementById("beamLength").value = "";
  document.getElementById("loadValue").value = "";
  document.getElementById("loadPosition").value = "";
  document.getElementById("reactionAy").innerText = "Reaction at A (Ay): 0 N";
  document.getElementById("reactionMA").innerText = "Moment at A (MA): 0 Nm";
  document.getElementById("beamDiagram").innerHTML = '<div class="reaction-marker"></div>';
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

  let Ay = loads.reduce((sum, load) => sum + load.value, 0);
  let MA = loads.reduce((sum, load) => sum + load.value * load.position, 0);

  document.getElementById("reactionAy").innerText = `Reaction at A (Ay): ${Ay.toFixed(2)} N`;
  document.getElementById("reactionMA").innerText = `Moment at A (MA): ${MA.toFixed(2)} Nm`;
  computeSFD_BMD(Ay, MA);
}

function computeSFD_BMD(Ay, MA) {
  const step = 0.1;
  const points = Math.round(beamLength / step) + 1;
  let shearForce = new Array(points).fill(Ay);
  let bendingMoment = new Array(points).fill(0);

  for (let i = 0; i < points; i++) {
    let x = i * step;
    
    // Shear Force remains constant along the length
    loads.forEach((load) => {
      if (x >= load.position) {
        shearForce[i] -= load.value;
      }
    });

    // Bending Moment Calculation
    bendingMoment[i] = -loads.reduce((sum, load) => {
      return sum + load.value * (beamLength - x);
    }, 0);
  }

  // Draw Charts
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
  if (chartInstance) chartInstance.destroy();
  return new Chart(ctx, {
    type: "line",
    data: {
      labels: Array.from({ length: points }, (_, i) => (i * step).toFixed(2)),
      datasets: [{
        label: label,
        data: data,
        borderColor: color,
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Beam Length (m)", color: "white" } },
        y: { title: { display: true, text: "Force / Moment", color: "white" } },
      },
      plugins: {
        legend: { labels: { color: "white" } },
        zoom: {
          pan: {
            enabled: true,
            mode: 'x',
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true,
            },
            mode: 'x',
          },
        },
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
  function resetZoom() {
    if (sfdChartInstance) sfdChartInstance.resetZoom();
    if (bmdChartInstance) bmdChartInstance.resetZoom();
}
}