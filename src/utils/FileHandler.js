/**
 * Utility for saving and loading flowchart graphs.
 */
export class FileHandler {
  /**
   * Downloads current diagram as a formatted .json file.
   * @param {Object} data - Flowchart canvas export data
   * @param {string} [filename]
   */
  static saveToFile(data, filename = 'flowchart.json') {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Reads a JSON file selected by the user via File input.
   * @param {File} file
   * @returns {Promise<Object>}
   */
  static loadFromFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new Error('No file provided.'));
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          resolve(parsed);
        } catch (err) {
          reject(new Error('Invalid JSON file format.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsText(file);
    });
  }

  /**
   * Saves current diagram state to localStorage.
   * @param {Object} data
   */
  static saveToLocalStorage(data) {
    try {
      const moduleData = data?.drawflow?.Home?.data || data?.data;
      if (moduleData && Object.keys(moduleData).length > 0) {
        localStorage.setItem('flowchart_c_autosave', JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Auto-save to localStorage failed:', e);
    }
  }

  /**
   * Loads auto-saved diagram state from localStorage.
   * @returns {Object|null}
   */
  static loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('flowchart_c_autosave');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      const moduleData = parsed?.drawflow?.Home?.data || parsed?.data;
      if (moduleData && Object.keys(moduleData).length > 0) {
        return parsed;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Clears auto-saved diagram in localStorage.
   */
  static clearLocalStorage() {
    try {
      localStorage.removeItem('flowchart_c_autosave');
    } catch (e) {
      // Ignore
    }
  }
}
