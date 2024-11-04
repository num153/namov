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
// ========== KHU VUC NAV BAR ===================
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");

hamburger.addEventListener("click", mobileMenu);

function mobileMenu() {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
}


// when we click on hamburger icon its close 

const navLink = document.querySelectorAll(".nav-link");
const dropdownLink = document.querySelector(".nav-item > .nav-link");

navLink.forEach(n => {
    n.addEventListener("click", function(event) {
        // Kiểm tra xem có phải click vào dropdown hay không
        if (n === dropdownLink) {
            event.stopPropagation(); // Ngăn việc click vào navLink khác
        } else {
            closeMenu(); // Đóng menu khi click vào các liên kết khác
        }
    });
});

//BACK-TO-TOP
 const toTop=document.getElementById('back-to-top');
 window.addEventListener("scroll", function (){
   if(window.scrollY > 100){
     toTop.classList.add("show");
   }else{
     toTop.classList.remove("show");
   }
 })
//FAQS toggle
const fag = document.querySelectorAll('.faq-one');
for(let f of fag){
  const title = f.querySelector('.tieudeth');
  title.addEventListener("click",function(){
    f.classList.toggle("active");
  });
};

// //back ra thi se ve lai vi tri cuon trang da click
// window.onload = function() {
//   // Lấy vị trí cuộn đã lưu
//   const savedPosition = localStorage.getItem('scrollPosition');
  
//   // Nếu có vị trí cuộn đã lưu, cuộn trang đến đúng vị trí đó
//   if (savedPosition) {
//       window.scrollTo(0, parseInt(savedPosition));
//       // Xóa vị trí sau khi cuộn để tránh cuộn lại lần sau
//       localStorage.removeItem('scrollPosition');
//   }
// };
// const filmLinks = document.querySelectorAll('a[href*="html"]');
// filmLinks.forEach(link => {
//     link.addEventListener('click', function () {
//         // Lưu vị trí cuộn của trang hiện tại vào localStorage
//         localStorage.setItem('scrollPosition', window.scrollY);
//     });
// });

