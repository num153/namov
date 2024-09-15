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