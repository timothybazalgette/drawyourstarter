(function () {
    var buildResponsiveCanvas = function (parentElement, id, widthRatio, brushFraction) {

        // initialise
        parentElement.innerHTML = '';
        var canvas = document.createElement('canvas');
        canvas.id = id;
        canvas.style.touchAction = 'none';
        document.ontouchmove = function (e) {
            e.preventDefault();
        };
        var ctx = canvas.getContext('2d');

        // clear button
        var clearButton = document.createElement('div');
        clearButton.id = 'clear-button';
        clearButton.className = 'button';
        clearButton.innerHTML = 'clear';

        parentElement.appendChild(clearButton);
        parentElement.appendChild(canvas);

        // resizing - changes pixel size of canvas and resamples image while retaining ratio.
        var resize = function () {
            var img = new Image();
            var currImg = canvas.toDataURL();

            var desiredHeight = parentElement.offsetHeight;
            var desiredWidth = desiredHeight * widthRatio;
            if (canvas.height !== desiredHeight) {
                canvas.height = desiredHeight;
                canvas.width = desiredWidth;
                parentElement.style.width = canvas.width;

                ctx.lineWidth = canvas.width / brushFraction;
                ctx.lineCap = 'round';
                img.onload = function () {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                };
                img.src = currImg;
            }
        };
        resize();
        var resizeId;
        // useful to minimise calls when dragging window, and mitigates some Firefox issues.
        var debounced_resize = function () {
            clearTimeout(resizeId);
            resizeId = setTimeout(resize, 200);
        };
        window.addEventListener('resize', debounced_resize, false);

        // mouse drawing
        var currMousePos = function (e) {
            return {x: e.pageX - canvas.offsetLeft,
                    y: e.pageY - canvas.offsetTop};
        };
        var mouseHeld;
        var mouseDrawStart = function (e) {
            mouseHeld = true;
            var pos = currMousePos(e);
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 0.2, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.moveTo(pos.x, pos.y);
        };
        var mouseDraw = function (e) {
            if (mouseHeld) {
                var pos = currMousePos(e);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            }
        };
        var mouseDrawEnd = function () {
            mouseHeld = false;
        };

        // touch drawing
        var currTouchPos = function (e) {
            return {x: e.changedTouches[0].pageX - canvas.offsetLeft,
                    y: e.changedTouches[0].pageY - canvas.offsetTop};
        };
        var touchDrawStart = function (e) {
            var pos = currTouchPos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        };
        var touchDraw = function (e) {
            var pos = currTouchPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        };

        // public methods
        var enabled;
        canvas.enable = function () {
            enabled = true;
            canvas.addEventListener('mousedown', mouseDrawStart, false);
            canvas.addEventListener('mousemove', mouseDraw, false);
            window.addEventListener('mouseup', mouseDrawEnd, false);
            canvas.addEventListener('touchstart', touchDrawStart, false);
            canvas.addEventListener('touchmove', touchDraw, false);
        };
        canvas.disable = function () {
            enabled = false;
            canvas.removeEventListener('mousedown', mouseDrawStart, false);
            canvas.removeEventListener('mousemove', mouseDraw, false);
            window.removeEventListener('mouseup', mouseDrawEnd, false);
            canvas.removeEventListener('touchstart', touchDrawStart, false);
            canvas.removeEventListener('touchmove', touchDraw, false);
        };
        canvas.clear = function () {
            if (enabled) {
                // white rather than transparent for background
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'black';
            }
        };
        clearButton.addEventListener('click', canvas.clear);

        canvas.enable();
        canvas.clear();

        return canvas;
    };

    window.addEventListener('load', function () {

        var canvasHolder = document.getElementById('canvas-holder');
        var canvas = buildResponsiveCanvas(canvasHolder, 'canvas', 0.8, 80, 2);

        var buttonHolder = document.getElementById('pokebutton-holder');
        var message = document.getElementById('message');
        var clear = document.getElementById('clear-button');
        var restart = document.getElementById('restart-button');
        // to check for empty submissions
        var blankData = canvas.toDataURL();

        var postData = function (name, imgData) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'submit');
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.onload = function () {
                if (xhr.status === 200) {
                    message.innerHTML = 'Thanks for your submission!';
                } else {
                    message.innerHTML = 'Submission failed.';
                }
            };
            xhr.onerror = function () {
                message.innerHTML = 'Submission failed.';
            };
            imgData = imgData.replace('data:image/png;base64,', '');
            xhr.send(`pokemon=${name}&imgData=${imgData}`);
        };

        var submitPokemon = function (e) {
            var imgData = canvas.toDataURL();
            buttonHolder.style.display = 'none';
            message.style.display = 'block';
            if (imgData !== blankData) {
                message.innerHTML = 'Submitting...';
                postData(e.target.id, imgData);
                canvas.disable();
                clear.style.display = 'none';
                setTimeout(function () {
                    message.style.display = 'none';
                    restart.style.display = 'block';
                }, 1000);
            } else {
                message.innerHTML = 'Please draw something before submitting!';
                setTimeout(function () {
                    message.style.display = 'none';
                    buttonHolder.style.display = 'flex';
                }, 1000);
            }
        };

        var resetAll = function () {
            canvas.enable();
            canvas.clear();
            restart.style.display = 'none';
            buttonHolder.style.display = 'flex';
            clear.style.display = 'block';
        };

        document.querySelectorAll('.poke').forEach(function (pokebutton) {
            pokebutton.addEventListener('click', submitPokemon);
        });
        restart.addEventListener('click', resetAll);

        // allows for more touchscreen, backbutton etc. friendly hover than the css pseudoclass.
        var addButtonHover = function (e) {
            e.target.classList.add('button-hover');
        };
        var removeButtonHover = function (e) {
            e.target.classList.remove('button-hover');
        };
        document.querySelectorAll('.button').forEach(function (bttn) {
            bttn.addEventListener('touchstart', addButtonHover, false);
            bttn.addEventListener('mouseenter', addButtonHover);
            bttn.addEventListener('mouseleave', removeButtonHover);
            bttn.addEventListener('touchmove', removeButtonHover, false);
            bttn.addEventListener('click', removeButtonHover);
        });
    });
})();
