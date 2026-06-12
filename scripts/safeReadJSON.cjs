const fs = require('fs');

/**
 * 安全读取并解析 JSON 文件，失败时输出清晰错误信息
 * @param {string} filePath 文件路径
 * @param {boolean} [exitOnError=true] 解析失败时是否退出进程
 * @returns {any} 解析后的 JSON
 */
function safeReadJSON(filePath, exitOnError = true) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    const msg = `❌ JSON 解析失败: ${filePath}\n   ${e.message}`;
    if (exitOnError) {
      console.error(msg);
      process.exit(1);
    }
    throw new Error(msg);
  }
}

module.exports = { safeReadJSON };
