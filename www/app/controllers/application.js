
import { computed } from '@ember/object';
import $ from 'jquery';
import config from '../config/environment';

export default Ember.Controller.extend({
  get config() {
    return config.APP;
  },

  height: Ember.computed('model.nodes', {
    get() {
      var node = this.get('bestNode');
      if (node) {
        return node.height;
      }
      return 0;
    }
  }),

  roundShares: Ember.computed('model.stats', {
    get() {
      return parseInt(this.get('model.stats.roundShares'));
    }
  }),

  difficulty: Ember.computed('model.nodes', {
    get() {
      var node = this.get('bestNode');
      if (node) {
        return node.difficulty;
      }
      return 0;
    }
  }),

  ethinr: Ember.computed('stats', {
    get() {
      return parseFloat(this.get('model.exchangedata.price_inr'));
    }
  }),

  ethusd: Ember.computed('stats', {
    get() {
      return parseFloat(this.get('model.exchangedata.current_price'));
    }
  }),

  blockTime: Ember.computed('model.nodes', {
    get() {
      var node = this.get('bestNode');
      if (node && node.blocktime) {
        return node.blocktime;
      }
      return config.APP.BlockTime;
    }
  }),

  hashrate: Ember.computed('difficulty', {
    get() {
      var blockTime = this.get('blockTime');
      return this.getWithDefault('difficulty', 0) / blockTime;
    }
  }),

  immatureTotal: Ember.computed('model', {
    get() {
      return this.getWithDefault('model.immatureTotal', 0) + this.getWithDefault('model.candidatesTotal', 0);
    }
  }),

  bestNode: Ember.computed('model.nodes', {
    get() {
      var node = null;
      this.get('model.nodes').forEach(function (n) {
        if (!node) {
          node = n;
        }
        if (node.height < n.height) {
          node = n;
        }
      });
      return node;
    }
  }),

  lastBlockFound: Ember.computed('model', {
    get() {
      return parseInt(this.get('model.lastBlockFound')) || 0;
    }
  }),

  roundVariance: Ember.computed('model', {
    get() {
      var percent = this.get('model.stats.roundShares') / this.get('difficulty');
      if (!percent) {
        return 0;
      }
      return percent.toFixed(2);
    }
  }),

  nextEpoch: Ember.computed('height', {
    get() {
      var epochOffset = (60000 - (this.getWithDefault('height', 1) % 60000)) * 1000 * this.get('blockTime');
      return Date.now() + epochOffset;
    }
  }),
  languages: computed('model', {
    get() {
      return this.get('model.languages');
    }
  }),

  selectedLanguage: computed({
    get() {
      var langs = this.get('languages');
      var lang = $.cookie('lang');
      for (var i = 0; i < langs.length; i++) {
        if (langs[i].value == lang) {
          return langs[i].name;
        }
      }
      return lang;
    }
  })
});
