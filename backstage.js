console.clear();
let menuOpenBtn = document.querySelector('.menuToggle');
let linkBtn = document.querySelectorAll('.topBar-menu a');
let menu = document.querySelector('.topBar-menu');
menuOpenBtn.addEventListener('click', menuToggle);

linkBtn.forEach((item) => {
  item.addEventListener('click', closeMenu);
})

function menuToggle() {
  if (menu.classList.contains('openMenu')) {
    menu.classList.remove('openMenu');
  } else {
    menu.classList.add('openMenu');
  }
}
function closeMenu() {
  menu.classList.remove('openMenu');
}

// timeformat exchange
function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000);

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 使用padStart補零
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}/${month}/${day}`;
}

// axios functions
const api_path = "sky030b";
const baseUrl = `https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}`;
const api_token = "KHAiXKtsbEZWi2nS89puWozAam52";
const authorizationObj = { headers: { authorization: api_token } };

let orderList = [];
const discardAllBtn = document.querySelector(".discardAllBtn");
const orderTableWrap = document.querySelector(".orderTableWrap");
function renderOrders() {
  if (!orderList[0]) {
    orderTableWrap.innerHTML = `<h3 class="no-order">目前尚無訂單。</h3>`;
    discardAllBtn.classList.add("isDisabled");
    return
  }

  discardAllBtn.classList.remove("isDisabled");

  let str = `
  <table class="orderPage-table">
    <thead>
      <tr>
        <th>訂單編號</th>
        <th>聯絡人</th>
        <th>聯絡地址</th>
        <th>電子郵件</th>
        <th>訂單品項</th>
        <th>訂單日期</th>
        <th>訂單狀態</th>
        <th>操作</th>
      </tr>
    </thead>
  `;

  str += orderList.map((item) => `
  <tr>
    <td>${item.createdAt}</td>
    <td class="width-limit">
      <p>${item.user.name}</p>
      <p>${item.user.tel}</p>
    </td>
    <td class="width-limit">${item.user.address}</td>
    <td class="width-limit">${item.user.email}</td>
    <td>${item.products.map((product) => `<p>${product.title}</p>`).join("")}</td>
    <td>${formatTimestamp(item.createdAt)}</td>
    <td class="orderStatus">
      <a href="javascript:;">${item.paid ? "已付款" : "未付款"}</a>
    </td>
    <td>
      <input
        type="button"
        class="delSingleOrder-Btn"
        value="刪除"
      >
    </td>
  </tr>
  `).join("");

  str += `</table>`;

  orderTableWrap.innerHTML = str;

  discardAllBtn.addEventListener("click", deleteAllOrder);

  const deleteOrderBtns = orderTableWrap.querySelectorAll(".delSingleOrder-Btn");
  deleteOrderBtns.forEach((btn, index) => {
    btn.addEventListener("click", () => deleteOrderItem(orderList[index].id));
  })

  const orderStatusBtns = orderTableWrap.querySelectorAll(".orderStatus a")
  orderStatusBtns.forEach((btn, index) => {
    btn.addEventListener("click", () => editOrderList(orderList[index].id, index));
  })
}

// 取得訂單列表
function getOrderList() {
  const apiUrl = `${baseUrl}/orders`;
  axios.get(apiUrl, authorizationObj)
    .then((response) => {
      orderList = response.data.orders;
      renderOrders();
      renderChart();
    }).catch((error) => {
      // alert(error.response.data.message);
      alert("發生了某些錯誤，將重新整理畫面。");
      location.reload();
    })
}

// 刪除全部訂單
function deleteAllOrder() {
  const apiUrl = `${baseUrl}/orders/`;
  axios.delete(apiUrl, authorizationObj)
    .then((response) => {
      orderList = response.data.orders;
      alert("全部訂單已刪除。")
      renderOrders();
      renderChart();
    }).catch((error) => {
      alert(error.response.data.message);
    })
}

// 刪除特定訂單
function deleteOrderItem(orderId) {
  const apiUrl = `${baseUrl}/orders/${orderId}`;
  axios.delete(apiUrl, authorizationObj)
    .then((response) => {
      orderList = response.data.orders;
      alert("指定訂單已刪除。")
      renderOrders();
      renderChart();
    }).catch((error) => {
      // alert(error.response.data.message);
      alert("發生了某些錯誤，將重新整理畫面。");
      location.reload();
    })
}

// 修改付費狀態
function editOrderList(orderId, index) {
  const apiUrl = `${baseUrl}/orders`;
  let orderObj = {
    "data": {
      "id": orderId,
      "paid": !orderList[index].paid
    }
  };

  axios.put(apiUrl, orderObj, authorizationObj)
    .then(function (response) {
      orderList = response.data.orders;
      alert("指定訂單付款狀態已變更。")
      renderOrders();
      renderChart();
    }).catch((error) => {
      // alert(error.response.data.message);
      alert("發生了某些錯誤，將重新整理畫面。");
      location.reload();
    })
}


// 圖表部分
let chartNow = "category";
const chartDiv = document.querySelector("#chart");
const chartTitle = document.querySelector(".section-title");

const chartSelectBtns = document.querySelectorAll(".chart-select li");

// 取得產品列表
function getProductsList() {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/products`;
    axios.get(apiUrl)
      .then((response) => {
        productList = response.data.products;
        resolve();
      })
      .catch((error) => {
        // alert(error.response.data.message);
        alert("發生了某些錯誤，將重新整理畫面。");
        location.reload();
        reject(error);
      });
  });
}

// 全品項營收比重
function specificProductData(orderList) {
  chartTitle.textContent = `全品項營收比重`;

  let productAry = productList.map((product) => [product.title, 0]);

  orderList.forEach((item) => {
    item.products.forEach((productInOrder) => {
      productAry.forEach((productInAry) => {
        if (productInOrder.title === productInAry[0]) {
          productInAry[1] += productInOrder.quantity * productInOrder.price;
        }
      })
    })
  })

  let outputAry = productAry.sort((a, b) => b[1] - a[1]).slice(0, 3);
  let otherPrice = productAry.sort((a, b) => b[1] - a[1]).slice(3)
    .reduce((accumulator, currentValue) => accumulator + currentValue[1], 0);
  outputAry.push(["其他", otherPrice]);

  return outputAry;
}

// 全產品類別營收比重
function productCategoryData(orderList) {
  chartTitle.textContent = `全產品類別營收比重`;

  let outputAry = [['床架', 0], ['收納', 0], ['窗簾', 0]];

  orderList.forEach((item) => {
    item.products.forEach((product) => {
      outputAry = outputAry.map(([category, price]) => {
        if (product.category === category) {
          price += product.quantity * product.price;
        }
        return [category, price];
      })
    })
  })

  return outputAry;
}

// C3.js
function renderChart() {
  if (!orderList[0]) {
    chartTitle.textContent = "";
    chartDiv.classList.add("display-none");
    chartSelectBtns.forEach((btn) => btn.classList.add("isDisabled"));
    return;
  }

  chartSelectBtns.forEach((btn) => btn.classList.remove("isDisabled"));

  chartSelectBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      chartNow = e.target.classList[0];
      renderChart();
    })
  })

  data = chartNow === "category" ?
    productCategoryData(orderList) :
    specificProductData(orderList);

  let chart = c3.generate({
    bindto: '#chart',
    data: {
      type: "pie",
      columns: data
    },
    color: {
      pattern: ['#DACBFF', '#9D7FEA', '#5434A7', '#301E5F', '#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5']
    }
  });
}

// 網頁初始化
function init() {
  getProductsList()
    .then(() => {
      getOrderList();
    })
}
init();