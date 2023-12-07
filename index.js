console.clear();
document.addEventListener('DOMContentLoaded', function () {
  const ele = document.querySelector('.recommendation-wall');
  ele.style.cursor = 'grab';
  let pos = { top: 0, left: 0, x: 0, y: 0 };
  const mouseDownHandler = function (e) {
    ele.style.cursor = 'grabbing';
    ele.style.userSelect = 'none';

    pos = {
      left: ele.scrollLeft,
      top: ele.scrollTop,
      // Get the current mouse position
      x: e.clientX,
      y: e.clientY,
    };

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  };
  const mouseMoveHandler = function (e) {
    // How far the mouse has been moved
    const dx = e.clientX - pos.x;
    const dy = e.clientY - pos.y;

    // Scroll the element
    ele.scrollTop = pos.top - dy;
    ele.scrollLeft = pos.left - dx;
  };
  const mouseUpHandler = function () {
    ele.style.cursor = 'grab';
    ele.style.removeProperty('user-select');

    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
  };
  // Attach the handler
  ele.addEventListener('mousedown', mouseDownHandler);
});
// menu 切換
let menuOpenBtn = document.querySelector('.menuToggle');
let linkBtn = document.querySelectorAll('.topBar-menu a');
let menu = document.querySelector('.topBar-menu');

menuOpenBtn.addEventListener('click', menuToggle);
function menuToggle() {
  if (menu.classList.contains('openMenu')) {
    menu.classList.remove('openMenu');
  } else {
    menu.classList.add('openMenu');
  }
}

linkBtn.forEach((item) => {
  item.addEventListener('click', closeMenu);
})
function closeMenu() {
  menu.classList.remove('openMenu');
}


// axios functions
const api_path = "justafairy";
const baseUrl = `https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}`;

// 產品列表部分
let productList = [];
const productWrap = document.querySelector(".productWrap");
function renderProducts(listData = productList) {
  let str = "";
  listData.forEach((item) => {
    str += `
    <li class="productCard">
      <h4 class="productType">新品</h4>
      <img
        src="${item.images}"
        alt=""
      >
      <a
        href="javascript:;"
        class="addCardBtn"
      >加入購物車</a>
      <div class="h3-bottom"><h3>${item.title}</h3></div>
      <del class="originPrice">NT$${item.origin_price.toLocaleString()}</del>
      <p class="nowPrice">NT$${item.price.toLocaleString()}</p>
    </li>
    `
  })
  productWrap.innerHTML = str;

  productWrap.querySelectorAll(".addCardBtn").forEach((btn, index) => {
    btn.addEventListener("click", (e) => {
      addCartItem(listData[index].id);
    })
  })
}

// 取得產品列表
function getProductsList() {
  const apiUrl = `${baseUrl}/products`;
  axios.get(apiUrl)
    .then((response) => {
      productList = response.data.products;
      renderOption();
      renderProducts(productList);
    })
    .catch((error) => {
      // alert(error.response.data.message);
      alert("發生了某些錯誤，將重新整理畫面。");
      location.reload();
    })
}

// 篩選品項種類
const productSelect = document.querySelector(".productSelect");
function renderOption() {
  let categories = [...new Set(productList.map((item) => item.category))];
  let optionStr = `<option value="全部" selected>全部</option>`;
  productSelect.innerHTML = optionStr +
    categories.map((item) => `<option value=${item}>${item}</option>`).join("");
}
productSelect.addEventListener("change", (e) => {
  let selectedProduct;
  if (e.target.value === "全部") {
    selectedProduct = productList;
  } else {
    selectedProduct = productList.filter((item) => item.category === e.target.value);
  }
  renderProducts(selectedProduct);
});


// 購物車部分
let cartNow = {};
const shoppingCartTable = document.querySelector(".shoppingCart-table")
function renderCart(objData = cartNow) {
  let str = `
  <tr>
    <th width="40%">品項</th>
    <th width="15%">單價</th>
    <th width="15%">數量</th>
    <th width="15%">金額</th>
    <th width="15%"></th>
  </tr>`;

  if (!objData.carts[0]) {
    str += `
    <tr><td><div>購物車內尚無商品。</div></td></tr>
    `;
  } else {
    objData.carts.forEach((item, index) => {
      str += `
      <tr>
        <td>
          <div class="cardItem-title">
            <img
              src=${item.product.images}
              alt="product picture"
            >
            <p>${item.product.title}</p>
          </div>
        </td>
        <td>NT$${item.product.price.toLocaleString()}</td>
        <td>${item.quantity}</td>
        <td>NT$${(item.product.price * item.quantity).toLocaleString()}</td>
        <td class="discardBtn">
          <a
            href="javascript:;"
            class="material-icons"
          >
            clear
          </a>
        </td>
      </tr>
      `;
    })
  }

  str += `
  <tr>
    <td>
      <a
        href="javascript:;"
        class="discardAllBtn ${objData.carts[0] ? "" : "isDisabled"}"
      >刪除所有品項</a>
    </td>
    <td></td>
    <td></td>
    <td>
      <p>總金額</p>
    </td>
    <td>NT$${objData.finalTotal.toLocaleString()}</td>
  </tr>`;

  shoppingCartTable.innerHTML = str;

  if (objData.carts[0]) {
    const deleteItemBtns = shoppingCartTable.querySelectorAll(".material-icons");
    const discardAllBtn = shoppingCartTable.querySelector(".discardAllBtn");

    deleteItemBtns.forEach((btn, index) => {
      btn.addEventListener("click", () => deleteCartItem(objData.carts[index].id));
    })

    discardAllBtn.addEventListener("click", deleteAllCartList);
  }
}

// 取得購物車列表
function getCartList() {
  const apiUrl = `${baseUrl}/carts`;
  axios.get(apiUrl)
    .then((response) => {
      cartNow = response.data;
      renderCart();
    })
    .catch((error) => {
      // alert(error.response.data.message);
      alert("發生了某些錯誤，將重新整理畫面。");
      location.reload();
    })
}

// 加入購物車
function addCartItem(productId) {
  let count = 1;
  if (cartNow.carts[0]) {
    cartNow.carts.forEach((item) => {
      if (item.product.id === productId) {
        count = item.quantity + 1;
      }
    })
  }

  const apiUrl = `${baseUrl}/carts`;
  const data = {
    "data": {
      "productId": productId,
      "quantity": count
    }
  };

  axios.post(apiUrl, data)
    .then((response) => {
      cartNow = response.data;
      renderCart();
    })
    .catch((error) => {
      // alert(error.response.data.message);
      alert("發生了某些錯誤，將重新整理畫面。");
      location.reload();
    })
}

// 清除購物車內全部產品
function deleteAllCartList() {
  const apiUrl = `${baseUrl}/carts`;
  axios.delete(apiUrl)
    .then((response) => {
      cartNow = response.data;
      renderCart();
    })
    .catch((error) => {
      // alert(error.response.data.message);
      alert("發生了某些錯誤，將重新整理畫面。");
      location.reload();
    })
}

// 刪除購物車內特定產品
function deleteCartItem(itemId) {
  const apiUrl = `${baseUrl}/carts/${itemId}`;
  axios.delete(apiUrl)
    .then((response) => {
      cartNow = response.data;
      renderCart();
    })
    .catch((error) => {
      // alert(error.response.data.message);
      alert("發生了某些錯誤，將重新整理畫面。");
      location.reload();
    })
}


// 訂單部分
// 送出購買訂單
function createOrder(userObj) {
  const apiUrl = `${baseUrl}/orders`;
  axios.post(apiUrl, userObj)
    .then((response) => {
      getCartList();
      orderInfoForm.reset();
      alert("訂單已送出。");
    })
    .catch((error) => {
      alert(error.response.data.message);
    })
}

const orderInfoForm = document.querySelector(".orderInfo-form");
orderInfoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  let userObj = {
    "data": {
      "user": {
        "name": orderInfoForm[0].value,
        "tel": orderInfoForm[1].value,
        "email": orderInfoForm[2].value,
        "address": orderInfoForm[3].value,
        "payment": orderInfoForm[4].value
      }
    }
  }
  createOrder(userObj);
})

const orderInfoMessages = document.querySelectorAll(".orderInfo-message");
for (let i = 0; i < orderInfoForm.length; i++) {
  orderInfoForm[i].addEventListener("input", (e) => {
    orderInfoMessages[i].classList.add("display-none");
    if (!e.target.value) {
      orderInfoMessages[i].classList.remove("display-none");
    }
  })
}


// 初始化頁面
function init() {
  getProductsList();
  getCartList();
}
init();