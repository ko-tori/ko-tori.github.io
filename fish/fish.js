var keyMap = Array(256);

var mouseX = 0;
var mouseY = 0;
var mouseDown = false;
var currentTouches = [];

var windowWidth;
var windowHeight;

var regions = [];
var fishCount = 2000;
var maxNearby = fishCount;
var avgSpeed = 0;

const REGION_SIZE = 100;
const FISH_LENGTH = 15;
const FISH_WIDTH = 4;

var options = {
    REGION_HIGHLIGHTING: false,
    COLOR_SCHEME: 0,
    MOUSE_RANGE: REGION_SIZE
}

Number.prototype.mod = function(n) {
    return ((this % n) + n) % n;
};

var n = 0;
var numberGen = function() {
    n += Math.random();
    return n;
};

var magnitude = function(v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
};

var distance = function(p1, p2) {
    return magnitude([p1[0] - p2[0], p1[1] - p2[1]]);
};

var angleDifference = function(a, b) {
    return Math.atan2(Math.sin(a - b), Math.cos(a - b));
    return (Math.PI - Math.abs(Math.abs(a - b) - Math.PI)) * Math.sign();
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
    fishCount = 0;
    maxNearby = 0;
    let totalSpeed = 0;
    for (let i = 0; i < regions.length; i++) {
        for (let j = 0; j < regions[0].length; j++) {
            for (let k = 0; k < regions[i][j].length; k++) {
                let fish = regions[i][j][k];
                fishCount++;
                fish.nearby = 0;
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
                                fish.nearby++;
                                if (d < minDist) {
                                    minDist = d;
                                    minDistFish = fish2;
                                }

                                if (d < FISH_LENGTH * 1.5) {
                                    fish.velocity[0] += Math.max(-0.05, Math.min(0.05, (fish.position[0] - fish2.position[0]) / d / d * 0.1));
                                    fish.velocity[1] += Math.max(-0.05, Math.min(0.05, (fish.position[1] - fish2.position[1]) / d / d * 0.1));
                                }
                            }
                        }
                        // if (minDistFish) fish.angularv = (minDistFish.rotation - fish.rotation) / 50;
                        if (minDistFish) {
                            fish.angularv = angleDifference(minDistFish.rotation, fish.rotation) / 50;
                            fish.velocity[0] += (minDistFish.velocity[0] - fish.velocity[0]) / 100;
                            fish.velocity[1] += (minDistFish.velocity[1] - fish.velocity[1]) / 100;
                        }
                        // used to be an issue in cases where rotations were being compared like 10 and 350 would be 340 when it should be 20.
                    }
                }

                if (fish.nearby > maxNearby) maxNearby = fish.nearby;
                let speed = magnitude(fish.velocity);
                totalSpeed += speed;

                fish.position[0] += fish.velocity[0];
                fish.position[1] += fish.velocity[1];
                fish.rotation += fish.angularv;
                fish.rotation = fish.rotation.mod(Math.PI * 2);

                fish.velocity[0] *= 0.95;
                fish.velocity[1] *= 0.95;

                fish.velocity[0] += 0.08 * Math.cos(fish.rotation);
                fish.velocity[1] += 0.08 * Math.sin(fish.rotation);

                let d = distance(fish.position, [mouseX, mouseY]);
                if (mouseDown && d < options.MOUSE_RANGE) {
                    fish.rotation += angleDifference(Math.atan2(fish.position[1] - mouseY, fish.position[0] - mouseX), fish.rotation) / 10;
                    fish.velocity[0] += Math.min(0.1, 20 / d * Math.cos(fish.rotation));
                    fish.velocity[1] += Math.min(0.1, 20 / d * Math.sin(fish.rotation));
                }
                for (let touch of currentTouches) {
                    let d = distance(fish.position, [touch.clientX, touch.clientY]);
                    if (d < options.MOUSE_RANGE) {
                        fish.rotation += angleDifference(Math.atan2(fish.position[1] - touch.clientY, fish.position[0] - touch.clientX), fish.rotation) / 10;
                        fish.velocity[0] += Math.min(0.1, 20 / d * Math.cos(fish.rotation));
                        fish.velocity[1] += Math.min(0.1, 20 / d * Math.sin(fish.rotation));
                    }
                }

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
    avgSpeed = totalSpeed / fishCount;
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

    ctx.lineCap = "round";
    ctx.globalAlpha = 1;
    ctx.lineWidth = FISH_WIDTH;

    let mouseRegionX = Math.floor(mouseX / REGION_SIZE),
        mouseRegionY = Math.floor(mouseY / REGION_SIZE);
    if (options.REGION_HIGHLIGHTING) {
        ctx.fillStyle = "#FEE";
        ctx.fillRect(mouseRegionX * REGION_SIZE, mouseRegionY * REGION_SIZE, REGION_SIZE, REGION_SIZE);
    }

    let width = REGION_SIZE * regions.length;
    let height = REGION_SIZE * regions[0].length;

    for (let i = 0; i < regions.length; i++) {
        for (let j = 0; j < regions[0].length; j++) {
            if (options.REGION_HIGHLIGHTING)
                ctx.lineWidth = mouseRegionX == i && mouseRegionY == j ? FISH_WIDTH * 1.5 : FISH_WIDTH;
            for (let k = 0; k < regions[i][j].length; k++) {
                let fish = regions[i][j][k];
                let hue = 256; // fallback
                switch (options.COLOR_SCHEME) {
                    case 1:
                        hue = 120 * (1 - Math.max(0, Math.min(1, fish.nearby / maxNearby)));
                        break;
                    case 2:
                        hue = 120 * (1 - Math.pow(Math.max(0, Math.min(1, fish.nearby / maxNearby)), 2));
                        break;
                    case 3:
                        hue = 240 * (Math.max(0, Math.min(1, fish.nearby / maxNearby))) + 120;
                        break;
                    case 4:
                        hue = 180 * (Math.max(0, Math.min(1, fish.nearby / maxNearby))) + 180;
                        break;
                    case 5:
                        hue = fish.rotation * 180 / Math.PI;
                        break;
                    case 6:
                        hue = 120 * (1 - Math.pow(Math.min(1, magnitude(fish.velocity) / avgSpeed / 2), 2));
                        break;
                }
                ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
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
    requestAnimationFrame(frame);
}

var initFish = function() {
    for (let i = 0; i < fishCount; i++) {
        addFish({
            position: [(Math.random() * 0.5 + 0.25) * windowWidth, (Math.random() * 0.5 + 0.25) * windowHeight],
            //[Math.random() * regions.length * REGION_SIZE, Math.random() * regions[0].length * REGION_SIZE],
            velocity: [0, 0], //[(Math.random() - 0.5), (Math.random() - 0.5)],
            rotation: Math.random() * (2 * Math.PI),
            angularv: 0, //(Math.random() - 0.5) * 0.01,
            //color: "#008",
            big: false,
            nearby: 0,
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

    document.addEventListener("touchstart", e => {
        var touches = e.changedTouches;
        for (let touch of touches) {
            currentTouches.push(touch);
        }
    }, false);
    document.addEventListener("touchmove", e => {
        for (let touch of e.changedTouches) {
            for (let i = 0; i < currentTouches.length; i++) {
                if (touch.identifier == currentTouches[i].identifier) {
                    currentTouches[i] = touch;
                    break;
                }
            }
        }
    }, false);
    var touchEndHandler = function(e) {
        for (let touch of e.changedTouches) {
            for (let i = 0; i < currentTouches.length; i++) {
                if (touch.identifier == currentTouches[i].identifier) {
                    currentTouches.splice(i, 1);
                    break;
                }
            }
        }
    }
    document.addEventListener("touchend", touchEndHandler, false);
    document.addEventListener("touchcancel", touchEndHandler, false);

    $("#schemes>li").click(function() {
        options.COLOR_SCHEME = $(this).index();
        $("#schemes>li").removeClass("selected");
        $(this).addClass("selected");
    });

    $("#rhtoggle").click(function() {
        options.REGION_HIGHLIGHTING = !options.REGION_HIGHLIGHTING;
    });

    $("#about").click(function() {
        $(".info").fadeIn();
        $("#infoback, #closeinfo").click(function() {
            $(".info").fadeOut();
        });
    });

    initFish();
    requestAnimationFrame(frame);
});