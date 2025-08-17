import { defineStore } from 'pinia';

export const useCommuteStore = defineStore('commute', {
  state: () => ({
    topOptimalCommutes: [],
    optionsByFrom: [],
    addressesChanged: false,
    isLoading: false,
    searchingBusTaskCount: 0
  }),
  actions: {
    resetAnalysisState() {
      this.optionsByFrom = [];
      this.topOptimalCommutes = [];
    }
  }
});
