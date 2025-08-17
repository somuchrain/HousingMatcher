<template>
  <div class="step-content2">
    <div class="commute-section">
      <h2>通勤分析</h2>
      <!-- Add transport mode selection -->
      <div class="transport-mode-selection compact-layout">
        <div class="transport-mode-header">
          <div class="driving-info-tooltip">
            <span class="info-icon" @mouseenter="showTooltip = true" @mouseleave="showTooltip = false">?</span>
            <div v-if="showTooltip" class="tooltip-content">
              目前仅支持公共交通方式
            </div>
          </div>
          <h3>交通方式</h3>
          <div class="radio-group">
            <label class="radio-label disabled">
              <input
                type="radio"
                value="driving"
                v-model="localTransportMode"
                class="radio-input"
                disabled
              />
              <span class="radio-custom"></span>
              <span class="radio-text">驾车</span>
            </label>
            <label class="radio-label">
              <input
                type="radio"
                value="transit"
                v-model="localTransportMode"
                class="radio-input"
              />
              <span class="radio-custom"></span>
              <span class="radio-text">公共交通</span>
            </label>
          </div>
        </div>
        <!-- Replace warning with hover tooltip -->
      </div>
      <div class="commute-info compact-info">
        <p>
          已选择
          {{ addresses.length }} 个地址，至少需要一个公司地址和一个住所地址才能计算通勤时间。
        </p>
      </div>

      <div class="actions">
        <button @click="calculateAndShowPairs" class="calculate-all-btn">
          计算通勤时间
        </button>
      </div>

      <!-- Add notification when addresses change -->
      <div v-if="addressesChanged" class="address-change-notification">
        <p>您选择的地址信息已发生变化，如有需要请重新计算</p>
        <button @click="calculateAndShowPairs" class="recalculate-btn">
          重新计算
        </button>
      </div>

      <!-- Add loading indicator -->
      <div v-if="isLoading" class="loading-indicator">
        <p>正在计算通勤时间，请稍候...</p>
        <div class="spinner"></div>
      </div>

      <div v-else-if="optimalCommute" class="optimal-result">
        <h3>最佳通勤方案</h3>
        <p>总通勤时间最短的方案:</p>
        <ul>
          <li v-for="(pair, index) in optimalCommute.pairs" :key="index">
            {{ pair.from.text }} → {{ pair.to.text }}:
            {{ pair.commuteTime }} 分钟
          </li>
        </ul>
        <p>
          <strong>总通勤时间: {{ formatCommuteTime(optimalCommute.totalTime) }} </strong>
        </p>
      </div>

      <!-- Add section for top 3 optimal commutes -->
      <div v-if="topOptimalCommutes.length > 0" class="best-options-section">
        <h3>最佳方案Top{{topOptimalCommutes.length}}</h3>
        <div class="best-options-container">
          <div
            v-for="(option, index) in topOptimalCommutes"
            :key="index"
            class="best-option-group"
          >
            <h4><span class="optimal-rank">{{ option.rank }}</span>住所: {{ option.housing }}</h4>
            <div class="total-time-display">
              总通勤时间: {{ formatCommuteTime(option.totalTime) }}
            </div>
            <div class="pairs-container">
              <div
                v-for="(item, itemIndex) in option.pairs"
                :key="itemIndex"
                class="address-pair-card"
                @click="showRoutePath(item.lines)"
              >
                <div class="pair-header">
                    <div class="address-names">
                  <span class="address-name" :title="item.from.text">{{
                      truncateAddress(item.from.text)
                    }}</span>
                    <span class="arrow">→</span>
                    <span class="address-name" :title="item.to.text">{{
                      truncateAddress(item.to.text)
                    }}</span>

                  </div>
                </div>
                <div class="pair-content">
                  <div class="commute-mode">
                    <strong>通勤方式:</strong>
                    <span v-if="item.travelMode" class="mode-value">{{ item.travelMode }}</span>
                    <span v-else class="mode-value">-</span>
                  </div>
                  <div class="walking-time">
                    <strong>步行约:</strong>
                    <span v-if="item.walkingdistance !== undefined" class="walking-value">{{ formatDistance(item.walkingdistance) }}</span>
                    <span v-else class="walking-value">-</span>
                  </div>
                  <div class="commute-distance">
                    <strong>总距离:</strong>
                    <span v-if="item.Distance !== undefined" class="distance-value">{{ formatDistance(item.Distance) }}</span>
                    <span v-else class="distance-value">-</span>
                  </div>
                  <div class="commute-time-display">
                    <span class="commute-duration">
                      {{ formatCommuteTime(item.commuteTime) }}
                    </span>
                  </div>
                  <div
                    v-if="item.describeStr"
                    class="route-description"
                    :title="item.describeStr"
                  >
                    {{ truncateDescription(item.describeStr) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Add route overlay -->
  <div v-if="showRouteOverlay" class="route-overlay">
    <div class="route-overlay-header">
      <h4>路线详情</h4>
      <button class="close-btn" @click="hideRoutePath">×</button>
    </div>
    <div class="route-overlay-content">
      <div
        v-for="(step, index) in routeSteps"
        :key="index"
        :class="['route-step', getStepClass(step.type)]"
      >
        <div class="step-icon">
          <span v-if="step.type === 1">🚶</span>
          <span v-else-if="step.type === 2">🚌</span>
          <span v-else-if="step.type === 3">🚇</span>
          <span v-else-if="step.type === 4">🔄</span>
        </div>
        <div class="step-details">
          <div class="step-description">{{ step.description }}</div>
          <div class="step-info" v-if="step.distance || step.time">
            <span v-if="step.distance">距离: {{ formatDistance(step.distance) }}</span>
            <span v-if="step.distance && step.time"> | </span>
            <span v-if="step.time">时间: {{ formatCommuteTime(step.time) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Add notification modal -->
  <div v-if="showNotificationModal" class="notification-modal">
    <div class="notification-modal-content">
      <div class="notification-header">
        <span class="notification-icon">⚠️</span>
        <h3>提示</h3>
      </div>
      <div class="notification-body">
        <p>{{ notificationMessage }}</p>
      </div>
      <div class="notification-footer">
        <button @click="closeNotification" class="confirm-btn">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { toRaw ,ref, watch } from "vue";

const props = defineProps({
  map: {
    type: Object,
    required: true,
  },
  addresses: {
    type: Array,
    required: true,
  },
  transportMode: {
    type: String,
    required: true,
  },
  addressPairs: {
    type: Array,
    required: true,
  },
  optimalCommute: {
    type: [Object, null],
    required: true,
  },
});

let T = window.T;



const emit = defineEmits([
  "update:transportMode",
  "calculate-all",
  "find-optimal",
  "calculateCommute"
]);

const localTransportMode = ref("transit"); // 默认选择公共交通
const showTooltip = ref(false); // Add this ref for tooltip visibility
// Add loading state
const isLoading = ref(false);

const SearchingBusTaskCount = ref(0);

// Add address change tracking
const addressesChanged = ref(false);

// Add state for commute details visibility
const showCommuteDetails = ref(false);

// Add ref for best options by from address
const OptionsByFrom = ref([]);

// Add ref for top 3 optimal commutes
const topOptimalCommutes = ref([]);


// Watch for local transport mode changes and emit update
watch(localTransportMode, (newMode) => {
  emit("update:transportMode", newMode);
});

// Watch for address changes
watch(
  () => props.addresses,
  (newAddresses, oldAddresses) => {
    console.log("oldAddresses")
    console.log(oldAddresses);
    console.log("newAddresses")
    console.log(newAddresses);
    addressesChanged.value = true;

  },
  { deep: true }
);

function searchBus(pair) {

  let startVal = pair.from.lonlat
  let endVal = pair.to.lonlat
  let currnetPair = toRaw(pair);

  let config = {
  policy: 1, //公交导航的策略参数
  onSearchComplete: busSearchResult.bind(null,currnetPair), //检索完成后的回调函数
};
//创建公交搜索对象
let transitRoute = new T.TransitRoute(props.map, config);

  //起点经纬度
  startVal = startVal.split(",");
  endVal = endVal.split(",");
  let startLngLat = new T.LngLat(startVal[0], startVal[1]);
  //终点经纬度
  let endLngLat = new T.LngLat(endVal[0], endVal[1]);

  //设置公交策略 1:较快捷 2:少换乘 3:少步行 4:不坐地铁
  transitRoute.setPolicy("1");
  // transitRoute.onSearchComplete =() =>{
  //       console.log(displayedAddressPairs.value);

  //   };
  //公交搜索
  transitRoute.search(startLngLat, endLngLat);


}

//显示公交搜索结果
function busSearchResult(currnetPair, result) {
    SearchingBusTaskCount.value -= 1
    console.log(SearchingBusTaskCount.value);
  // findPair()
  if (result.resultCode == 0) {
       console.log("busSearchResult" + currnetPair.from.text + "到" + currnetPair.to.text);
  console.log(currnetPair);
  //获取方案个数
  var plan_count = result.getNumPlans();
  let cleanedPlans = [];
  if (plan_count > 0) {
    let plans = result._TransitRoutePlans;
    for (var i = 0; i < plan_count; i++) {
      let plan = plans[i]

    //显示每个方案的详细信息
    let describeStr = ""
    let segmentNum = plan.getNumSegments();
    let walkingdistance = 0;
    let busFlag = false;
    let metrolFlag = false;
    let lines = [];
    for (var m = 0; m < segmentNum; m++) {
        var line = plan.getDetails(m);
        var segmentLine = line.getSegmentLine()[0];
        lines.push(line);
        //经过的公交或地铁的站数
        var stationCount = (segmentLine.segmentStationCount != "") ? "，经过" + segmentLine.segmentStationCount + "站" : "";

        //线路类型1，步行；2，公交；3，地铁；4， 地铁站内换乘
        if (line.getSegmentType() == 1) {
            walkingdistance +=segmentLine.segmentDistance
            describeStr += "步行约" + segmentLine.segmentDistance + "米，到达" + line.getStationEnd().name + "，";
        }
        else if (line.getSegmentType() == 2) {
            busFlag =  true;
            describeStr += "乘坐" + segmentLine.direction + stationCount + "，到达" + line.getStationEnd().name + "，";
        }
        else if (line.getSegmentType() == 3) {
            metrolFlag = true;
            describeStr += "乘坐" + segmentLine.direction + stationCount + "，到达" + line.getStationEnd().name + "，";
        }
        else if (line.getSegmentType() == 4) {

            describeStr += "站内换乘，";
        }
    }
    // 判断出行方式
    let travelMode;

    if (busFlag && metrolFlag) {
      travelMode = '公交+地铁';
    } else if (busFlag) {
      travelMode = '公交';
    } else if (metrolFlag) {
      travelMode = '地铁';
    } else {
      travelMode = '步行或其他'; // 或者没有使用公交/地铁
    }
    cleanedPlans.push({
        LineName: plan.getLineName(),
        commuteTime: plan.getDuration(),
        Distance: Math.round(plan.getDistance()),
        describeStr: describeStr,
        walkingdistance: walkingdistance,
        travelMode: travelMode,
        from:currnetPair.from,
        to:currnetPair.to,
        lines: lines
      })
    }

    // // 从所有计划中选择通勤时间最短的方案
    // let bestPlan = cleanedPlans.reduce((prev, current) => {
    //   return (prev.commuteTime < current.commuteTime) ? prev : current;
    // });
    // displayedAddressPairs.value.push(bestPlan);


    OptionsByFrom.value.push(...cleanedPlans)
    }
    }else{
      console.log("No commutes found.");
      calculateTopOptimalCommutes([])
    }

      if (SearchingBusTaskCount.value === 0) {

      isLoading.value = false;
      console.log('所有公交方案已获取');
      if(OptionsByFrom.value.length > 0){

      // Group OptionsByFrom by to.text and print result
      const groupedByTo = {};
      OptionsByFrom.value.forEach(option => {
        const toText = option.to.text;
        if (!groupedByTo[toText]) {
          groupedByTo[toText] = [];
        }
        groupedByTo[toText].push(option);
      });

      // Create new data structure
      const result = [];
      for (const to in groupedByTo) {
        result.push({
          "to": to,
          "plans": groupedByTo[to]
        });
      }

      console.log("按to.text分组的结果:", result);

      // Group plans by from.text within each to group
      result.forEach(toGroup => {
        const groupedByFrom = {};
        toGroup.plans.forEach(plan => {
          const fromText = plan.from.text;
          if (!groupedByFrom[fromText]) {
            groupedByFrom[fromText] = [];
          }
          groupedByFrom[fromText].push(plan);
        });

        // Replace plans with grouped by from structure
        const fromGroupedPlans = [];
        for (const from in groupedByFrom) {
          fromGroupedPlans.push({
            "from": from,
            "plans": groupedByFrom[from]
          });
        }
        toGroup.plans = fromGroupedPlans;
      });

      console.log("按to.text分组后再按from.text分组的结果:", result);

      // Calculate top 3 optimal commutes
      calculateTopOptimalCommutes(result);
      } else {

        showNotification("没有找到通勤方案");
      }
    }

  }

// Add function to find optimal combination with minimum total commute time
async function calculateAndShowPairs() {
  // Check if we have at least one company and one residence address
  const companyAddresses = props.addresses.filter(addr => addr.isCompany);
  const residenceAddresses = props.addresses.filter(addr => !addr.isCompany);

  if (companyAddresses.length === 0 || residenceAddresses.length === 0) {

    // Create a more visually appealing notification
    const message = companyAddresses.length === 0 && residenceAddresses.length === 0
      ? "请至少添加一个公司地址和一个住所地址"
      : companyAddresses.length === 0
        ? "请至少添加一个公司地址"
        : "请至少添加一个住所地址";

    // Show notification instead of alert
    showNotification(message);
    return;
  }

  isLoading.value = true;
  addressesChanged.value = false;
  OptionsByFrom.value = []; // Reset best options
  showCommuteDetails.value = false; // Reset collapse state
  topOptimalCommutes.value = []; // Reset top optimal commutes

  SearchingBusTaskCount.value = props.addressPairs.length;
  props.addressPairs.forEach((pair) => {
    console.log("calculateAndShowPairs" + pair.from.text + "到" + pair.to.text);
    searchBus(pair);
  });
}

// Add function to format commute time
function formatCommuteTime(minutes) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} 小时`;
    } else {
      return `${hours} 小时 ${remainingMinutes} 分钟`;
    }
  } else {
    return `${minutes} 分钟`;
  }
}

// Add function to truncate long addresses
function truncateAddress(address) {
  if (address.length > 12) {
    return address.substring(0, 12) + "...";
  }
  return address;
}

// Add function to truncate long descriptions
function truncateDescription(description) {
  if (description.length > 50) {
    return description.substring(0, 50) + "...";
  }
  return description;
}

function formatDistance(distance) {
  if (distance >= 1000) {
    const kilometers = distance / 1000;
    // 保留1位小数，并去掉不必要的 .0
    return `${parseFloat(kilometers.toFixed(1))} 公里`;
  } else {
    return `${Math.round(distance)} 米`;
  }
}



// Add function to calculate top 3 optimal commutes
function calculateTopOptimalCommutes(groupedData) {
  // Get all unique "from" addresses (workplaces)
  const fromAddresses = [...new Set(groupedData.flatMap(toGroup =>
    toGroup.plans.map(fromGroup => fromGroup.from)
  ))];

  // Get all unique "to" addresses (housing options)
  const toAddresses = groupedData.map(toGroup => toGroup.to);

  console.log("Workplaces:", fromAddresses);
  console.log("Housing options:", toAddresses);

  // Generate all possible combinations
  const combinations = [];

  // For each housing option, calculate total commute time
  groupedData.forEach(toGroup => {
    const housingOption = toGroup.to;
    const plansByFrom = {};

    // Organize plans by "from" address
    toGroup.plans.forEach(fromGroup => {
      plansByFrom[fromGroup.from] = fromGroup.plans;
    });

    // For each "from" address, find the best plan
    const bestPlans = {};
    let totalCommuteTime = 0;
    let hasAllAddresses = true;

    fromAddresses.forEach(fromAddr => {
      if (plansByFrom[fromAddr]) {
        // Find the plan with minimum commute time
        const bestPlan = plansByFrom[fromAddr].reduce((prev, current) => {
          return (prev.commuteTime < current.commuteTime) ? prev : current;
        });
        bestPlans[fromAddr] = bestPlan;
        totalCommuteTime += bestPlan.commuteTime;
      } else {
        // If we don't have a plan for this from address, this combination is invalid
        hasAllAddresses = false;
      }
    });

    // Only add combination if we have plans for all addresses
    if (hasAllAddresses) {
      combinations.push({
        housing: housingOption,
        totalTime: totalCommuteTime,
        plans: bestPlans
      });
    }
  });

  // Sort combinations by total commute time
  combinations.sort((a, b) => a.totalTime - b.totalTime);

  // Take top 3
  const top3 = combinations.slice(0, 3);

  // Format for display
  topOptimalCommutes.value = top3.map((combo, index) => {
    const pairs = Object.keys(combo.plans).map(fromAddr => ({
      from: combo.plans[fromAddr].from,
      to: combo.plans[fromAddr].to,
      commuteTime: combo.plans[fromAddr].commuteTime,
      travelMode: combo.plans[fromAddr].travelMode,
      lines: combo.plans[fromAddr].lines,
      walkingdistance: combo.plans[fromAddr].walkingdistance,
      Distance: combo.plans[fromAddr].Distance,
      describeStr: combo.plans[fromAddr].describeStr
    }));

    return {
      rank: index + 1,
      housing: combo.housing,
      totalTime: combo.totalTime,
      pairs: pairs
    };
  });

  // Emit the top optimal commutes data to parent component
  emit("calculateCommute", topOptimalCommutes.value);

  console.log("Top 3 optimal commutes:", topOptimalCommutes.value);
}

// Add refs for route overlay
const showRouteOverlay = ref(false);
const routeSteps = ref([]);

// Add function to show route path
function showRoutePath(lines) {
  if (!lines || lines.length === 0) return;

  routeSteps.value = [];

  lines.forEach(line => {
    const segmentType = line.getSegmentType();
    const startStation = line.getStationStart();
    const endStation = line.getStationEnd();
    const segmentLine = line.getSegmentLine()[0];

    let description = '';
    let distance = 0;
    let time = 0;
    let endStationName = "";
    console.log("+++++++++++++++++++++endStation:");
    console.log(endStation);
    if(endStation.name==="") {
      endStationName = "终点"
    }else {
      endStationName = endStation.name;
    }

    switch (segmentType) {
      case 1: // 步行
        description = `步行至${endStationName}`;
        distance = segmentLine.segmentDistance;
        time = segmentLine.segmentTime;
        break;
      case 2: // 公交
        description = `乘坐${segmentLine.direction}，经过${segmentLine.segmentStationCount}站，到达${endStationName}`;
        distance = segmentLine.segmentDistance;
        time = segmentLine.segmentTime;
        break;
      case 3: // 地铁
        description = `乘坐${segmentLine.direction}，经过${segmentLine.segmentStationCount}站，到达${endStationName}`;
        distance = segmentLine.segmentDistance;
        time = segmentLine.segmentTime;
        break;
      case 4: // 地铁站内换乘
        description = `在${startStation.name}站内换乘至${endStationName}`;
        break;
    }

    routeSteps.value.push({
      type: segmentType,
      description: description,
      distance: distance,
      time: time
    });
  });

  showRouteOverlay.value = true;
}

// Add function to hide route path
function hideRoutePath() {
  showRouteOverlay.value = false;
  routeSteps.value = [];
}

// Add function to get step class
function getStepClass(type) {
  switch (type) {
    case 1: return 'walking-step';
    case 2: return 'bus-step';
    case 3: return 'subway-step';
    case 4: return 'transfer-step';
    default: return '';
  }
}

// Add refs for notification modal
const showNotificationModal = ref(false);
const notificationMessage = ref('');

// Add notification function
function showNotification(message) {
  notificationMessage.value = message;
  showNotificationModal.value = true;
}

// Add function to close notification
function closeNotification() {
  showNotificationModal.value = false;
  notificationMessage.value = '';
}

</script>

<style scoped>
/* Step content */
.step-content2 {
  /* display: block; */
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

/* Commute section styles */
.commute-section h2 {
  margin-bottom: 20px;
  color: #343a40;
  font-weight: 700;
  font-size: 22px;
}

.transport-mode-selection.compact-layout {
  background: linear-gradient(to right, #f8f9fa 0%, #ffffff 100%);
  padding: 12px 15px;
  border-radius: 10px;
  margin-bottom: 15px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
}

.transport-mode-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.transport-mode-header h3 {
  margin: 0;
  font-size: 18px;
  color: #495057;
  font-weight: 600;
  white-space: nowrap;
}

.driving-info-tooltip {
  position: relative;
  display: inline-block;
  vertical-align: middle;
  margin-right: 2px;
}

.info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: #007bff;
  color: white;
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
}

.tooltip-content {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  white-space: nowrap;
  z-index: 100;
  margin-top: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.tooltip-content::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: transparent transparent #333 transparent;
}

.transport-mode-header .radio-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #495057;
  position: relative;
  padding-left: 25px;
  margin-bottom: 0;
}

.radio-label.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.radio-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.radio-input:disabled {
  cursor: not-allowed;
}

.radio-custom {
  position: absolute;
  left: 0;
  height: 20px;
  width: 20px;
  background-color: #fff;
  border: 2px solid #ced4da;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.radio-label:hover:not(.disabled) .radio-custom {
  border-color: #007bff;
}

.radio-input:checked ~ .radio-custom {
  background-color: #fff;
  border: 2px solid #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
}

.radio-custom::after {
  top: 3px;
  left: 3px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007bff 0%, #00bcd4 100%);
}

.radio-input:checked ~ .radio-custom::after {
  display: block;
}

.radio-custom::after {
  content: "";
  position: absolute;
  display: none;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007bff 0%, #00bcd4 100%);
}

.commute-info.compact-info {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  padding: 10px 15px;
  border-radius: 10px;
  margin-bottom: 15px;
  box-shadow: 0 3px 10px rgba(33, 150, 243, 0.15);
  font-size: 14px;
  color: #1976d2;
  font-weight: 500;
  position: relative;
  border-left: 3px solid #2196f3;
}

.commute-info.compact-info::before {
  content: "ℹ️";
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
}

.commute-info.compact-info p {
  margin: 0 0 0 20px;
  line-height: 1.4;
}

.address-pairs {
  margin-bottom: 25px;
  margin-top: 15px; /* Reduce the top spacing */
}

.address-pairs .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 10px 15px;
  background: linear-gradient(90deg, #007bff 0%, #00bcd4 100%);
  border-radius: 10px;
  color: white;
  font-weight: 600;
  margin-bottom: 15px;
}

.address-pairs .section-header h3 {
  margin: 0;
  color: white;
}

.address-pairs .toggle-icon {
  font-size: 18px;
  transition: transform 0.3s ease;
}

.address-pairs .section-header:hover .toggle-icon {
  transform: scale(1.2);
}

.pairs-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.address-pair-card {
  border: 1px solid #dee2e6;
  border-radius: 10px;
  background: white;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
}

.address-pair-card:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-3px);
}

.pair-header {
  padding: 12px 15px;
  background: linear-gradient(90deg, #007bff 0%, #00bcd4 100%);
  border-radius: 10px 10px 0 0;
  color: white;
  font-weight: 600;
}

.address-names {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.address-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  position: relative;
}

.address-name:hover {
  overflow: hidden;
}

.address-name:hover::after {
  content: attr(title);
  position: absolute;
  left: 0;
  top: 100%;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: normal;
  word-wrap: break-word;
  max-width: 200px;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.arrow {
  font-weight: bold;
  margin: 0 5px;
}

.pair-content {
  padding: 15px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.commute-mode {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.commute-mode strong {
  color: #495057;
  font-weight: 600;
  font-size: 14px;
}

.mode-value {
  background: linear-gradient(135deg, #007bff 0%, #00bcd4 100%);
  color: white;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.walking-time {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.walking-time strong {
  color: #495057;
  font-weight: 600;
}

.walking-value {
  background-color: #f1f8ff;
  color: #007bff;
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 500;
}

.commute-distance {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.commute-distance strong {
  color: #495057;
  font-weight: 600;
}

.distance-value {
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 500;
}

.commute-time-display {
  margin-top: auto;
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  /* Add height to ensure vertical centering works properly */
  height: 100%;
}

.commute-duration {
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
  /* Add vertical centering and right alignment */
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
}

.calculating {
  font-size: 18px;
  color: #6c757d;
  font-style: italic;
}

.route-description {
  margin-top: 10px;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 12px;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: help;
}

.calculate-btn,
.calculate-all-btn,
.optimal-btn {
  background: linear-gradient(135deg, #007bff 0%, #00bcd4 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 123, 255, 0.2);
}

.calculate-btn:hover,
.calculate-all-btn:hover,
.optimal-btn:hover {
  background: linear-gradient(135deg, #0069d9 0%, #009aae 100%);
  box-shadow: 0 6px 8px rgba(0, 123, 255, 0.3);
  transform: translateY(-2px);
}

.calculate-all-btn,
.optimal-btn {
  margin-right: 12px;
  padding: 10px 20px;
}

.actions {
  margin-bottom: 15px; /* Reduced from 25px to 15px */
  display: flex;
  gap: 12px;
}

.optimal-result {
  background: linear-gradient(135deg, #d4edda 0%, #b8e9c7 100%);
  border: 1px solid #c3e6cb;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.15);
}

.optimal-result h3 {
  margin-top: 0;
  color: #155724;
  font-weight: 700;
  font-size: 18px;
}

.optimal-result p {
  color: #155724;
  font-weight: 500;
  font-size: 15px;
}

.optimal-result ul {
  padding-left: 20px;
  margin: 15px 0;
}

.optimal-result li {
  margin-bottom: 8px;
  color: #155724;
  font-size: 15px;
}

/* Add loading indicator styles */
.loading-indicator {
  text-align: center;
  padding: 25px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 10px;
  margin-bottom: 15px; /* Reduced from 20px to 15px */
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  font-size: 15px;
  color: #495057;
  font-weight: 500;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #007bff;
  width: 35px;
  height: 35px;
  animation: spin 1s linear infinite;
  margin: 15px auto 0;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Add styles for address change notification */
.address-change-notification {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 15px; /* Reduced from 20px to 15px */
  box-shadow: 0 3px 10px rgba(255, 193, 7, 0.2);
  font-size: 15px;
  color: #856404;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.address-change-notification p {
  margin: 0;
}

.recalculate-btn {
  background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
  color: #212529;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(255, 193, 7, 0.3);
}

.recalculate-btn:hover {
  background: linear-gradient(135deg, #e0a800 0%, #f57c00 100%);
  box-shadow: 0 4px 6px rgba(255, 193, 7, 0.4);
  transform: translateY(-1px);
}

/* Add styles for best options section */
.best-options-section {
  margin-top: 25px;
  padding: 20px;
  background: linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%);
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(33, 150, 243, 0.15);
}

.best-options-section h3 {
  margin-top: 0;
  color: #01579b;
  font-weight: 700;
  font-size: 18px;
}

.best-option-group {
  margin-bottom: 20px;
  background: white;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.best-option-group:last-child {
  margin-bottom: 0;
}

.best-option-group h4 {
  color: #0277bd;
  margin-bottom: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.total-time-display {
  background: #e3f2fd;
  color: #1976d2;
  padding: 8px 12px;
  border-radius: 20px;
  font-weight: 600;
  margin-bottom: 15px;
  display: inline-block;
}

.best-options-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.best-option-item {
  background: white;
  border-radius: 8px;
  padding: 10px 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  flex: 1;
  min-width: 200px;
}

.option-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.to-address {
  font-weight: 500;
  color: #333;
  max-width: 60%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.commute-time {
  font-weight: bold;
  color: #007bff;
  background: #e3f2fd;
  padding: 3px 10px;
  border-radius: 20px;
}

/* Add styles for top optimal commutes section */
.top-optimal-section {
  margin-top: 25px;
  padding: 20px;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.15);
}

.top-optimal-section h3 {
  margin-top: 0;
  color: #2e7d32;
  font-weight: 700;
  font-size: 18px;
}

.optimal-rank {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  border-radius: 50%;
  background: #4caf50;
  color: white;
  font-weight: bold;
  margin-right: 10px;
}

.optimal-item {
  background: white;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.optimal-item:last-child {
  margin-bottom: 0;
}

.optimal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.housing-address {
  font-weight: 600;
  color: #333;
}

.total-time {
  font-weight: bold;
  color: #4caf50;
  background: #e8f5e9;
  padding: 4px 12px;
  border-radius: 20px;
}

.optimal-pairs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 10px;
}

.pair-item {
  background: #f5f5f5;
  border-radius: 6px;
  padding: 10px;
}

.pair-route {
  font-weight: 500;
  margin-bottom: 5px;
}

.pair-details {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.pair-time {
  font-weight: bold;
  color: #4caf50;
}

/* Add styles for route overlay */
.route-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 10px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  min-width: 300px;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.route-overlay-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(90deg, #007bff 0%, #00bcd4 100%);
  color: white;
  border-radius: 10px 10px 0 0;
}

.route-overlay-header h4 {
  margin: 0;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.route-overlay-content {
  padding: 15px;
}

.route-step {
  display: flex;
  padding: 12px 10px;
  margin-bottom: 10px;
  border-radius: 8px;
  align-items: flex-start;
}

.route-step:last-child {
  margin-bottom: 0;
}

.walking-step {
  background-color: #e8f5e9;
}

.bus-step {
  background-color: #fff3e0;
}

.subway-step {
  background-color: #e3f2fd;
}

.transfer-step {
  background-color: #f3e5f5;
}

.step-icon {
  font-size: 20px;
  margin-right: 12px;
  min-width: 30px;
  text-align: center;
}

.step-details {
  flex: 1;
}

.step-description {
  font-weight: 500;
  margin-bottom: 5px;
}

.step-info {
  font-size: 13px;
  color: #666;
}

@media (max-width: 768px) {
  .step-content2 {
    padding: 15px 12px;
  }

  .radio-group {
    flex-direction: column;
    gap: 8px;
  }

  .actions {
    flex-direction: column;
  }

  .calculate-all-btn,
  .optimal-btn {
    margin-right: 0;
  }

  .pairs-container {
    grid-template-columns: 1fr;
  }

  .best-options-list {
    flex-direction: column;
  }

  .best-option-item {
    min-width: auto;
  }
}

/* Add styles for address validation notification */
.address-validation-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 15px 20px;
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
  max-width: 350px;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.notification-icon {
  font-size: 20px;
}

.notification-message {
  color: #856404;
  font-weight: 500;
  font-size: 15px;
}

/* Add styles for notification modal */
.notification-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
}

.notification-modal-content {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 420px;
  width: calc(100% - 32px);
  overflow: hidden;
  border: 1px solid #ebeef5;
}

.notification-header {
  padding: 15px 20px;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #ebeef5;
}

.notification-icon {
  font-size: 20px;
}

.notification-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.notification-body {
  padding: 20px;
}

.notification-body p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.notification-footer {
  padding: 15px 20px;
  display: flex;
  justify-content: flex-end;
  background: #fff;
  border-top: 1px solid #ebeef5;
}

.confirm-btn {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
}

.confirm-btn:hover {
  background-color: #337ecc;
}
</style>
