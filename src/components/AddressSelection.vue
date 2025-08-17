<template>
  <div class="step-content">
    <div class="input-section">
      <div class="search-container">
        <div class="input-with-button">
          <!-- Move city search input to the left of address input -->
          <input
            v-model="localCitySearch"
            placeholder="请输入城市名称"
            class="city-input"
            @keyup.enter="$emit('search-city')"
          />
          <input
            v-model="localNewAddress"
            placeholder="请输入地址"
            class="address-input"
            @keyup.enter="$emit('search')"
          />
          <button @click="$emit('search')" class="search-btn">搜索</button>
        </div>

        <!-- City search results dropdown -->
        <div
          v-if="cityResults.length > 0 && showCityResults"
          class="search-results"
        >
          <div
            v-for="city in cityResults"
            :key="city.id"
            class="search-result-item"
            @click="$emit('select-city', city)"
          >
            {{ city.name }}
          </div>
        </div>

        <!-- Address search results dropdown -->
        <div
          v-if="searchResults.length > 0 && showSearchResults"
          class="search-results"
        >
          <div
            v-for="result in searchResults"
            :key="result.id"
            class="search-result-item"
            @click="$emit('select-address', result)"
          >
            {{ result.text }} - {{ result.address }}
          </div>
        </div>
      </div>
    </div>

    <div class="addresses-section">
      <h2>已选择的地址</h2>
      <ul class="address-list">
        <li
          v-for="address in addresses"
          :key="address.id"
          class="address-item"
          @click="$emit('handle-click', address)"
        >
          <div class="address-info">
            <div class="address-text">{{ address.text }}</div>
          </div>

          <div class="fixed-address-toggle">
            <div class="switch-container">
              <label class="switch">
                <input
                  type="checkbox"
                  :checked="address.isCompany"
                  @change="$emit('toggle-fixed', address.id)"
                  @click.stop
                  class="switch-checkbox"
                />
                <span class="slider">
                  <span class="slider-text" :class="{ 'company': address.isCompany }">
                    {{ address.isCompany ?  '司':'住' }}
                  </span>
                </span>
              </label>
              <div class="help-icon" title="标记为公司，用于通勤计算">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
                </svg>
              </div>
            </div>
          </div>
          <button @click.stop="$emit('view-address', address)" class="view-btn">
            查看
          </button>
          &nbsp;&nbsp;
          <button @click.stop="$emit('delete-address', address.id)" class="delete-btn">
            删除
          </button>
        </li>
      </ul>
    </div>

    <div class="map-section">
      <!-- 修改地图工具为按钮 -->
      <div class="map-tools">
        <button class="tool-button" @click="PaintTool">
          <svg class="tool-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          画笔
        </button>
        <button class="tool-button" @click="MeasureTool">
          <svg class="tool-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M21.71 11.29l-9-9a1 1 0 00-1.42 0l-9 9a1 1 0 000 1.42l9 9a1 1 0 001.42 0l9-9a1 1 0 00-.01-1.42zM14 14.5l-5-5 5-5 5 5-5 5z"/>
          </svg>
          测距
        </button>
        <button class="tool-button" @click="rectTool">
          <svg class="tool-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 0v12h12V6H6z"/>
          </svg>
          画矩形
        </button>
        <!-- 新增圆形工具 -->
        <button class="tool-button" @click="circleTool">
          <svg class="tool-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
          </svg>
          画圆形
        </button>
        <!-- 新增面积测量工具 -->
        <button class="tool-button" @click="polygonTool">
          <svg class="tool-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          测面积
        </button>
        <!-- 新增清除所有工具按钮 -->
        <div class="tool-button-container"
             @mouseenter="showClearOptions = true"
             @mouseleave="scheduleHideClearOptions">
          <button class="tool-button clear-all-button" @click="closeAllToolsAndClear">
            <svg class="tool-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            清除关闭
          </button>

          <!-- Individual tool clear options -->
          <div v-if="showClearOptions" class="clear-options" @mouseenter="cancelHideClearOptions">
            <div class="clear-options-column">
              <button class="clear-option" @click="clearTool('paintTool')">
                <svg class="tool-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                清除画笔
              </button>
              <button class="clear-option" @click="clearTool('lineTool')">
                <svg class="tool-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M21.71 11.29l-9-9a1 1 0 00-1.42 0l-9 9a1 1 0 000 1.42l9 9a1 1 0 001.42 0l9-9a1 1 0 00-.01-1.42zM14 14.5l-5-5 5-5 5 5-5 5z"/>
                </svg>
                清除测距
              </button>
              <button class="clear-option" @click="clearTool('rectTool')">
                <svg class="tool-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 0v12h12V6H6z"/>
                </svg>
                清除矩形
              </button>
              <button class="clear-option" @click="clearTool('circleTool')">
                <svg class="tool-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                </svg>
                清除圆形
              </button>
              <button class="clear-option" @click="clearTool('polygonTool')">
                <svg class="tool-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                清除面积
              </button>
            </div>
            <div class="clear-options-column">
              <button class="clear-option" @click="closeTool('paintTool')">
                <svg class="tool-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                关闭画笔
              </button>
              <button class="clear-option" @click="closeTool('lineTool')">
                <svg class="tool-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M21.71 11.29l-9-9a1 1 0 00-1.42 0l-9 9a1 1 0 000 1.42l9 9a1 1 0 001.42 0l9-9a1 1 0 00-.01-1.42zM14 14.5l-5-5 5-5 5 5-5 5z"/>
                </svg>
                关闭测距
              </button>
              <button class="clear-option" @click="closeTool('rectTool')">
                <svg class="tool-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 0v12h12V6H6z"/>
                </svg>
                关闭矩形
              </button>
              <button class="clear-option" @click="closeTool('circleTool')">
                <svg class="tool-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                </svg>
                关闭圆形
              </button>
              <button class="clear-option" @click="closeTool('polygonTool')">
                <svg class="tool-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                关闭面积
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="map-container">
        <div ref="mapDiv" id="mapDiv">
          <!-- 天地图集成 -->
        </div>
      </div>
    </div>

    <!-- 新增：地址信息弹窗 -->
    <div v-if="hoverAddress" class="popup-overlay" @click="$emit('close-popup')">
      <div class="popup-content" @click.stop>
        <div class="popup-header">
          <h3 class="popup-title">地址详情</h3>
          <button class="close-btn" @click="$emit('close-popup')">&times;</button>
        </div>
        <div class="popup-body">
          <p><strong>名称:</strong> {{ hoverAddress.text }}</p>
          <p><strong>地址:</strong> {{ hoverAddress.address }}</p>
          <p>
            <strong>标记为公司:</strong> {{ hoverAddress.isCompany ? "是" : "否" }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  tools: {
    type: Object,
    required: true,
  },
  addresses: {
    type: Array,
    required: true
  },
  newAddress: {
    type: [String, Object],
    required: true
  },
  citySearch: {
    type: String,
    required: true
  },
  searchResults: {
    type: Array,
    required: true
  },
  cityResults: {
    type: Array,
    required: true
  },
  showSearchResults: {
    type: Boolean,
    required: true
  },
  showCityResults: {
    type: Boolean,
    required: true
  },
  hoverAddress: {
    type: [Object, null],
    required: true
  }
});

const emit = defineEmits([
  'update:newAddress',
  'update:citySearch',
  'search',
  'search-city',
  'select-address',
  'select-city',
  'add-address',
  'toggle-fixed',
  'view-address',
  'delete-address',
  'handle-click',
  'close-popup'
]);

const localNewAddress = ref(props.newAddress);
const localCitySearch = ref(props.citySearch);

watch(() => props.newAddress, (newVal) => {
  localNewAddress.value = newVal;
});

watch(() => props.citySearch, (newVal) => {
  localCitySearch.value = newVal;
});

watch(localNewAddress, (newVal) => {
  emit('update:newAddress', newVal);
});

watch(localCitySearch, (newVal) => {
  emit('update:citySearch', newVal);
});


// 地图工具控制函数
const PaintTool = () => {
  console.log('绘制工具已激活');
  props.tools.paintTool.open();
};

const MeasureTool = () => {
  console.log('测量工具已激活');
  props.tools.lineTool.open();
};

const rectTool = () => {
  console.log('矩形工具已激活');
  props.tools.rectTool.open();
};

const circleTool = () => {
  console.log('圆形工具已激活');
  props.tools.circleTool.open();
};

const polygonTool = () => {
  console.log('面积工具已激活');
  props.tools.polygonTool.open();
};

const showClearOptions = ref(false);
let hideTimeout = null;

const closeAllTools = () => {
  console.log('关闭所有工具');
  props.tools.paintTool.close();
  props.tools.lineTool.close();
  props.tools.rectTool.close();
  props.tools.circleTool.close();
  props.tools.polygonTool.close();
}

// 新增：清除所有工具函数
const clearAllTools = () => {
  console.log('清除所有工具');

  const toolNames = ['paintTool', 'lineTool', 'rectTool', 'circleTool', 'polygonTool'];
  const tools = props.tools;

  toolNames.forEach(toolName => {
    const tool = tools?.[toolName];
    if (tool && typeof tool.clear === 'function') {
      try {
        tool.clear();
      } catch (error) {
        console.warn(`调用 ${toolName}.clear() 时发生错误:`, error);
      }
    } else {
      // 可选：调试时启用
      // console.debug(`${toolName} 不存在或 clear 方法不可用`);
    }
  });
};

const closeAllToolsAndClear = () => {
  closeAllTools();
  clearAllTools();
  showClearOptions.value = false; // Hide the clear options dropdown
}

// 新增：清除单个工具函数
const clearTool = (toolName) => {
  console.log(`清除 ${toolName} 工具`);
  props.tools[toolName].clear();
  showClearOptions.value = false;
};

const closeTool = (toolName) => {
  console.log(`关闭 ${toolName} 工具`);
  props.tools[toolName].close();
  showClearOptions.value = false;
};

// 新增：控制清除选项显示
const scheduleHideClearOptions = () => {
  hideTimeout = setTimeout(() => {
    showClearOptions.value = false;
  }, 100);
};

const cancelHideClearOptions = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
};
</script>

<style scoped>
/* Step content */
.step-content {
  display: block;
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.input-section {
  display: flex;
  flex-direction: column;
  margin-bottom: 30px;
  position: relative;
}

.search-container {
  position: relative;
}

.input-with-button {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

/* 调整城市输入框和地址输入框的宽度 */
.city-input {
  flex: 0 0 180px;
  padding: 12px 15px;
  border: 2px solid #e1e5eb;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.city-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
  outline: none;
}

.address-input {
  flex: 1;
  padding: 12px 15px;
  border: 2px solid #e1e5eb;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
  min-width: 0;
}

.address-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
  outline: none;
}

.search-btn {
  padding: 12px 20px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(32, 201, 151, 0.2);
}

.search-btn:hover {
  background: linear-gradient(135deg, #218838 0%, #1baa80 100%);
  box-shadow: 0 6px 8px rgba(32, 201, 151, 0.3);
  transform: translateY(-2px);
}

.search-results {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 999;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.search-result-item {
  padding: 12px 15px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  transition: all 0.2s ease;
}

.search-result-item:hover {
  background-color: #f8f9fa;
  color: #007bff;
}

.search-result-item:last-child {
  border-bottom: none;
}

.addresses-section h2,
.map-section h2 {
  margin-bottom: 15px;
  color: #343a40;
  font-weight: 600;
}

.address-list {
  list-style: none;
  padding: 0;
  margin-bottom: 30px;
}

.address-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(to right, #ffffff 0%, #f8f9fa 100%);
  border: 1px solid #dee2e6;
  border-radius: 10px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.address-item:hover {
  background: linear-gradient(to right, #f8f9fa 0%, #e9ecef 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.address-info {
  flex: 1;
}

.address-text {
  font-weight: 600;
  color: #333;
  font-size: 16px;
  margin-bottom: 4px;
}

.address-tag {
  font-size: 14px;
  color: #6c757d;
  margin-top: 4px;
}

.fixed-address-toggle {
  margin-right: 15px;
}

.switch-container {
  display: flex;
  align-items: center;
}

.switch-label {
  font-size: 14px;
  margin: 0 4px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 56px;
  height: 30px;
}

.switch-checkbox {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ced4da;
  transition: 0.4s;
  border-radius: 30px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slider:before {
  position: absolute;
  content: "";
  height: 24px;
  width: 24px;
  left: 3px;
  bottom: 3px;
  background: linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%);
  transition: 0.4s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.switch-checkbox:checked + .slider {
  background: linear-gradient(to right, #007bff, #00bcd4);
}

.switch-checkbox:checked + .slider:before {
  transform: translateX(26px);
}

.slider-text {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: bold;
  color: white;
  z-index: 1;
  right: 9px;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
}

.switch-checkbox:checked + .slider .slider-text {
  left: 9px;
  right: auto;
}

.company {
  color: white;
}

.delete-btn {
  background: linear-gradient(135deg, #dc3545 0%, #e4606d 100%);
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 3px 6px rgba(220, 53, 69, 0.2);
}

.delete-btn:hover {
  background: linear-gradient(135deg, #c82333 0%, #d9534f 100%);
  transform: translateY(-2px);
  box-shadow: 0 5px 8px rgba(220, 53, 69, 0.3);
}

.view-btn {
  background: linear-gradient(135deg, #007bff 0%, #00bcd4 100%);
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 3px 6px rgba(0, 123, 255, 0.2);
}

.view-btn:hover {
  background: linear-gradient(135deg, #0069d9 0%, #009aae 100%);
  transform: translateY(-2px);
  box-shadow: 0 5px 8px rgba(0, 123, 255, 0.3);
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


  /* 修改地图工具为按钮 */
  .map-tools {
    display: flex;
    gap: 12px;
    padding: 15px 0;
    background-color: #f8f9fa;
    border-radius: 10px;
    margin-bottom: 15px;
    padding-left: 10px;
    flex-wrap: wrap;
  }

  .tool-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    background: linear-gradient(135deg, #007bff 0%, #00bcd4 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 3px 6px rgba(0, 123, 255, 0.2);
  }

  .tool-button:hover {
    background: linear-gradient(135deg, #0069d9 0%, #009aae 100%);
    transform: translateY(-2px);
    box-shadow: 0 5px 8px rgba(0, 123, 255, 0.3);
  }

  .tool-button.clear-all-button {
    background: linear-gradient(135deg, #dc3545 0%, #e4606d 100%);
  }

  .tool-button.clear-all-button:hover {
    background: linear-gradient(135deg, #c82333 0%, #d9534f 100%);
  }

  .tool-icon {
    width: 18px;
    height: 18px;
    fill: currentColor;
  }

  .tool-button-container {
    position: relative;
    display: inline-block;
  }

  .clear-options {
    position: absolute;
    right: 0;
    top: 100%;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 8px;
    z-index: 10;
    display: flex;
    gap: 6px;
    min-width: 240px;
    margin-top: 5px;
    z-index: 999;
  }

  .clear-options-column {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 110px;
  }

  .clear-option {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: #f8f9fa;
    color: #333;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
    text-align: left;
  }

  .clear-option:hover {
    background: #e9ecef;
  }

  .clear-option .tool-icon {
    width: 16px;
    height: 16px;
  }

/* 新增：弹窗样式 */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.popup-content {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  max-width: 450px;
  width: 90%;
  animation: popupAnim 0.3s ease;
}

@keyframes popupAnim {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.popup-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: #343a40;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #adb5bd;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: #f1f3f5;
  color: #495057;
}

.popup-body p {
  margin: 12px 0;
  font-size: 16px;
  line-height: 1.6;
}

.popup-body strong {
  color: #333;
  font-weight: 600;
}

.help-icon {
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background-color: #ced4da;
  border-radius: 50%;
  color: white;
  font-size: 12px;
  cursor: help;
  transition: all 0.2s ease;
}

.help-icon:hover {
  background-color: #007bff;
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .step-content {
    padding: 20px 15px;
  }

  .input-with-button {
    flex-direction: column;
  }

  .city-input,
  .address-input {
    flex: 1;
  }

  .address-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}
</style>
