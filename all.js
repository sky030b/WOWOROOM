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
const api_token = "KHAiXKtsbEZWi2nS89puWozAam52";
const baseUrl = "https://livejs-api.hexschool.io";

let cartNow = {};
const productWrap = document.querySelector(".productWrap");
function renderProducts(listData) {
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
      let inCart = false;
      if (cartNow.carts[0]) {
        cartNow.carts.forEach((item) => {
          if (item.product.id === listData[index].id) {
            inCart = true;
            let count = item.quantity + 1;
            // deleteCartItem(item.id);
            // addCartItem(listData[index].id, count);
            // 順序不一定就是這個意思，而且addCartItem(post)本身就會覆蓋，不需要先delete
            addInCartItemQuantity(item.id, count);
            // 不過addCartItem/addInCartItemQuantity都可以用，建議還是用patch比較好一點點
          }
        })
      }
      if (!inCart) {
        addCartItem(listData[index].id, 1);
      }
    })
  })
}

let listData = [];
// 篩選品項種類
const productSelect = document.querySelector(".productSelect");
productSelect.addEventListener("change", getProductsList);
// 取得產品列表
function getProductsList() {
  axios.get(`${baseUrl}/api/livejs/v1/customer/${api_path}/products`)
    .then(function (response) {
      // console.log(response.data.products);
      listData = response.data.products;
      if (productSelect.value !== "全部") {
        listData = listData.filter((item) => item.category === productSelect.value);
      }
      renderProducts(listData);
    })
    .catch(function (error) {
      console.log(error.response.data);
    })
}

const shoppingCartTable = document.querySelector(".shoppingCart-table")
function renderCart(objData) {
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
  axios.get(`${baseUrl}/api/livejs/v1/customer/${api_path}/carts`)
    .then(function (response) {
      // console.log(response.data);
      cartNow = response.data;
      renderCart(cartNow);
    })
    .catch(function (error) {
      console.log(error.response.data);
    })
}

// 加入購物車
function addCartItem(productId, quantity) {
  axios.post(`${baseUrl}/api/livejs/v1/customer/${api_path}/carts`, {
    "data": {
      "productId": productId,
      "quantity": quantity
    }
  })
    .then(function (response) {
      // console.log(response.data);
      cartNow = response.data;
      renderCart(cartNow);
    })
    .catch(function (error) {
      console.log(error.response.data);
    })
}

// 累加購物車內已有品項數量
function addInCartItemQuantity(recordId, quantity) {
  axios.patch(`${baseUrl}/api/livejs/v1/customer/${api_path}/carts`, {
    "data": {
      "id": recordId,
      "quantity": quantity
    }
  })
    .then(function (response) {
      // console.log(response.data);
      cartNow = response.data;
      renderCart(cartNow);
    })
    .catch(function (error) {
      console.log(error.response.data);
    })
}

// 清除購物車內全部產品
function deleteAllCartList() {
  axios.delete(`${baseUrl}/api/livejs/v1/customer/${api_path}/carts`)
    .then(function (response) {
      // console.log(response.data);
      cartNow = response.data;
      renderCart(cartNow);
    })
    .catch(function (error) {
      console.log(error.response.data);
    })
}

// 刪除購物車內特定產品
function deleteCartItem(itemId) {
  axios.delete(`${baseUrl}/api/livejs/v1/customer/${api_path}/carts/${itemId}`)
    .then(function (response) {
      // console.log(response.data);
      cartNow = response.data;
      renderCart(cartNow);
    })
    .catch(function (error) {
      console.log(error.response.data.message);
    })
}

// 送出購買訂單
function createOrder(userObj) {
  axios.post(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/orders`, userObj)
    .then(function (response) {
      // console.log(response.data);
      getCartList();
    })
    .catch(function (error) {
      console.log(error.response.data);
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
  orderInfoForm.reset();
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
// orderInfoForm.forEach((input, index) => {
//   input.addEventListener("input", (e) => {
//     orderInfoMessages[index].classList.add("display-none");
//     if (!e.target.value) {
//       orderInfoMessages[index].classList.remove("display-none");
//     }
//   })
// })
// orderInfoForm不能使用forEach function，不過還沒確認為什麼

// 初始化頁面
function init() {
  getProductsList();
  getCartList();
}
init();