const cvs = document.getElementById('cvs');
const ctx = cvs.getContext('2d');

const timeSlider = document.getElementById('useDuration');
timeSlider.addEventListener('input', modifyTime);

const dropDownCloth = document.getElementById('clothType');
dropDownCloth.addEventListener('input', modifyClothType);

const border_margin = { x: 0, y: 0 };

let canvas_size = { width: 0, height: 0 };

let collider_radius = 0.7;
let join_break_error = 5.6;

let tool = 'push';
let mode = 'edition';

//Basic physics parameters
let k_0 = 200000;
let k = 200000;
let kv = 20;

let dotSize = 0.2;
let size = 30;
let spacing = 0.8;

let G = {
    t_ms: 0,
    dt_ms: 0,
    dt_s: 0,
};

function modifyClothType() {
    const dropDownCloth = document.getElementById('clothType');
    const selectedValue = dropDownCloth.options[dropDownCloth.selectedIndex].value;
    if (selectedValue == 'cotton') {
        k_0 = 200000;
        kv = 20;
        dotSize = 0.2;
        size = 10;
        spacing = 0.8;
    } else if (selectedValue == 'wool') {
        k_0 = 200000;
        kv = 40;
        dotSize = 0.4;
        size = 10;
        spacing = 0.8;
    } else if (selectedValue == 'silk') {
        k_0 = 20000;
        kv = 100;
        dotSize = 0.1;
        size = 20;
        spacing = 0.4;
    } else if (selectedValue == 'polyester') {
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
    const timeSlider = document.getElementById('useDuration');
    document.getElementById('useDurationValue').innerText = timeSlider.value;

    k = k_0 / (0.5 * (timeSlider.value + 1));
    //  kv = (20 * 1) / (timeSlider.value + 1);
}

function resize() {
    canvas_size.width = window.innerWidth - 2 * border_margin.x;
    canvas_size.height = window.innerHeight - 2 * border_margin.y;
    cvs.width = canvas_size.width;
    cvs.height = canvas_size.height;
}

let init_points = {};
let init_joints = [];

let points = [];
let joints = [];

let selection = [];

const zoom = 50;

let pointer = { x: 100, y: 100 };
let last_pointer_down = { x: 100, y: 100 };
let pointer_down = false;

function distance(pt_a, pt_b) {
    return Math.sqrt(Math.pow(pt_b.x - pt_a.x, 2) + Math.pow(pt_b.y - pt_a.y, 2));
}

function generate_init_placement() {
    const half_size = Math.round(size / 2);
    for (let i = -half_size; i < half_size; i++) {
        for (let j = -half_size; j < half_size; j++) {
            const pinned = i == -half_size;
            init_points[[i, j]] = {
                i,
                j,
                x: j * spacing,
                y: i * spacing,
                px: j * spacing,
                py: i * spacing,
                ax: 0,
                ay: 0,
                pinned: pinned,
            };
        }
    }

    for (let i = -half_size; i < half_size; i++) {
        for (let j = -half_size; j < half_size; j++) {
            const pt_a = init_points[[i, j]];
            if (i < half_size - 1) {
                const pt_b = init_points[[i + 1, j]];
                const target_length = distance(pt_a, pt_b);
                const first = { row: i, col: j };
                const second = { row: i + 1, col: j };
                init_joints.push({
                    first,
                    second,
                    target_length: target_length,
                    current_length: target_length,
                    previous_length: target_length,
                });
            }
            if (j < half_size - 1) {
                const pt_b = init_points[[i, j + 1]];
                const target_length = distance(pt_a, pt_b);
                const first = { row: i, col: j };
                const second = { row: i, col: j + 1 };
                init_joints.push({
                    first,
                    second,
                    target_length: target_length,
                    current_length: target_length,
                    previous_length: target_length,
                });
            }
        }
    }
}

function init() {
    points = [];
    joints = [];
    indices_map = {};
    let index = 0;

    for (const point of Object.values(init_points)) {
        points.push({ ...point });
        indices_map[[point.i, point.j]] = index;
        index += 1;
    }

    for (const join of init_joints) {
        const first = indices_map[[join.first.row, join.first.col]];
        const second = indices_map[[join.second.row, join.second.col]];
        joints.push({
            ...join,
            first: first,
            second: second,
        });
    }
}

function clamp(x, a, b) {
    return Math.min(Math.max(x, a), b);
}

function pointerdown(event) {
    const rect = cvs.getBoundingClientRect(); // Get canvas position and size
    pointer_down = true;
    last_pointer_down.x =
        (((event.clientX - rect.left) / rect.width - 0.5) * canvas_size.width) / zoom;
    last_pointer_down.y =
        (((event.clientY - rect.top) / rect.height - 0.5) * canvas_size.height) / zoom;
}

function pointermove(event) {
    const rect = cvs.getBoundingClientRect(); // Get canvas position and size
    pointer.x = (((event.clientX - rect.left) / rect.width - 0.5) * canvas_size.width) / zoom;
    pointer.y = (((event.clientY - rect.top) / rect.height - 0.5) * canvas_size.height) / zoom;
}

function tool_interact_simu() {
    if (tool == 'push') {
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
    } else if (tool == 'tear') {
        for (let join of joints) {
            // Distance from cursor to line
            const pt_a = points[join.first];
            const pt_b = points[join.second];
            if (pt_a.pinned && pt_b.pinned) continue;
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
}

function tool_interact_paint() {
    if (tool == 'pin') {
        for (let point of points) {
            if (point.pinned) continue;
            const length = distance(pointer, point);
            const trigger_distance = collider_radius;
            if (length < trigger_distance) {
                point.pinned = true;
                point.px = point.x;
                point.py = point.y;
                point.ax = 0;
                point.ay = 0;
            }
        }
    } else if (tool == 'unpin') {
        for (let point of points) {
            if (!point.pinned) continue;
            const length = distance(pointer, point);
            const trigger_distance = collider_radius;
            if (length < trigger_distance) {
                point.pinned = false;
            }
        }
    }
}

function tool_interact() {
    if (mode == 'simu') {
        tool_interact_simu();
    } else if (mode == 'paint') {
        tool_interact_paint();
    }
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
        const corrected_error = Math.max(0, error) - Math.max(0, -error - 1);
        const fx = -k * dx * corrected_error * corrected_error * Math.sign(corrected_error);
        const fy = -k * dy * corrected_error * corrected_error * Math.sign(corrected_error);
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

    for (let point of points) {
        const nx = 2 * point.x - point.px + point.ax * dt * dt;
        const ny = 2 * point.y - point.py + point.ay * dt * dt;
        point.px = point.x;
        point.py = point.y;
        point.x = nx;
        point.y = ny;
    }
}

function draw_brush() {
    if (mode == 'simu') {
        if (tool == 'push') {
            ctx.strokeStyle = 'green';
        } else if (tool == 'tear') {
            ctx.strokeStyle = 'red';
        } else {
            ctx.strokeStyle = 'black';
            // Set dashed
            ctx.setLineDash([0.1, 0.1]);
            ctx.lineDashOffset = 0;
        }
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, collider_radius, 0, 2 * Math.PI);
        ctx.stroke();
    } else if (mode == 'paint') {
        if (tool == 'pin') {
            ctx.strokeStyle = 'red';
        } else if (tool == 'unpin') {
            ctx.strokeStyle = 'blue';
        } else {
            ctx.strokeStyle = 'black';
            // Set dashed
            ctx.setLineDash([0.1, 0.1]);
            ctx.lineDashOffset = 0;
        }
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, collider_radius, 0, 2 * Math.PI);
        ctx.stroke();
    } else if (mode == 'edit') {
    }
}

function map(x, a, b, c, d) {
    return ((x - a) / (b - c)) * (d - c) + c;
}

function draw_misc_edit() {
    const line_backup = ctx.lineWidth;
    ctx.lineWidth = 0.01;
    for (
        let x = -Math.floor(canvas_size.width / spacing) * spacing;
        x < canvas_size.width;
        x += spacing
    ) {
        ctx.beginPath();
        ctx.moveTo(x, -canvas_size.height / 2);
        ctx.lineTo(x, canvas_size.height / 2);
        ctx.stroke();
    }
    for (
        let y = -Math.floor(canvas_size.height / spacing) * spacing;
        y < canvas_size.height;
        y += spacing
    ) {
        ctx.beginPath();
        ctx.moveTo(-canvas_size.width / 2, y);
        ctx.lineTo(canvas_size.width / 2, y);
        ctx.stroke();
    }

    const preview_extend = 10;

    ctx.fillStyle = 'blue';

    for (
        let x = Math.floor((pointer.x - preview_extend) / spacing) * spacing;
        x < pointer.x + preview_extend;
        x += spacing
    ) {
        for (
            let y = Math.floor((pointer.y - preview_extend) / spacing) * spacing;
            y < pointer.y + preview_extend;
            y += spacing
        ) {
            let pt = { x: x, y: y };
            let d = clamp(distance(pointer, pt), 0, 10);
            let r = clamp(map(d, 0, 10, dotSize / 2, 0), 0, dotSize / 2);
            if (d < dotSize) r = dotSize;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
    ctx.lineWidth = line_backup;

    if (pointer_down) {
        ctx.fillStyle = '#eb910988';
        ctx.strokeStyle = '#eb9109';
        ctx.beginPath();
        ctx.rect(
            last_pointer_down.x,
            last_pointer_down.y,
            pointer.x - last_pointer_down.x,
            pointer.y - last_pointer_down.y
        );
        ctx.fill();
        ctx.stroke();

        selection = [];
        const xmin = Math.min(last_pointer_down.x, pointer.x);
        const ymin = Math.min(last_pointer_down.y, pointer.y);
        const xmax = Math.max(last_pointer_down.x, pointer.x);
        const ymax = Math.max(last_pointer_down.y, pointer.y);

        for (let x = Math.ceil(xmin / spacing); x < Math.ceil(xmax / spacing); x += 1) {
            for (let y = Math.ceil(ymin / spacing); y < Math.ceil(ymax / spacing); y += 1) {
                selection.push({
                    i: y,
                    j: x,
                });
            }
        }
    }

    for (const coords of selection) {
        ctx.beginPath();
        ctx.arc(coords.j * spacing, coords.i * spacing, dotSize, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function frame(t_ms = 0) {
    G.dt_ms = Math.min((t_ms || 0) - G.t_ms, 16);
    G.dt_s = G.dt_ms / 1000;
    G.t_ms = t_ms || 0;

    window.requestAnimationFrame(frame);

    if (mode == 'simu' && G.dt_s > 0) {
        const subframes = 8;
        for (let i = 0; i < subframes; i++) {
            update_physics(G.dt_s / subframes);
        }
    }

    tool_interact();

    ctx.translate(canvas_size.width / 2, canvas_size.height / 2);
    ctx.scale(zoom, zoom);

    ctx.clearRect(
        -canvas_size.width,
        -canvas_size.height,
        2 * canvas_size.width,
        2 * canvas_size.height
    );

    ctx.lineWidth = 0.05;

    if (mode == 'edit') {
        draw_misc_edit();
    }

    draw_brush();

    ctx.setLineDash([]);

    for (const join of joints) {
        const pt_a = points[join.first];
        const pt_b = points[join.second];
        const length_error = Math.abs(join.current_length - join.target_length) * 20;
        ctx.strokeStyle = 'rgb(' + clamp(length_error, 0, 1) * 100 + '%,0%,0%)';
        ctx.beginPath();
        ctx.moveTo(pt_a.x, pt_a.y);
        ctx.lineTo(pt_b.x, pt_b.y);
        ctx.stroke();
    }

    for (const point of points) {
        ctx.fillStyle = point.pinned ? 'red' : 'black';
        ctx.beginPath();
        ctx.arc(point.x, point.y, dotSize, 0, 2 * Math.PI);
        ctx.fill();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function change_tool() {
    if (mode == 'simu') {
        if (tool == 'push') {
            tool = 'tear';
        } else if (tool == 'tear') {
            tool = 'disabled';
        } else if (tool == 'disabled') {
            tool = 'push';
        }
    } else if (mode == 'paint') {
        if (tool == 'pin') {
            tool = 'unpin';
        } else if (tool == 'unpin') {
            tool = 'disabled';
        } else if (tool == 'disabled') {
            tool = 'pin';
        }
    }
}

window.onload = () => {
    window.addEventListener('resize', resize, false);
    document.addEventListener('pointerdown', pointerdown);
    document.addEventListener('pointermove', pointermove);
    document.addEventListener('pointerup', () => {
        pointer_down = false;
    });
    document.addEventListener('keydown', (event) => {
        if (event.key == 'c') {
            change_tool();
        } else if (event.key == 'p') {
            if (mode == 'simu') {
                mode = 'paint';
                tool = 'disabled';
            } else {
                mode = 'simu';
                tool = 'disabled';
            }
        } else if (event.key == 'e') {
            if (mode == 'edit') {
                mode = 'paint';
                tool = 'disabled';
            } else {
                mode = 'edit';
                init();
            }
        } else if (event.key == 'r') {
            init();
        }
    });

    resize();

    generate_init_placement();
    init();

    frame();
};
