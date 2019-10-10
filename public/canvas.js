(function() {
    const signCanvas = document.querySelector(".draw");
    const canvas = document.getElementById("canvas");
    const context = signCanvas.getContext("2d");
    const signature = document.getElementById("signature");

    context.lineCap = "round";

    let x = 0,
        y = 0;
    let isMouseDown = false;

    const stopDrawing = () => {
        isMouseDown = false;
    };
    const startDrawing = event => {
        isMouseDown = true;
        [x, y] = [event.offsetX, event.offsetY];
    };
    const drawLine = event => {
        if (isMouseDown) {
            const newX = event.offsetX;
            const newY = event.offsetY;
            context.beginPath();
            context.moveTo(x, y);
            context.lineTo(newX, newY);
            context.stroke();
            [x, y] = [newX, newY];
        }
    };

    signCanvas.addEventListener("mousedown", startDrawing);
    signCanvas.addEventListener("mousemove", drawLine);
    signCanvas.addEventListener("mouseup", () => {
        //// CREATING VAR TO STORE THE SIGNATURE
        var dataURL = canvas.toDataURL();
        signature.value = dataURL;
        // console.log("Signing the canvas:", signature.value);
        stopDrawing();
    });
    signCanvas.addEventListener("mouseout", stopDrawing);
})();
