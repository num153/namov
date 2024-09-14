let list = document.querySelector(".slider .list");
    let item = document.querySelectorAll(".slider .list .item");
    let dots = document.querySelectorAll(" .dots li")
    let active = 0;
    function autoSlide() {
        active = (active + 1) % item.length; // k vuot qua 3
        reloadSlider();
    }
    // console.log(item[0].offsetLeft); la bang 0
    let refresh = setInterval(autoSlide, 3000);
    function reloadSlider(){
      //item1 1006
        let checkLeft=item[active].offsetLeft; //khoang cach left cua list den mep left cua item
      //dich chuyen ve trai mot khoang bang checkLeft
        list.style.left = -checkLeft + 'px';
        let lastDot = document.querySelector(" .dots li.on");
        lastDot.classList.remove("on");
        dots[active].classList.add("on");
        clearInterval(refresh); //dat intervel lai tu dau
        refresh = setInterval(autoSlide, 3000);
    }
    dots.forEach((li,key) =>{
        li.addEventListener("click", function(){
            active = key;
            reloadSlider();
        })
    })

    // const swiper = new Swiper('.movie', {

    // });

    var swiper = new Swiper(".feedback-content", {
      slidesPerView: 3,
      spaceBetween: 20,
      freeMode: true,
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      breakpoints:{
        0:{
          slidesPerView: 1,
        },
        768:{
          slidesPerView: 2,
        },
        950:{
          slidesPerView: 3,
        },
      }
    });