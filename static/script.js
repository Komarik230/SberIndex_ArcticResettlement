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



// ===== ГОРИЗОНТАЛЬНЫЙ КАРТОЧНЫЙ СЛАЙДЕР =====
const track = document.querySelector('.slider-track');
const slides = document.querySelectorAll('.slide');
const btnLeft = document.querySelector('.slider-btn.left');
const btnRight = document.querySelector('.slider-btn.right');

let index = 0;

function updateSlider() {
  track.style.transform = `translateX(${-index * 100}vw)`;

  // левая кнопка — нет на первом слайде
  if (index === 0) {
    btnLeft.classList.add("disabled");
  } else {
    btnLeft.classList.remove("disabled");
  }

  // правая кнопка — нет на последнем слайде
  if (index === slides.length - 1) {
    btnRight.classList.add("disabled");
  } else {
    btnRight.classList.remove("disabled");
  }
}



btnLeft.addEventListener('click', () => {
  index = Math.max(0, index - 1);
  updateSlider();
});

btnRight.addEventListener('click', () => {
  index = Math.min(slides.length - 1, index + 1);
  updateSlider();
});

// свайп на тачпадах и телефонах
let startX = 0;
track.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
});

track.addEventListener('touchend', (e) => {
  let endX = e.changedTouches[0].clientX;
  if (startX - endX > 50) {
    index = Math.min(slides.length - 1, index + 1);
    updateSlider();
  }
  if (endX - startX > 50) {
    index = Math.max(0, index - 1);
    updateSlider();
  }
});


updateSlider();