const cvs = document.getElementById("cvs");
const ctx = cvs.getContext("2d");

const timeSlider = document.getElementById("useDuration");
timeSlider.addEventListener("input", modifyTime);

const dropDownCloth = document.getElementById("clothType");
dropDownCloth.addEventListener("input", modifyClothType);

const border_margin = { x: 100, y: 100 };

let canvas_size = { width: 0, height: 0 };

let collider_radius = 0.7;
let join_break_error = 5.6;

let tool = "tear";

let pointColor = {
  hue: 222.16,
  saturation: 100,
  lightness: 50,
  hsl: function () {
    return (
      "hsl(" + this.hue + ", " + this.saturation + "%, " + this.lightness + "%)"
    );
  },
};

//Basic physics parameters
let k_0 = 200000;
let k = 200000;
let kv = 20;

let dotSize = 0.2;
let size = 10;
let spacing = 0.8;

let G = {
  t_ms: 0,
  dt_ms: 0,
  dt_s: 0,
};

function modifyClothType() {
  const dropDownCloth = document.getElementById("clothType");
  const selectedValue =
    dropDownCloth.options[dropDownCloth.selectedIndex].value;
  switch (selectedValue) {
    case "cotton":
      k_0 = 200000;
      kv = 20;
      dotSize = 0.2;
      size = 10;
      spacing = 0.8;
      break;
    case "wool":
      k_0 = 200000;
      kv = 40;
      dotSize = 0.4;
      size = 8;
      spacing = 0.8;
      break;
    case "silk":
      k_0 = 20000;
      kv = 200;
      dotSize = 0.1;
      size = 20;
      spacing = 0.4;
      break;
    case "polyester":
      k_0 = 400000;
      kv = 20;
      dotSize = 0.2;
      size = 10;
      spacing = 0.8;
      break;
    default:
      k_0 = 200000;
      kv = 20;
      dotSize = 0.2;
      size = 10;
      spacing = 0.8;
  }

  init();

  //modifyTime(); //essential to update the k value to the new k_0 value
}

function modifyTime() {
  const timeSlider = document.getElementById("useDuration");
  document.getElementById("useDurationValue").innerText = timeSlider.value;

  k = k_0 / (0.01 * (timeSlider.value + 1));
  //  kv = (20 * 1) / (timeSlider.value + 1);
  modifyColor(timeSlider.value);
}
function modifyColor(t) {
  const dropDownCloth = document.getElementById("clothType");
  const selectedCloth =
    dropDownCloth.options[dropDownCloth.selectedIndex].value;

  const dropDownDye = document.getElementById("dyeType");
  const selectedDye = dropDownDye.options[dropDownDye.selectedIndex].value;

  switch (selectedCloth) {
    case "cotton":
      switch (selectedDye) {
        case "dye1":
          console.log("dye1");
          pointColor.saturation = Math.max(0, 100 - t);
          break;
        case "dye2":
          console.log("dye2");
          pointColor.saturation = Math.max(0, 100 - 2 * t);
          break;
        default:
          pointColor.saturation = Math.max(0, 100 - t);
      }
      pointColor.saturation = Math.max(0, 100 - t);
    case "wool":
      pointColor.saturation = Math.max(0, 100 - 2 * t); //Dye disappears twice as fast on wool
    default:
      pointColor.saturation = Math.max(0, 100 - t);
  }
}

function resize() {
  canvas_size.width = window.innerWidth - 2 * border_margin.x;
  canvas_size.height = window.innerHeight - 2 * border_margin.y;
  cvs.width = canvas_size.width;
  cvs.height = canvas_size.height;
}

let points = [];
let joints = [];

const zoom = 50;

let pointer = { x: 100, y: 100 };

function distance(pt_a, pt_b) {
  return Math.sqrt(Math.pow(pt_b.x - pt_a.x, 2) + Math.pow(pt_b.y - pt_a.y, 2));
}

function init() {
  points = [];
  joints = [];
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const pinned = i == 0;
      points.push({
        x: (j - size / 2) * spacing,
        y: (i - size / 2) * spacing,
        px: (j - size / 2) * spacing,
        py: (i - size / 2) * spacing,
        ax: 0,
        ay: 0,
        pinned: pinned,
      });
    }
  }
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const idx = size * i + j;
      const pt_a = points[idx];
      if (i < size - 1) {
        const idx_b = idx + size;
        const pt_b = points[idx_b];
        const target_length = distance(pt_a, pt_b);
        joints.push({
          first: idx,
          second: idx_b,
          target_length: target_length,
          current_length: target_length,
          previous_length: target_length,
        });
      }
      if (j < size - 1) {
        const idx_b = idx + 1;
        const pt_b = points[idx_b];
        const target_length = distance(pt_a, pt_b);
        joints.push({
          first: idx,
          second: idx_b,
          target_length: target_length,
          current_length: target_length,
          previous_length: target_length,
        });
      }
    }
  }
}

function clamp(x, a, b) {
  return Math.min(Math.max(x, a), b);
}

function pointermove(event) {
  const rect = cvs.getBoundingClientRect(); // Get canvas position and size
  pointer.x =
    (((event.clientX - rect.left) / rect.width - 0.5) * canvas_size.width) /
    zoom;
  pointer.y =
    (((event.clientY - rect.top) / rect.height - 0.5) * canvas_size.height) /
    zoom;
}

function update_physics(dt) {
  for (const point of points) {
    point.ax = 0.0;
    point.bx = 0.0;
    if (point.pinned) continue;
    point.ay = 10;
  }

  for (let join of joints) {
    const pt_a = points[join.first];
    const pt_b = points[join.second];
    const length = distance(pt_a, pt_b);
    join.current_length = length;
    const error = length - join.target_length;
    if (Math.abs(error) > join_break_error) {
      // Delete join
      Array.prototype.splice.call(joints, joints.indexOf(join), 1);
      continue;
    }
    const dx = (pt_b.x - pt_a.x) / length;
    const dy = (pt_b.y - pt_a.y) / length;
    const fx =
      -k * dx * Math.max(0, error) * Math.max(0, error) * Math.sign(error);
    const fy =
      -k * dy * Math.max(0, error) * Math.max(0, error) * Math.sign(error);
    const v = (join.current_length - join.previous_length) / dt;
    const fvx = kv * v * dx;
    const fvy = kv * v * dy;
    let a_factor = 0;
    let b_factor = 0;
    if (pt_a.pinned) {
      a_factor = 0;
      if (pt_b.pinned) {
        b_factor = 0;
      } else {
        b_factor = 1;
      }
    } else {
      if (pt_b.pinned) {
        a_factor = 1;
        b_factor = 0;
      } else {
        a_factor = 0.5;
        b_factor = 0.5;
      }
    }
    pt_a.ax -= a_factor * (fx - fvx);
    pt_a.ay -= a_factor * (fy - fvy);
    pt_b.ax += b_factor * (fx - fvx);
    pt_b.ay += b_factor * (fy - fvy);
  }

  for (let join of joints) {
    join.previous_length = join.current_length;
  }

  if (tool == "push") {
    for (let point of points) {
      if (point.pinned) continue;
      const length = distance(pointer, point);
      const dx = (pointer.x - point.x) / length;
      const dy = (pointer.y - point.y) / length;
      const trigger_distance = collider_radius;
      if (length < trigger_distance) {
        let dst = length - trigger_distance;
        dst = Math.sign(dst) * Math.min(Math.abs(dst), 0.01);
        point.x += dx * dst;
        point.y += dy * dst;
      }
    }
  } else if (tool == "tear") {
    for (let join of joints) {
      // Distance from cursor to line
      const pt_a = points[join.first];
      const pt_b = points[join.second];
      const dx = pt_b.x - pt_a.x;
      const dy = pt_b.y - pt_a.y;

      const a = dx * dx + dy * dy;
      const b = 2 * (dx * (pt_a.x - pointer.x) + dy * (pt_a.y - pointer.y));
      const c =
        (pt_a.x - pointer.x) * (pt_a.x - pointer.x) +
        (pt_a.y - pointer.y) * (pt_a.y - pointer.y) -
        collider_radius * collider_radius;
      const d = b * b - 4 * a * c;
      if (d < 0) continue;
      const t = (-b - Math.sqrt(d)) / (2 * a);
      if (t < 0 || t > 1) continue;
      const x = pt_a.x + t * dx;
      const y = pt_a.y + t * dy;
      const distance = Math.sqrt(
        (x - pointer.x) * (x - pointer.x) + (y - pointer.y) * (y - pointer.y)
      );

      if (distance < collider_radius) {
        Array.prototype.splice.call(joints, joints.indexOf(join), 1);
        continue;
      }
    }
  }

  for (let point of points) {
    const nx = 2 * point.x - point.px + point.ax * dt * dt;
    const ny = 2 * point.y - point.py + point.ay * dt * dt;
    point.px = point.x;
    point.py = point.y;
    point.x = nx;
    point.y = ny;
  }
}

function frame(t_ms = 0) {
  G.dt_ms = (t_ms || 0) - G.t_ms;
  G.dt_s = G.dt_ms / 1000;
  G.t_ms = t_ms || 0;

  window.requestAnimationFrame(frame);

  if (G.dt_s > 0) {
    const subframes = 8;
    for (let i = 0; i < subframes; i++) {
      update_physics(G.dt_s / subframes);
    }
  }

  ctx.translate(canvas_size.width / 2, canvas_size.height / 2);
  ctx.scale(zoom, zoom);

  ctx.clearRect(
    -canvas_size.width,
    -canvas_size.height,
    2 * canvas_size.width,
    2 * canvas_size.height
  );

  ctx.lineWidth = 0.05;

  if (tool == "push") {
    ctx.strokeStyle = "green";
  } else if (tool == "tear") {
    ctx.strokeStyle = "red";
  } else {
    ctx.strokeStyle = "black";
    // Set dashed
    ctx.setLineDash([0.1, 0.1]);
    ctx.lineDashOffset = 0;
  }

  ctx.beginPath();
  ctx.arc(pointer.x, pointer.y, collider_radius, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.setLineDash([]);

  for (const join of joints) {
    const pt_a = points[join.first];
    const pt_b = points[join.second];
    const length_error =
      Math.abs(join.current_length - join.target_length) * 20;
    ctx.strokeStyle = "rgb(" + clamp(length_error, 0, 1) * 100 + "%,0%,0%)";
    ctx.beginPath();
    ctx.moveTo(pt_a.x, pt_a.y);
    ctx.lineTo(pt_b.x, pt_b.y);
    ctx.stroke();
  }

  for (const point of points) {
    ctx.fillStyle = point.pinned ? "red" : pointColor.hsl();
    ctx.beginPath();
    ctx.arc(point.x, point.y, dotSize, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

window.onload = () => {
  window.addEventListener("resize", resize, false);
  document.addEventListener("pointermove", pointermove);
  document.addEventListener("keydown", (event) => {
    if (event.key == "c") {
      if (tool == "push") {
        tool = "tear";
      } else if (tool == "tear") {
        tool = "disabled";
      } else if (tool == "disabled") {
        tool = "push";
      }
    } else if (event.key == "r") {
      points = [];
      joints = [];
      init();
    }
  });

  resize();

  init();

  frame();
};
