<template>
  <div class="step-navigation">
    <div
      class="step"
      :class="{ active: currentStep === 1 }"
      @click="$emit('update:step', 1)"
    >
      <span class="step-label">地址选择</span>
    </div>
    <div
      class="step"
      :class="{ active: currentStep === 2, disabled: addressCount < 2 }"
      @click="addressCount >= 2 ? $emit('update:step', 2) : null"
    >
      <span class="step-label">通勤分析</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  currentStep: {
    type: Number,
    required: true
  },
  addressCount: {
    type: Number,
    required: true
  }
});

defineEmits(['update:step']);
</script>

<style scoped>
/* Step navigation styles */
.step-navigation {
  display: flex;
  margin-bottom: 30px;
  border-bottom: 2px solid #e0e0e0;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.step {
  flex: 1;
  text-align: center;
  padding: 20px 0;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  font-weight: 600;
  color: #6c757d;
}

.step:not(:last-child):after {
  content: "";
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  width: 1px;
  height: 30px;
  background-color: #e0e0e0;
}

.step.active {
  color: #007bff;
  background-color: rgba(0, 123, 255, 0.05);
}

.step.active:before {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #007bff, #00bcd4);
  border-radius: 4px 4px 0 0;
}

.step.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.step-label {
  font-size: 18px;
  letter-spacing: 0.5px;
}
</style>
