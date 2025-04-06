let beam_len = 0;
let loadList = [];

var chartSFD;
var chartBMD;

// just converting units
function convertLen(x, unit) {
  if (unit === 'cm') return x / 100;
  return x;
}

function convertForce(f, unit) {
  return unit === 'kN' ? f * 1000 : f;
}

// Add a loadd
function addLoad() {
  var loadVal = parseFloat(document.getElementById("loadVal").value);
  var forceU = document.getElementById("forceUnit").value;
  var posVal = parseFloat(document.getElementById("loadPos").value);
  var posU = document.getElementById("positionUnit").value;

  if (isNaN(loadVal) || isNaN(posVal) || loadVal <= 0 || posVal < 0) {
    alert("Fix the inputs please");
    return;
  }

  let finalF = convertForce(loadVal, forceU);
  let finalP = convertLen(posVal, posU);

  // not updating beam length if it's already there
  if (beam_len <= 0) {
    var temp = parseFloat(document.getElementById("beamLength").value);
    var unit = document.getElementById("lengthUnit").value;
    beam_len = convertLen(temp, unit);
  }

  loadList.push({ force: finalF, position: finalP });
  refreshBeamView();
}

// calculating reactions and plotting sfdbmd
function calculate() {
  let rawL = parseFloat(document.getElementById("beamLength").value);
  let unitL = document.getElementById("lengthUnit").value;
  beam_len = convertLen(rawL, unitL);

  if (!beam_len || beam_len <= 0) {
    alert("Beam length is wrong or missing");
    return;
  }

  let reaction_Ay = 0;
  for (let i = 0; i < loadList.length; i++) {
    reaction_Ay += loadList[i].force;
  }

  var moment_A = 0;
  for (let i = 0; i < loadList.length; i++) {
    moment_A += loadList[i].force * loadList[i].position;
  }

  document.getElementById("reactionA").innerText = "Reaction at A: " + reaction_Ay.toFixed(2) + " N";
  document.getElementById("momentA").innerText = "Moment at A: " + moment_A.toFixed(2) + " Nm";

  drawDiagrams(reaction_Ay);
}

// For the reset buton
function reset() {
  beam_len = 0;
  loadList = [];

  // clear all inputs
  document.getElementById("beamLength").value = "";
  document.getElementById("loadVal").value = "";
  document.getElementById("loadPos").value = "";

  document.getElementById("reactionA").innerText = "Reaction at A: 0 N";
  document.getElementById("momentA").innerText = "Moment at A: 0 Nm";

  document.getElementById("beam").innerHTML = '<div class="reaction-marker"></div>';

  if (chartSFD) {
    chartSFD.destroy();
  }
  if (chartBMD) {
    chartBMD.destroy();
  }
}

// can be refined more
function drawDiagrams(ay) {
  var sortedLoads = [...loadList].sort(function(a, b) {
    return a.position - b.position;
  });

  let xSFD = [0];
  let ySFD = [ay];
  let tempForce = ay;
  let prev = 0;

  for (let i = 0; i < sortedLoads.length; i++) {
    let f = sortedLoads[i].force;
    let p = sortedLoads[i].position;

    if (p !== prev) {
      xSFD.push(p);
      ySFD.push(tempForce);
    }

    tempForce -= f;
    xSFD.push(p);
    ySFD.push(tempForce);

    prev = p;
  }

  if (prev < beam_len) {
    xSFD.push(beam_len);
    ySFD.push(tempForce);
  }

  // for correct display in diagram of bm
  let xBMD = [], yBMD = [];
  for (let pos = 0; pos <= beam_len; pos += 0.1) {
    let m = 0;

    for (let j = 0; j < loadList.length; j++) {
      if (pos <= loadList[j].position) {
         //important sign convention use
        m -= loadList[j].force * (loadList[j].position - pos);
      }
    }

    xBMD.push(Number(pos.toFixed(2))); // keeping it clean
    yBMD.push(m);
  }

  chartSFD = drawChart("sfd", "Shear Force (N)", xSFD, ySFD, "#b20000", chartSFD, true);
  chartBMD = drawChart("bmd", "Bending Moment (Nm)", xBMD, yBMD, "#0033cc", chartBMD, false);
}

// chart renderer generic
function drawChart(canvasId, label, xData, yData, color, oldRef, stepped) {
  var ctx = document.getElementById(canvasId).getContext("2d");
  if (oldRef) oldRef.destroy();

  return new Chart(ctx, {
    type: "line",
    data: {
      labels: xData,
      datasets: [{
        label: label,
        data: yData,
        borderColor: color,
        backgroundColor: "rgba(255,255,255,0.3)",
        fill: true,
        stepped: stepped ? 'before' : false,
        tension: 0
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          type: 'linear',
          title: {
            display: true,
            text: "Length along Beam (m)",
            color: "#222"
          }
        },
        y: {
          title: {
            display: true,
            text: "Force / Moment",
            color: "#222"
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: "#333"
          }
        },
        zoom: {
          pan: {
            enabled: true,
            mode: 'x'
          },
          zoom: {
            wheel: {
              enabled: true
            },
            pinch: {
              enabled: true
            },
            mode: 'x'
          }
        }
      }
    }
  });
}

// draw beam with marker blpcks for loads
function refreshBeamView() {
  if (beam_len <= 0) return;

  var beamDom = document.getElementById("beam");
  beamDom.innerHTML = '<div class="reaction-marker"></div>';

  for (let i = 0; i < loadList.length; i++) {
    var lm = document.createElement("div");
    lm.className = "load-marker";
    lm.style.left = ((loadList[i].position / beam_len) * 100) + "%";
    beamDom.appendChild(lm);
  }
}