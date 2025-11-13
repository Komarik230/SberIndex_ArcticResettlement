document.addEventListener("DOMContentLoaded", () => {
    const left = document.getElementById("comma-left");
    const right = document.getElementById("comma-right");

    // ==== Клик по запятым ====
    left.addEventListener("click", () => {
        window.location.href = "/left"; // страница для левой запятой
    });

    right.addEventListener("click", () => {
        window.location.href = "/scenario_right.html"; // теперь правая открывает карту
    });

    // ==== Наведение на левую запятую (тёплый фон) ====
    left.addEventListener("mouseenter", () => {
        document.body.classList.add("left-hover");
    });

    left.addEventListener("mouseleave", () => {
        document.body.classList.remove("left-hover");
    });

    // ==== Наведение на правую запятую (голубой фон) ====
    right.addEventListener("mouseenter", () => {
        document.body.classList.add("right-hover");
    });

    right.addEventListener("mouseleave", () => {
        document.body.classList.remove("right-hover");
    });
});
