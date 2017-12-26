var keyMap = Array(256);

var mouseX = 0;
var mouseY = 0;
var mouseDown = false;

var windowWidth;
var windowHeight;

var regions = [];

const REGION_SIZE = 100;
const FISH_LENGTH = 10;
const FISH_WIDTH = 2.5;

// debug
const REGION_HIGHLIGHTING = true;

Number.prototype.mod = function(n) {
    return ((this % n) + n) % n;
};

var n = 0;
var numberGen = function() {
    n += Math.random();
    return n;
};

var distance = function(p1, p2) {
    let d = Math.sqrt((p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1]));
    //if (isNaN(d)) console.log(p1, p2, d)
    return d;
};

var addFish = function(fish) {
    fish.position[0] = fish.position[0].mod(regions.length * REGION_SIZE);
    fish.position[1] = fish.position[1].mod(regions[0].length * REGION_SIZE);
    let x = Math.floor(fish.position[0] / REGION_SIZE);
    let y = Math.floor(fish.position[1] / REGION_SIZE);
    //if (x >= regions.length || x < 0) x = x.mod(regions.length);
    //if (y >= regions[0].length || y < 0) y = y.mod(regions[0].length);
    regions[x][y].push(fish);
};

var update = function() {
    for (let i = 0; i < regions.length; i++) {
        for (let j = 0; j < regions[0].length; j++) {
            for (let k = 0; k < regions[i][j].length; k++) {
                let fish = regions[i][j][k];
                if (isNaN(fish.position[0])) console.log(fish)

                for (let di = -1; di <= 1; di++) {
                    for (let dj = -1; dj <= 1; dj++) {
                        let dx = dy = 0;
                        let i2 = i + di;
                        if (i2 >= regions.length) {
                            i2 -= regions.length;
                            dx = regions.length * REGION_SIZE;
                        }
                        if (i2 < 0) {
                            i2 += regions.length;
                            dx = -regions.length * REGION_SIZE;
                        }
                        let j2 = j + dj;
                        if (j2 >= regions[0].length) {
                            j2 -= regions[0].length;
                            dy = regions[0].length * REGION_SIZE;
                        }
                        if (j2 < 0) {
                            j2 += regions[0].length;
                            dy = -regions[0].length * REGION_SIZE;
                        }
                        let minDist = REGION_SIZE;
                        let minDistFish;
                        for (let fish2 of regions[i2][j2]) {
                            if (fish == fish2) continue;
                            let d = distance(fish.position, [fish2.position[0] + dx, fish2.position[1] + dy]);
                            
                            if (d < REGION_SIZE) {
                                if (d < minDist) {
                                    minDist = d;
                                    minDistFish = fish2;
                                }

                                if (d < FISH_LENGTH * 1.5) {
                                    fish.velocity[0] += Math.max(-0.01, Math.min(0.01, (fish.position[0] - fish2.position[0]) / d / d * 0.1));
                                    fish.velocity[1] += Math.max(-0.01, Math.min(0.01, (fish.position[1] - fish2.position[1]) / d / d * 0.1));
                                }
                            }
                        }
                        if (Math.random() < 0.2) {
                            if (minDistFish) fish.angularv = (minDistFish.rotation - fish.rotation) / 50;
                        } else {
                            if (minDistFish) fish.angularv = (Math.PI - Math.abs(Math.abs(minDistFish.rotation - fish.rotation) - Math.PI)) / 100;
                        }
                        // used to be an issue in cases where rotations were being compared like 10 and 350 would be 340 when it should be 20.
                    }
                }

                fish.position[0] += fish.velocity[0];
                fish.position[1] += fish.velocity[1];
                fish.rotation += fish.angularv;
                fish.rotation = fish.rotation.mod(Math.PI * 2);

                fish.velocity[0] *= 0.95;
                fish.velocity[1] *= 0.95;

                fish.velocity[0] += 0.03 * Math.cos(fish.rotation);
                fish.velocity[1] += 0.03 * Math.sin(fish.rotation);

                if (fish.position[0] > (i + 1) * REGION_SIZE ||
                    fish.position[0] < i * REGION_SIZE ||
                    fish.position[1] > (j + 1) * REGION_SIZE ||
                    fish.position[1] < j * REGION_SIZE)
                    fish.needsUpdate = true;
            }
        }
    }

    for (let i = 0; i < regions.length; i++) {
        for (let j = 0; j < regions[0].length; j++) {
            for (let k = 0; k < regions[i][j].length; k++) {
                let fish = regions[i][j][k];
                if (fish.needsUpdate) {
                    addFish(regions[i][j].splice(k, 1)[0]);
                    fish.needsUpdate = false;
                }
            }
        }
    }
};

var drawFish = function(ctx, x, y, dx, dy) {
    ctx.beginPath();
    ctx.moveTo(x - dx, y - dy);
    ctx.lineTo(x + dx, y + dy);
    ctx.stroke();
};

var render = function() {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, windowWidth, windowHeight);

    ctx.save();
    //ctx.translate(-FISH_LENGTH, -FISH_LENGTH);

    ctx.lineCap = "round";
    ctx.globalAlpha = 1;
    ctx.lineWidth = FISH_WIDTH;

    let mouseRegionX = Math.floor(mouseX / REGION_SIZE),
        mouseRegionY = Math.floor(mouseY / REGION_SIZE);
    if (REGION_HIGHLIGHTING) {
        ctx.fillStyle = "#FEE";
        ctx.fillRect(mouseRegionX * REGION_SIZE, mouseRegionY * REGION_SIZE, REGION_SIZE, REGION_SIZE);
    }

    let width = REGION_SIZE * regions.length;
    let height = REGION_SIZE * regions[0].length;

    for (let i = 0; i < regions.length; i++) {
        for (let j = 0; j < regions[0].length; j++) {
            if (REGION_HIGHLIGHTING)
                ctx.lineWidth = mouseRegionX == i && mouseRegionY == j ? FISH_WIDTH * 1.5 : FISH_WIDTH;
            for (let k = 0; k < regions[i][j].length; k++) {
                let fish = regions[i][j][k];
                ctx.strokeStyle = fish.color;
                let dx = FISH_LENGTH / 2 * Math.cos(fish.rotation),
                    dy = FISH_LENGTH / 2 * Math.sin(fish.rotation);
                drawFish(ctx, ...fish.position, dx, dy);
                if (fish.position[0] > width - FISH_LENGTH / 2)
                    drawFish(ctx, fish.position[0] - width, fish.position[1], dx, dy);
                if (fish.position[0] < FISH_LENGTH / 2)
                    drawFish(ctx, fish.position[0] + width, fish.position[1], dx, dy);
                if (fish.position[1] > height - FISH_LENGTH / 2)
                    drawFish(ctx, fish.position[0], fish.position[1] - height, dx, dy);
                if (fish.position[1] < FISH_LENGTH / 2)
                    drawFish(ctx, fish.position[0], fish.position[1] + height, dx, dy);
            }

        }
    }
    ctx.restore();
};

var frame = function() {
    update();
    render();
    if (!keyMap[32]) requestAnimationFrame(frame);
}

var initFish = function() {
    for (let i = 0; i < 2000; i++) {
        addFish({
            position: [(Math.random() * 0.5 + 0.25) * windowWidth, (Math.random() * 0.5 + 0.25) * windowHeight],
            //[Math.random() * regions.length * REGION_SIZE, Math.random() * regions[0].length * REGION_SIZE],
            velocity: [0, 0], //[(Math.random() - 0.5), (Math.random() - 0.5)],
            rotation: Math.random() * (2 * Math.PI),
            angularv: 0, //(Math.random() - 0.5) * 0.01,
            color: "#008",
            needsUpdate: false
        });
    }
}

var align = function() {
    windowWidth = $(window).width();
    windowHeight = $(window).height();
    $("#canvas").attr("width", windowWidth)
        .attr("height", windowHeight);

    let width = Math.ceil(windowWidth / REGION_SIZE);
    let height = Math.ceil(windowHeight / REGION_SIZE);

    while (width > regions.length) {
        let row = Array(height);
        for (let i = 0; i < height; i++) row[i] = [];
        regions.push(row);
    }
    if (regions.length > width)
        regions.splice(width);
    for (let row of regions) {
        if (row.length > height)
            row.splice(height);
        else {
            while (height > row.length)
                row.push([]);
        }
    }
};

$(window).on("resize", align);

$(document).ready(function() {
    align();

    document.addEventListener("keydown", e => {
        var code = (window.event) ? event.keyCode : e.keyCode;
        keyMap[code] = true;
    }, false);
    document.addEventListener("keyup", e => {
        var code = (window.event) ? event.keyCode : e.keyCode;
        keyMap[code] = false;
    }, false);

    document.addEventListener("mousemove", e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }, false);
    document.addEventListener("mousedown", e => {
        mouseDown = true;
    });
    document.addEventListener("mouseup", e => {
        mouseDown = false;
    });

    initFish();
    requestAnimationFrame(frame);
});