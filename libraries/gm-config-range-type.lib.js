// ==UserScript==
// @namespace   https://benblank.github.io/user-scripts/
// @exclude     *

// ==UserLibrary==
// @name        Range type for GM_config
// @version     1.0
// @author      Ben "535" Blank
// @description Provides a range (slider) custom type for use with GM_config.
// @homepageURL https://benblank.github.io/user-scripts/libraries/gm-config-range-type.html
// @supportURL  https://github.com/benblank/user-scripts/issues
// @icon        https://benblank.github.io/user-scripts/libraries/gm-config-range-type.icon.png
// @license     BSD-3-Clause
// @copyright   2022 Ben Blank
// ==/UserLibrary==

// ==/UserScript==

(() => {
  /** Format a value as a string, using the supplied unit names.
   *
   * If the unit labels are missing or empty, the value is converted to a string
   * and returned as-is. If the unit labels are a single string, that string is
   * appended to the formatted value. If the unit labels are an array of
   * strings, the first label will be appended if the value is exactly one.
   * Otherwise, the second label will be used.
   *
   * @param {any} value The value to format.
   * @param {string|[string, string]?} unitLabels The unit label(s) to use.
   * @returns {string} The formatted value.
   */
  function formatValueWithUnits(value, unitLabels) {
    if (!unitLabels) {
      return String(value);
    }

    if (Array.isArray(unitLabels)) {
      return `${value}${unitLabels[value === 1 ? 0 : 1]}`;
    }

    return `${value}${unitLabels}`;
  }

  window.GM_config_range_type = {
    reset() {
      if (this.wrapper) {
        this.wrapper.querySelector(`#${this.configId}_field_${this.id}`).value = this.settings.default;
      }
    },

    toNode() {
      const container = this.create('div', {
        className: 'config_var',
        id: `${this.configId}_${this.id}_var`,
        title: this.title || '',
      });

      container.appendChild(
        this.create('label', {
          className: 'field_label',
          for: `${this.configId}_field_${this.id}`,
          id: `${this.configId}_${this.id}_field_label`,
          innerHTML: this.settings.label,
        }),
      );

      const input = this.create('input', {
        id: `${this.configId}_field_${this.id}`,
        max: this.settings.max,
        min: this.settings.min,
        step: this.settings.step,
        type: 'range',
        value: this.value,
      });

      const currentValue = this.create('span', {
        className: `${this.configId}_${this.id}_current_value`,
        innerHTML: formatValueWithUnits(this.value, this.settings.unitLabels),
      });

      input.addEventListener(
        'input',
        () => {
          currentValue.textContent = formatValueWithUnits(input.valueAsNumber, this.settings.unitLabels);
        },
        { passive: true },
      );

      container.appendChild(input);
      container.appendChild(currentValue);

      return container;
    },

    toValue() {
      if (this.wrapper) {
        return this.wrapper.querySelector(`#${this.configId}_field_${this.id}`).valueAsNumber;
      }
    },
  };
})();
