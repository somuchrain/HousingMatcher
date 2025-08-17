<template>
  <div class="address-manager">
    <!-- 将StepNavigation的内容直接放在这里 -->
    <div class="step-navigation">
      <div
        class="step-item"
        :class="{
          active: activeTab === 'address',
          completed: activeTab === 'commute',
        }"
        @click="activeTab = 'address'"
      >
        <div class="step-icon">📍</div>
        <div class="step-label">地址</div>
        <div class="step-glow"></div>
      </div>
      <div class="step-divider"></div>
      <div
        class="step-item"
        :class="{ active: activeTab === 'commute' }"
        @click="activeTab = 'commute'"
      >
        <div class="step-icon">🚗</div>
        <div class="step-label">通勤</div>
        <div class="step-glow"></div>
      </div>
    </div>

    <div class="tab-content">
      <AddressSelection
        v-show="activeTab === 'address'"
        :tools="tools"
        :addresses="addresses"
        :new-address="newAddress"
        :city-search="citySearch"
        :search-results="searchResults"
        :city-results="cityResults"
        :show-search-results="showSearchResults"
        :show-city-results="showCityResults"
        :hover-address="hoverAddress"
        @update:newAddress="newAddress = $event"
        @update:citySearch="citySearch = $event"
        @search="performSearch"
        @search-city="searchCity"
        @select-address="selectAddress"
        @select-city="selectCity"
        @add-address="addAddress"
        @toggle-fixed="toggleFixedAddress"
        @view-address="viewAddress"
        @delete-address="deleteAddress"
        @handle-click="handleAddressClick"
        @close-popup="closePopup"
        @address-type-changed="handleAddressTypeChange"
      />
      <keep-alive>
        <CommuteAnalysis
          v-if="activeTab === 'commute'"
          :addresses="addresses"
          :transport-mode="transportMode"
          :address-pairs="addressPairs"
          :optimal-commute="optimalCommute"
          :map="map"
          @update:transportMode="transportMode = $event"
      /></keep-alive>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import AddressSelection from "./AddressSelection.vue";
import CommuteAnalysis from "./CommuteAnalysis.vue";

// 定义响应式数据
const newAddress = ref("");
const citySearch = ref(""); // 城市搜索输入框
const addresses = ref([]);
const searchResults = ref([]);
const cityResults = ref([]); // 城市搜索结果
const showSearchResults = ref(false);
const showCityResults = ref(false); // 城市搜索结果显示控制
const hoverAddress = ref(null); // 用于存储选中的地址信息
const activeTab = ref("address"); // Changed from currentStep to activeTab
const transportMode = ref("transit"); // Add transport mode selection

let map;
let zoom = 12;
let T = window.T;
let tools = ref({});

const initGeocode = () => {
  map.centerAndZoom(new T.LngLat(116.40769, 39.89945), zoom);
  GeocodeSearch(map.getCenter());

  let lo = new T.Geolocation();
  const fn = function (e) {
    console.log(this);
    if (this.getStatus() == 0) {
      map.centerAndZoom(e.lnglat, 15);
      console.log("获取定位坐标：" + e.lnglat.lat + "," + e.lnglat.lng);
    } else if (this.getStatus() == 1) {
      map.centerAndZoom(e.lnglat, e.level);
      console.log("获取定位坐标：" + e.lnglat.lat + "," + e.lnglat.lng);
    } else {
      console.log("H5定位失败");
      var lc = new T.LocalCity();
      lc.location(function (e) {
        alert(e.cityName);
      });
    }
    GeocodeSearch(map.getCenter());
    console.log("hhhhhhhhh");
  };
  lo.getCurrentPosition(fn);
};
// 初始化地图
const initMap = () => {
  if (map) {
    // 获取 mapDiv 元素并清空内容
    document.getElementById("mapDiv").innerHTML = "";
  }
  map = new T.Map("mapDiv", {
    projection: "EPSG:4326",
  });

  if (cityResults.value.length > 0) {
    addAllAddresses();
  } else {
    initGeocode();
  }
  var miniMap = new T.Control.OverviewMap({
    isOpen: true,
    size: new T.Point(150, 150),
  });
  map.addControl(miniMap);
  let paintTool = new T.PaintBrushTool(map, {
    keepdrawing: true,
    style: {
      weight: 3,
    },
  });

  var config = { showLabel: true };
  let lineTool = new T.PolylineTool(map, config);
  let rectTool = new T.RectangleTool(map);
  let circleTool = new T.CircleTool(map, {
    color: "blue",
    weight: 3,
    opacity: 0.5,
    fillColor: "#FFFFFF",
    fillOpacity: 0.5,
  });
  circleTool.on("draw", function (e) {
    onDrawCircle(e.currentCenter, e.currentRadius);
  });
  function onDrawCircle(center, radius) {
      document.getElementById('info').value = "圆的半径是 " + parseInt(radius) + " 米";
  }


  //创建标注工具对象
  let polygonTool = new T.PolygonTool(map, {
      showLabel: true,
      color: "blue", weight: 3, opacity: 0.5, fillColor: "#FFFFFF", fillOpacity: 0.5
  });
  tools.value = {
    paintTool,
    lineTool,
    rectTool,
    circleTool,
    polygonTool,
};
}
onMounted(() => {
  initMap();
});

// 监听 currentStep 变化
// watch(currentStep, (newVal, oldVal) => {
//   console.log(`currentStep 从 ${oldVal} 变为 ${newVal}`)

//   // 你可以在这里执行逻辑
//   if (newVal === 1) {
//     initMap();
//   } else if (newVal === 2) {
//     console.log('点击通勤分析')
//   }
// })

function GeocodeSearch(marker) {
  var geocode;
  geocode = new T.Geocoder();

  geocode.getLocation(marker, function (result) {
    searchResult(marker, result);
  });

  // 处理地理编码结果
  function searchResult(marker, result) {
    if (result.getStatus() === 0) {
      // 成功获取地址信息
      console.log("详细地址：", result.getAddress());

      var addressComponent = result.getAddressComponent();
      // console.log("详细信息如下：");
      // console.log("此点最近地点信息：", addressComponent.address);
      // console.log("此点距离最近地点信息距离：", addressComponent.address_distance, "米");
      // console.log("此点在最近地点信息方向：", addressComponent.address_position);
      // console.log("此点所在国家或城市或区县：", addressComponent.city);
      // console.log("距离此点最近poi点：", addressComponent.poi);
      // console.log("距离此点最近poi点的距离：", addressComponent.poi_distance, "米");
      // console.log("此点在最近poi点的方向：", addressComponent.poi_position);
      // console.log("距离此点最近的路：", addressComponent.road);
      // console.log("此点距离此路的距离：", addressComponent.road_distance, "米");
      console.log("城市：", addressComponent.addressComponent.city);
      console.log("省份：", addressComponent.addressComponent.province);
      console.log("国家：", addressComponent.addressComponent.nation);
      let city_name =
        addressComponent.addressComponent.city?.trim() ||
        addressComponent.addressComponent.province?.trim() ||
        addressComponent.addressComponent.nation?.trim();
      let lnglat = marker.getLng() + "," + marker.getLat();
      let city = { name: city_name, address: city_name, lonlat: lnglat, id: 0 };
      selectCity(city);
    } else {
      // 请求失败
      console.log("服务器返回状态：", result.getStatus());
      console.log("服务器返回响应信息：", result.getMsg());
    }
  }
}

// 模拟地址搜索
const searchAddress = () => {
  let trimAddress = newAddress.value.trim();
  if (trimAddress.length > 1) {
    // 模拟API调用延迟

    var config = {
      pageCapacity: 20, //每页显示的数量
      onSearchComplete: localSearchResult, //接收数据的回调函数
    };
    const localsearch = new T.LocalSearch(map, config);
    localsearch.search(trimAddress);
  } else {
    searchResults.value = [];
    showSearchResults.value = false;
  }
};

// 城市搜索功能
const searchCity = () => {
  let trimCity = citySearch.value.trim();
  if (trimCity.length > 1) {
    var config = {
      pageCapacity: 10,
      onSearchComplete: citySearchResult,
    };
    const localsearch = new T.LocalSearch(map, config);
    localsearch.search(trimCity);
  } else {
    cityResults.value = [];
    showCityResults.value = false;
  }
};

// 城市搜索结果处理
const citySearchResult = (result) => {
  if (parseInt(result.getResultType()) === 3) {
    // 过滤出城市相关的结果
    const searchCites = [result.getArea()];
    cityResults.value = searchCites.map((item) => ({
      name: item.name,
      address: item.name,
      lonlat: item.lonlat,
      id: item.adminCode,
    }));

    showCityResults.value = true;
  } else {
    cityResults.value = [];
    showCityResults.value = false;
  }
};

const localSearchResult = (result) => {
  // clearAll();
  if (parseInt(result.getResultType()) === 1) {
    searchResults.value = pois(result.getPois());
    showSearchResults.value = true;
  } else {
    searchResults.value = [];
    showSearchResults.value = false;
    alert("搜索失败，请调整搜索文本!");
  }
};

// //解析点数据结果
function pois(obj) {
  // 使用 map 方法提取指定字段
  return obj.map((item) => ({
    address: item.address,
    lonlat: item.lonlat,
    name: item.name,
    id: item.hotPointID,
    text: item.name,
  }));
}

const performSearch = () => {
  searchAddress();
};

// 选择地址
const selectAddress = (result) => {
  newAddress.value = result;
  searchResults.value = [];
  showSearchResults.value = false;
  // Add address directly when selected
  addAddress();
};

// 选择城市
const selectCity = (city) => {
  citySearch.value = city.name; // 直接显示在城市搜索框中
  cityResults.value = [];
  showCityResults.value = false;

  // 设置地图中心到选中的城市
  var lng = city.lonlat.split(",")[0];
  var lat = city.lonlat.split(",")[1];
  map.centerAndZoom(new T.LngLat(lng, lat), 12);
};
const addMarker = (address) => {
  //创建标注对象
  var lng = address.lonlat.split(",")[0];
  var lat = address.lonlat.split(",")[1];

  let iconUrl = "";
  if (address.isCompany) {
    iconUrl = "/icons/company.ico";
  } else {
    iconUrl = "/icons/house.ico";
  }
  //创建图片对象
  var icon = new T.Icon({
    iconUrl: iconUrl,
    // iconSize: new T.Point(19, 27),
    // iconAnchor: new T.Point(10, 25)
  });

  var marker = new T.Marker(new T.LngLat(lng, lat), { icon: icon });

  var markerInfoWin = new T.InfoWindow(address.text);
  marker.addEventListener("mouseover", function () {
    marker.openInfoWindow(markerInfoWin);
  }); // 将标注添加到地图中
  marker.addEventListener("mouseout", function () {
    marker.closeInfoWindow(markerInfoWin);
  }); // 删除标注

  //向地图上添加标注
  address.marker = marker;
  map.addOverLay(marker);
  map.centerAndZoom(new T.LngLat(lng, lat), zoom);
  return address;
};
const addAllAddresses = () => {
  map.clearOverLays();
  // 添加所有地址
  addresses.value.forEach((address) => {
    addMarker(address);
  });
};

// 添加地址
const addAddress = () => {
  if (newAddress.value) {
    // 检查是否已存在相同的 id
    const exists = addresses.value.some(
      (addr) => addr.id === newAddress.value.id
    );

    if (exists) {
      // 如果 id 已存在，弹窗提示用户
      alert("该地址已存在!");
    } else {
      let address = {
        id: newAddress.value.id,
        text: newAddress.value.text,
        name: newAddress.value.name,
        lonlat: newAddress.value.lonlat,
        tag: "",
        isCompany: false, // 添加公司属性
        address: newAddress.value.address, // 添加地址详情
      };
      let addedAddress = addMarker(address);
      // map.centerAndZoom(new T.LngLat(lng, lat), zoom);

      addresses.value.push(addedAddress);
      GeocodeSearch(addedAddress.marker.or);
    }
  }
  newAddress.value = "";
  searchResults.value = [];
  showSearchResults.value = false;
};

const toggleFixedAddress = (addressId) => {
  const address = addresses.value.find((a) => a.id === addressId);
  if (address) {
    address.isCompany = !address.isCompany;
    map.removeOverLay(address.marker);
    addMarker(address);
    console.log("toggleFixedAddress");
  }
};

const viewAddress = (address) => {
  hoverAddress.value = address;
};

// 删除地址
const deleteAddress = (id) => {
  var delteAddr = addresses.value.filter((address) => address.id == id);
  if (delteAddr) {
    map.removeOverLay(delteAddr[0].marker);
    addresses.value = addresses.value.filter((address) => address.id !== id);
  }
};

// 新增：处理地址点击事件
const handleAddressClick = (address) => {
  var lng = address.lonlat.split(",")[0];
  var lat = address.lonlat.split(",")[1];
  map.centerAndZoom(new T.LngLat(lng, lat), zoom);
  var marker = new T.Marker(new T.LngLat(lng, lat));
  GeocodeSearch(marker.or);
};

// 新增：关闭弹窗
const closePopup = () => {
  hoverAddress.value = null;
};

// 点击其他地方关闭搜索结果
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-container")) {
    showSearchResults.value = false;
    showCityResults.value = false;
  }
});

// 计算地址对用于通勤时间计算
const addressPairs = computed(() => {
  const pairs = [];
  const addrList = addresses.value;

  // Find company and residence addresses
  const companyAddresses = addrList.filter((addr) => addr.isCompany);
  const residenceAddresses = addrList.filter((addr) => !addr.isCompany);

  // Generate pairs between companies and residences only
  companyAddresses.forEach((company) => {
    residenceAddresses.forEach((residence) => {
      pairs.push({
        from: company,
        to: residence,
        commuteTime: null,
      });
    });
  });

  return pairs;
});

// 查找最佳通勤方案
// const optimalCommute = ref(null);
// const findOptimalCommute = () => {
//   // 确保所有通勤时间都已计算
//   const allCalculated = addressPairs.value.every(pair => pair.commuteTime !== null);

//   if (!allCalculated) {
//     alert("请先计算所有通勤时间");
//     return;
//   }

//   // 简单实现：找到总时间最短的方案（这里只是示例）
//   const totalTime = addressPairs.value.reduce((sum, pair) => sum + (pair.commuteTime || 0), 0);

//   optimalCommute.value = {
//     pairs: [...addressPairs.value],
//     totalTime: totalTime
//   };
// };
</script>

<style scoped>
.address-manager {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

/* 添加StepNavigation的样式 */
.step-navigation {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  padding: 0;
  overflow: hidden;
  position: relative;
}

.step-item {
  display: flex;
  align-items: center;
  padding: 20px 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  flex: 1;
  z-index: 1;
  text-align: center;
  justify-content: center;
  gap: 10px;
}

.step-item:hover:not(.active) {
  background-color: #f8faff;
  transform: translateY(-3px);
}

.step-item.active {
  background: linear-gradient(90deg, #409eff 0%, #52a7ff 100%);
  color: white;
  font-weight: bold;
  box-shadow: 0 5px 15px rgba(64, 158, 255, 0.4);
  transform: translateY(-5px);
}

.step-item.completed {
  background-color: #e8f4ff;
  color: #409eff;
}

.step-label {
  font-weight: 600;
  font-size: 18px;
  position: relative;
  z-index: 2;
}

.step-icon {
  font-size: 20px;
  z-index: 2;
}

.step-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.3s ease;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.4) 0%,
    transparent 70%
  );
}

.step-item.active .step-glow {
  opacity: 1;
}

.step-divider {
  width: 2px;
  height: 40px;
  background: linear-gradient(to bottom, transparent, #ddd, transparent);
  align-self: center;
  margin: 0 10px;
}

.tab-content {
  min-height: 500px; /* Ensure consistent height */
}

#mapDiv {
  width: 100%;
  height: 400px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.map-container {
  height: 400px;
  background-color: #e9ecef;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

@media (max-width: 768px) {
  .address-manager {
    padding: 15px;
  }

  .step-navigation {
    flex-direction: column;
  }

  .step-item {
    padding: 15px 20px;
  }

  .step-divider {
    width: 40%;
    height: 2px;
    background: linear-gradient(to right, transparent, #ddd, transparent);
  }
}
</style>
