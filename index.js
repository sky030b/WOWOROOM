function main() {
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


  // sweetalert2 mixin setting
  const successToast = Swal.mixin({
    toast: true,
    icon: 'success',
    iconColor: 'white',
    position: 'top-end',
    customClass: {
      popup: 'colored-toast',
    },
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    }
  })

  const errorToast = Swal.mixin({
    icon: 'error',
    iconColor: 'white',
    title: 'Error!',
    customClass: {
      popup: 'colored-toast',
    },
    showConfirmButton: true,
    confirmButtonText: '確認',
    timer: 3000,
  })


  // axios functions
  const api_path = "sky030b";
  const baseUrl = `https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}`;

  // 產品列表部分
  let productList = [];
  const productWrap = document.querySelector(".productWrap");
  function renderProducts(listData = productList) {
    let str = listData.map((item) => `
      <li class="productCard">
        <h4 class="productType">新品</h4>
        <img src="${item.images}" alt="${item.title}_img">
        <a href="javascript:;" class="addCardBtn">加入購物車</a>
        <div class="h3-bottom"><h3>${item.title}</h3></div>
        <del class="originPrice">NT$${item.origin_price.toLocaleString()}</del>
        <p class="nowPrice">NT$${item.price.toLocaleString()}</p>
      </li>
      `
    ).join("");
    productWrap.innerHTML = str;

    productWrap.querySelectorAll(".addCardBtn").forEach((btn, index) => {
      btn.addEventListener("click", (e) => {
        addCartItem(listData[index].id);
      })
    })
  }

  // 取得產品列表
  function getProductsList() {
    let apiUrl = `${baseUrl}/products`;
    axios.get(apiUrl)
      .then((response) => {
        productList = response.data.products;
        renderOption();
        renderProducts(productList);
      })
      .catch(async (error) => {
        // alert(error.response.data.message);
        // alert("發生了某些錯誤，將重新整理畫面。");
        await errorToast.fire({
          text: "產品列表取得失敗，將重新整理畫面",
        })
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

  // 以關鍵字搜尋商品
  const searchInput = document.querySelector(".searchInput");
  const searchBtn = document.querySelector(".searchBtn");
  searchBtn.addEventListener("click", (e) => {
    successToast.close();
    e.preventDefault();

    let targetList = productList.filter((product) => {
      let title = product.title.toLowerCase();
      let keyword = searchInput.value.trim().toLowerCase();
      return title.match(keyword);
    })

    if (!targetList[0]) {
      targetList = productList;
      successToast.fire({
        icon: "warning",
        text: "無商品符合您的關鍵字，將展示全部產品",
        timer: 3000
      })
    };
    renderProducts(targetList);
    searchInput.value = "";
  })


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
      objData.carts.forEach((item) => {
        str += `
        <tr>
          <td>
            <div class="cardItem-title">
              <img src=${item.product.images} alt="product picture">
              <p>${item.product.title}</p>
            </div>
          </td>
          <td>NT$${item.product.price.toLocaleString()}</td>
          <td class="cartAmount">
          <a href="javascript:;"><span class="material-icons cartAmount-icon minusBtn" data-num="${item.quantity - 1}" data-id="${item.id}">remove</span></a>
          <span>${item.quantity}</span>
          <a href="javascript:;"><span class="material-icons cartAmount-icon addBtn" data-num="${item.quantity + 1}" data-id="${item.id}">add</span></a>
          </td>
          <td>NT$${(item.product.price * item.quantity).toLocaleString()}</td>
          <td class="discardBtn">
            <a href="javascript:;" class="material-icons deleteBtn">clear</a>
          </td>
        </tr>
        `;
      })
    }

    str += `
    <tr>
      <td>
        <a href="javascript:;" class="discardAllBtn ${objData.carts[0] ? "" : "isDisabled"}"
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
      const editQuantityBtns = document.querySelectorAll('.cartAmount-icon');
      editQuantityBtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          modifyQuantityCart(e.target.dataset.id, +e.target.dataset.num);
        });
      });

      const deleteItemBtns = shoppingCartTable.querySelectorAll(".deleteBtn");
      deleteItemBtns.forEach((btn, index) => {
        btn.addEventListener("click", () => deleteCartItem(objData.carts[index].id));
      })

      const discardAllBtn = shoppingCartTable.querySelector(".discardAllBtn");
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
      .catch(async (error) => {
        // alert(error.response.data.message);
        // alert("發生了某些錯誤，將重新整理畫面。");
        await errorToast.fire({
          text: "取得購物車失敗，將重新整理畫面",
        })
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
        successToast.fire({
          title: '新增至購物車成功',
        })
      })
      .catch(async (error) => {
        // alert(error.response.data.message);
        // alert("發生了某些錯誤，將重新整理畫面。");
        await errorToast.fire({
          text: "新增至購物車失敗，將重新整理畫面",
        })
        location.reload();
      })
  }

  // 增減購物車內商品
  function modifyQuantityCart(id, quantity) {
    if (quantity === 0) {
      deleteCartItem(id);
      return;
    }

    const url = `${baseUrl}/carts`;
    const data = {
      "data": {
        "id": id,
        "quantity": quantity
      }
    }

    axios.patch(url, data)
      .then((response) => {
        cartNow = response.data;
        renderCart();
        successToast.fire({
          icon: 'success',
          title: '購物車內商品數量更改成功',
        })
      })
      .catch(async (error) => {
        // alert(error.response.data.message);
        // alert("發生了某些錯誤，將重新整理畫面。");
        await errorToast.fire({
          text: "購物車內商品數量更改失敗，將重新整理畫面",
        })
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
        successToast.fire({
          icon: 'success',
          title: '已刪除購物車內全部商品',
        })
      })
      .catch(async (error) => {
        // alert(error.response.data.message);
        await errorToast.fire({
          text: "刪除購物車內全部商品失敗，將重新整理畫面",
        })
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
        successToast.fire({
          icon: 'success',
          title: '已刪除購物車內指定商品',
        })
      })
      .catch(async (error) => {
        // alert(error.response.data.message);
        await errorToast.fire({
          text: "刪除購物車內指定商品失敗，將重新整理畫面",
        })
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
        successToast.fire({
          icon: 'success',
          title: '訂單已送出',
        })
      })
      .catch(async (error) => {
        // alert(error.response.data.message);
        await successToast.fire({
          icon: 'error',
          title: `${error.response.data.message}`,
          timer: 3000,
        })
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
}

main();