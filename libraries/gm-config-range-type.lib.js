// ==UserScript==
// @namespace   https://benblank.github.io/user-scripts/
// @exclude     *

// ==UserLibrary==
// @name        Range type for GM_config
// @version     1.0.3
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
   * @param {string|[string, string]?} settings.unitLabels The unit label(s) to
   * use.
   * @returns {string} The formatted value.
   */
  function defaultFormatter(value, { unitLabels }) {
    if (!unitLabels) {
      return String(value);
    }

    if (Array.isArray(unitLabels)) {
      return `${value}${unitLabels[value === 1 ? 0 : 1]}`;
    }

    return `${value}${unitLabels}`;
  }

  /** Pick specific properties, if present, from an object.
   *
   * If a specified property is absent from the source object, it will also be
   * absent in the result object.
   *
   * Properties are created using simple assignment. If the source property has
   * a non-primitive value (e.g. an array), the result object's property will
   * point to the exact same value, not a copy of it.
   *
   * @param {{[key: string]: unknown}} source The object from which to pick
   * properties.
   * @param {Array<string>} keys The keys of the properties to pick.
   * @returns {{[key: string]: unknown}} A new object containing only the
   * selected properties.
   */
  function pick(source, keys) {
    const result = {};

    keys.forEach((key) => {
      if (key in source) {
        result[key] = source[key];
      }
    });

    return result;
  }

  window.GM_config_range_type = {
    reset() {
      if (this.wrapper) {
        this.wrapper.querySelector(`#${this.configId}_field_${this.id}`).value = this.settings.default;

        this.wrapper.querySelector(`.${this.configId}_${this.id}_current_value`).textContent = (
          this.settings.formatter ?? defaultFormatter
        )(this.settings.default, this.settings);
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

      const formatter = this.settings.formatter ?? defaultFormatter;

      const input = this.create('input', {
        id: `${this.configId}_field_${this.id}`,
        type: 'range',
        ...pick(this.settings, ['min', 'max', 'step']),
        value: this.value,
      });

      const currentValue = this.create('span', {
        className: `${this.configId}_${this.id}_current_value`,
        innerHTML: formatter(this.value, this.settings),
      });

      input.addEventListener(
        'input',
        () => {
          currentValue.textContent = formatter(input.valueAsNumber, this.settings);
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
